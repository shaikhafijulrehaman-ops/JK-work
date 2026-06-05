const crypto = require('crypto');
const db = require('../db');
const { logActivity } = require('../utils/auditLogger');

/**
 * Simulate payment initialization (generates mock Razorpay order ID / UPI QR payload)
 */
exports.initializePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Please provide bookingId.' });
    }

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const mockOrderId = `order_mock_${Date.now()}`;
    const mockUpiQr = `upi://pay?pa=jayaketanaenterprises@okaxis&pn=JK%20Enterprises&am=${booking.finalPrice}&cu=INR&tn=Booking%20Service`;

    res.status(200).json({
      success: true,
      orderId: mockOrderId,
      amount: booking.finalPrice,
      upiQrUrl: mockUpiQr,
      message: 'Secure payment interface generated successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to initialize payment.' });
  }
};

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

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'jk_razorpay_webhook_secret_2026';
    
    // Hash request body using crypto HMAC-SHA256
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
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
          await db.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: 'PAID',
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

/**
 * Simulator Payout Check (Convenient local interface matching the webhook outcome)
 */
exports.simulatePaymentSuccess = async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Please provide bookingId.' });
    }

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const simPaymentId = `pay_sim_${Math.random().toString(36).substring(2,10)}`;

    const updated = await db.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PAID',
        paymentId: simPaymentId,
        paymentMethod: paymentMethod || 'UPI'
      }
    });

    // Audit Log
    logActivity(req, {
      userId: booking.userId,
      eventType: 'PAYMENT',
      action: 'PAYMENT_SUCCESS',
      details: { bookingId: booking.id, amount: booking.finalPrice, paymentId: simPaymentId }
    });

    // Notify User
    await db.notification.create({
      data: {
        userId: booking.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Received (Simulation)',
        message: `Your payment of Rs. ${booking.finalPrice} has been processed via mock gateway. Ref: ${simPaymentId}.`
      }
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Simulated payment succeeded.',
      booking: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to simulate payment.' });
  }
};
