const db = require('../db');
const { logActivity } = require('../utils/auditLogger');

/**
 * Worker Portal: Get all assigned jobs
 */
exports.getMyJobs = async (req, res) => {
  try {
    const worker = await db.worker.findUnique({ where: { userId: req.user.id } });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const bookings = await db.booking.findMany({
      where: { workerId: worker.id }
    });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve jobs.' });
  }
};

/**
 * Transition assigned booking progress status
 */
const { sendEmail } = require('../utils/email');
const Razorpay = require('razorpay');

exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide target booking status.' });
    }

    // Load full booking including user relations
    const booking = await db.booking.findUnique({ 
      where: { id: req.params.id },
      include: { user: true }
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Role gate: Only Admin can update status under the new flow
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only admins can transition booking status.' });
    }

    const updateData = { 
      status,
      booking_status: status === 'PENDING' ? 'New Booking' : 
                      status === 'ASSIGNED' ? 'Assigned' : 
                      status === 'ON_THE_WAY' ? 'On The Way' : 
                      status === 'CANCELLED' ? 'Cancelled' : status
    };

    const customerEmail = booking.email || booking.user?.email;

    // 1. If status is ON_THE_WAY, send email notification
    if (status === 'ON_THE_WAY') {
      await db.notification.create({
        data: {
          userId: booking.userId,
          type: 'BOOKING_ALERT',
          title: 'Partner On The Way!',
          message: `Your professional ${booking.partnerName || 'expert'} is on the way! Estimated arrival in 9 minutes.`
        }
      }).catch(() => {});

      if (customerEmail) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #06b6d4; text-align: center;">JK Home Care</h2>
            <p>Hello,</p>
            <p>Your service partner is now <strong>On The Way</strong> for booking <strong>#${booking.id.substring(0,8).toUpperCase()}</strong>!</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin: 0;">Estimated Arrival Time: Within 9 Minutes</p>
            </div>
            <p><strong>Partner Name:</strong> ${booking.partnerName || 'N/A'}</p>
            <p><strong>Partner Mobile:</strong> ${booking.partnerMobile || 'N/A'}</p>
            <p>Please ensure someone is available at your doorstep to receive the service partner.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 JK Home Care. All rights reserved.</p>
          </div>
        `;
        sendEmail({
          to: customerEmail,
          subject: `JK Home Care - Partner On The Way for Booking #${booking.id.substring(0,8).toUpperCase()}`,
          html: htmlContent
        }).catch(err => console.error('Error sending on-the-way email:', err.message));
      }
    }

    // 2. If status is CANCELLED, handle refund + emails
    if (status === 'CANCELLED') {
      logActivity(req, {
        userId: req.user.id,
        eventType: 'BOOKING',
        action: 'BOOKING_CANCELLED',
        details: { bookingId: booking.id }
      });

      const paymentId = booking.paymentId || booking.transaction_id;
      const wasPaid = booking.paymentStatus === 'PAID' || booking.payment_status === 'Paid';
      
      let refundId = null;

      if (wasPaid && paymentId && paymentId !== 'N/A') {
        const isSimulated = paymentId.startsWith('pay_sim_') || paymentId.startsWith('order_mock_') || !process.env.RAZORPAY_KEY_SECRET;
        
        if (isSimulated) {
          refundId = `ref_sim_${Math.random().toString(36).substring(2,10)}`;
          console.log(`✉️ [Refund System] Simulated Refund processed successfully for simulated payment ${paymentId}. Refund ID: ${refundId}`);
        } else {
          try {
            console.log(`✉️ [Refund System] Initiating Razorpay Refund for payment ${paymentId}...`);
            const razorpayClient = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET
            });
            
            const refund = await razorpayClient.payments.refund(paymentId, {
              amount: Math.round(booking.finalPrice * 100), // amount in paise
              notes: { bookingId: booking.id, reason: 'Admin cancelled booking' }
            });
            refundId = refund.id;
            console.log(`✉️ [Refund System] Razorpay Refund completed. Refund ID: ${refundId}`);
          } catch (refundError) {
            console.error('💥 [Refund System Error] Razorpay refund failed:', refundError.message);
            return res.status(500).json({ success: false, message: `Status update failed: Razorpay refund failed: ${refundError.message}` });
          }
        }

        updateData.paymentStatus = 'REFUNDED';
        updateData.payment_status = 'Refunded';
        updateData.refundId = refundId;
      }

      // Create Notification
      await db.notification.create({
        data: {
          userId: booking.userId,
          type: 'SYSTEM_ALERT',
          title: 'Booking Cancelled & Refunded',
          message: `Your booking #${booking.id.substring(0,8)} has been cancelled. A full refund of Rs. ${booking.finalPrice} was initiated.`
        }
      }).catch(() => {});

      // Send Cancellation & Refund Email
      if (customerEmail) {
        const refundDetailsHtml = refundId ? `
          <div style="background-color: #f0fdfa; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ccfbf1;">
            <h3 style="margin-top: 0; color: #0d9488;">Refund Confirmation</h3>
            <p style="margin: 5px 0;"><strong>Refund Amount:</strong> Rs. ${booking.finalPrice}</p>
            <p style="margin: 5px 0;"><strong>Refund Reference ID:</strong> ${refundId}</p>
            <p style="margin: 5px 0; font-size: 11px; color: #0f766e;">The refunded amount will reflect in your account within 5-7 business days.</p>
          </div>
        ` : '';

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #e11d48; text-align: center;">Booking Cancelled</h2>
            <p>Hello,</p>
            <p>Your booking <strong>#${booking.id.substring(0,8).toUpperCase()}</strong> has been cancelled by the administrator.</p>
            ${refundDetailsHtml}
            <p>If you have any questions or require further assistance, please contact our customer support team.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 JK Home Care. All rights reserved.</p>
          </div>
        `;

        sendEmail({
          to: customerEmail,
          subject: `JK Home Care - Cancellation & Refund confirmation for Booking #${booking.id.substring(0,8).toUpperCase()}`,
          html: htmlContent
        }).catch(err => console.error('Error sending cancellation email:', err.message));
      }
    }

    // 3. Update Booking
    const updated = await db.booking.update({
      where: { id: booking.id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: `Job status transitioned successfully to ${status}.`,
      booking: updated
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job status.' });
  }
};

/**
 * ADMIN: Get all workers list and payroll ledger
 */
exports.getAllWorkers = async (req, res) => {
  try {
    const workers = await db.worker.findMany({});
    
    // Calculate salary due or ledger values
    const payrollLedger = workers.map(w => {
      return {
        id: w.id,
        name: w.user ? w.user.name : 'Unknown Worker',
        email: w.user ? w.user.email : '',
        phone: w.user ? w.user.phone : '',
        status: w.status,
        rating: w.rating,
        totalJobs: w.totalJobs,
        commissionRate: `${w.commissionRate * 100}%`,
        skills: w.skills ? w.skills.map(s => s.name).join(', ') : ''
      };
    });

    res.status(200).json({
      success: true,
      workers: payrollLedger
    });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve worker ledger.' });
  }
};

/**
 * ADMIN: Toggle worker active / inactive status
 */
exports.toggleWorkerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status (AVAILABLE, INACTIVE).' });
    }

    const updated = await db.worker.update({
      where: { id: req.params.id },
      data: { status }
    });

    // Audit logs
    logActivity(req, {
      userId: req.user.id,
      eventType: 'ADMIN',
      action: 'WORKER_STATUS_CHANGE',
      details: { workerId: req.params.id, status }
    });

    res.status(200).json({
      success: true,
      message: `Worker status toggled successfully to ${status}.`,
      worker: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle status.' });
  }
};

/**
 * Worker Portal: Get matching category-specific booking requests
 */
exports.getCategoryRequests = async (req, res) => {
  try {
    const worker = await db.worker.findUnique({
      where: { userId: req.user.id },
      include: {
        skills: {
          include: {
            service: true
          }
        }
      }
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    // Extract all service categories and service IDs that this worker specializes in
    const workerCategories = worker.skills.map(s => s.service.category);
    const workerServiceIds = worker.skills.map(s => s.service.id);

    // Get rejections from in-memory cache
    const { workerRejections } = require('./bookingController');
    const rejectedIds = workerRejections[worker.id] || [];

    // Fetch all bookings with status PENDING_PARTNER_ACCEPTANCE that match
    const bookings = await db.booking.findMany({
      where: {
        status: 'PENDING_PARTNER_ACCEPTANCE',
        OR: [
          {
            serviceCategory: {
              in: workerCategories
            }
          },
          {
            items: {
              some: {
                serviceId: {
                  in: workerServiceIds
                }
              }
            }
          }
        ],
        id: {
          notIn: rejectedIds
        }
      },
      include: {
        items: {
          include: {
            service: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get category requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve booking requests.' });
  }
};
