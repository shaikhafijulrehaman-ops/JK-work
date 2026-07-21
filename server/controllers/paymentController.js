const crypto = require('crypto');
const Razorpay = require('razorpay');
const db = require('../db');
const { logActivity } = require('../utils/auditLogger');

const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// initializePayment and simulatePaymentSuccess removed for production security

/**
 * SECURE: Verify Razorpay webhook signature on backend
 * Guarantees zero frontend manipulation.
 */
exports.razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing payment signature header.' });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Hash request body using crypto HMAC-SHA256
    const payload = req.rawBody || JSON.stringify(req.body);
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(payload);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      console.warn('⚠️ [Payment Gateway] Invalid Razorpay webhook signature detected.');
      return res.status(400).json({ success: false, message: 'Signature validation failed.' });
    }

    console.log('✅ [Payment Gateway] Webhook signature verified. Processing transaction...');

    // Extract payload details
    const event = req.body.event;
    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const amount = paymentEntity.amount / 100; // Razorpay records in paise
      const paymentId = paymentEntity.id;
      const orderId = paymentEntity.order_id;
      const notes = paymentEntity.notes; // Custom meta tags sent from client
      
      const bookingId = notes ? notes.bookingId : null;

      if (bookingId) {
        const booking = await db.booking.findUnique({ where: { id: bookingId } });
        if (booking) {
          // Idempotency: Skip if already paid to prevent duplicate processing
          if (booking.paymentStatus === 'PAID') {
            console.log(`⚠️ [Payment Gateway] Duplicate webhook for booking ${bookingId}. Already PAID. Skipping.`);
            return res.status(200).json({ status: 'ok' });
          }

          await db.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: 'PAID',
              payment_status: 'Paid',
              transaction_id: paymentId,
              paymentId,
              paymentMethod: 'CARD'
            }
          });

          // Audit Log
          logActivity(req, {
            userId: booking.userId,
            eventType: 'PAYMENT',
            action: 'PAYMENT_SUCCESS',
            details: { bookingId: booking.id, amount, paymentId }
          });

          // Dispatch Notification to customer
          await db.notification.create({
            data: {
              userId: booking.userId,
              type: 'PAYMENT_SUCCESS',
              title: 'Payment Received Securely!',
              message: `Rs. ${amount} captured under Reference #${paymentId}. Your service call is active.`
            }
          }).catch(() => {});
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = req.body.payload.payment.entity;
      const amount = paymentEntity.amount / 100;
      const paymentId = paymentEntity.id;
      const notes = paymentEntity.notes;
      const bookingId = notes ? notes.bookingId : null;

      if (bookingId) {
        const booking = await db.booking.findUnique({ where: { id: bookingId } });
        if (booking) {
          await db.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: 'FAILED'
            }
          }).catch(() => {});

          // Audit Log
          logActivity(req, {
            userId: booking.userId,
            eventType: 'PAYMENT',
            action: 'PAYMENT_FAILED',
            details: { bookingId: booking.id, amount, paymentId }
          });

          // Dispatch Notification to customer
          await db.notification.create({
            data: {
              userId: booking.userId,
              type: 'SYSTEM_ALERT',
              title: 'Payment Failed',
              message: `Your payment of Rs. ${amount} for booking #${booking.id.substring(0,8)} failed. Reference #${paymentId}.`
            }
          }).catch(() => {});
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Internal Webhook error.' });
  }
};

// simulatePaymentSuccess removed for production security

/**
 * Standard Razorpay Order Creation
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ [Payment Gateway] Missing Razorpay Key ID or Secret in environment variables.');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway configuration is missing on the server.'
      });
    }

    if (!amount || isNaN(amount) || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Minimum amount is 100 paise (Rs. 1).'
      });
    }

    // Sanitize receipt to contain only valid alphanumeric, underscore, or hyphen characters up to 40 chars
    const cleanReceipt = (receipt || `order_${Date.now()}`)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .substring(0, 40) || `order_${Date.now()}`;

    const options = {
      amount: Math.round(amount), // in paise
      currency: currency || 'INR',
      receipt: cleanReceipt
    };

    const order = await razorpayClient.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    if (error.statusCode === 401) {
      return res.status(401).json({ success: false, message: 'Razorpay authentication failed. Check API keys.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create payment order.' });
  }
};

/**
 * Standard Razorpay Signature Verification
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields.'
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const bodyStr = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyStr)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('⚠️ [Payment Verification] Signature verification failed.');
      return res.status(400).json({
        success: false,
        message: 'Payment signature mismatch. Transaction is not verified.'
      });
    }

    console.log('✅ [Payment Verification] Payment signature verified successfully!');

    // Update booking if bookingId is provided
    if (bookingId) {
      let verifyAttempts = 0;
      const maxVerifyAttempts = 3;
      while (verifyAttempts < maxVerifyAttempts) {
        try {
          verifyAttempts++;
          const booking = await db.booking.findUnique({ where: { id: bookingId } });
          if (booking) {
            await db.booking.update({
              where: { id: booking.id },
              data: {
                paymentStatus: 'PAID',
                payment_status: 'Paid',
                transaction_id: razorpay_payment_id,
                paymentId: razorpay_payment_id,
                paymentMethod: 'CARD'
              }
            });

            // Audit Log
            logActivity(req, {
              userId: booking.userId,
              eventType: 'PAYMENT',
              action: 'PAYMENT_SUCCESS',
              details: { bookingId: booking.id, amount: booking.finalPrice, paymentId: razorpay_payment_id }
            });

            // Notify User
            await db.notification.create({
              data: {
                userId: booking.userId,
                type: 'PAYMENT_SUCCESS',
                title: 'Payment Confirmed!',
                message: `Your payment of Rs. ${booking.finalPrice} has been verified successfully. Ref: ${razorpay_payment_id}.`
              }
            }).catch(() => {});
          }
          break; // Success! Exit retry loop
        } catch (dbErr) {
          console.warn(`⚠️  [Payment Verification] DB update attempt ${verifyAttempts} failed: ${dbErr.message}`);
          if (verifyAttempts < maxVerifyAttempts) {
            await new Promise(resolve => setTimeout(resolve, verifyAttempts * 500));
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and captured successfully.'
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
};
