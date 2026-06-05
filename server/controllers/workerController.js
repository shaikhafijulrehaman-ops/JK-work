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
exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide target booking status.' });
    }

    const booking = await db.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Role gate: Only the assigned worker or admin can transition status
    const worker = await db.worker.findUnique({ where: { userId: req.user.id } });
    if (req.user.role !== 'ADMIN' && (!worker || booking.workerId !== worker.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You are not assigned to this job.' });
    }

    const updateData = { status };

    // 1. If status is ON_THE_WAY, update worker state to ON_JOB
    if (status === 'ON_THE_WAY' && worker) {
      await db.worker.update({
        where: { id: worker.id },
        data: { status: 'ON_JOB' }
      }).catch(() => {});
    }

    // 2. If status is COMPLETED, calculate dynamic commission and store earnings
    if (status === 'COMPLETED') {
      const activeWorker = worker || await db.worker.findUnique({ where: { id: booking.workerId } });
      const commissionRate = activeWorker ? activeWorker.commissionRate : 0.70; // Default 70% commission
      
      const workerEarnings = parseFloat((booking.finalPrice * commissionRate).toFixed(2));
      updateData.workerEarnings = workerEarnings;
      updateData.paymentStatus = 'PAID'; // Mark auto paid on completion if not already
      updateData.payment_status = 'Paid';

      // Free worker and increment count
      if (activeWorker) {
        await db.worker.update({
          where: { id: activeWorker.id },
          data: { 
            status: 'AVAILABLE',
            totalJobs: activeWorker.totalJobs + 1
          }
        }).catch(() => {});
      }

      // Send completed alert
      await db.notification.create({
        data: {
          userId: booking.userId,
          type: 'PAYMENT_SUCCESS',
          title: 'Job Completed Successfully!',
          message: `Your professional has marked the job as completed. Please leave a rating and share your review!`
        }
      }).catch(() => {});
    }

    // 3. Update Booking
    const updated = await db.booking.update({
      where: { id: booking.id },
      data: updateData
    });

    if (status === 'CANCELLED') {
      logActivity(req, {
        userId: req.user.id,
        eventType: 'BOOKING',
        action: 'BOOKING_CANCELLED',
        details: { bookingId: booking.id }
      });
    }

    // Notify Customer about state shift
    await db.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING_ALERT',
        title: `Service Status Updated: ${status.replace(/_/g, ' ')}`,
        message: `Your JK service professional is now: "${status.replace(/_/g, ' ')}". Check your live tracking dashboard.`
      }
    }).catch(() => {});

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
