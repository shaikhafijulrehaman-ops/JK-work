const db = require('../db');

// Get all workers filtered by approval status
exports.getWorkers = async (req, res) => {
  try {
    const { status } = req.query; // PENDING, APPROVED, REJECTED
    
    const whereClause = status ? { approvalStatus: status } : {};

    const workers = await db.worker.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        skills: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log("Partner Approval Center Fetch Result");
    console.log("Full Database Response (Workers):", JSON.stringify(workers, null, 2));

    res.status(200).json({ success: true, workers });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Approve a worker
exports.approveWorker = async (req, res) => {
  try {
    const { id } = req.params;
    
    const worker = await db.worker.update({
      where: { id },
      data: { approvalStatus: 'APPROVED' },
      include: { user: true }
    });

    // Create Notification
    await db.notification.create({
      data: {
        userId: worker.userId,
        type: 'ADMIN_UPDATE',
        title: 'Account Approved!',
        message: 'Your Service Partner account has been approved. You can now accept bookings.'
      }
    });

    // SMS/WhatsApp/Email Dispatch Logs
    const dispatchMessage = `Congratulations! Your JK Enterprises Service Partner account has been approved. You can now log in and start accepting bookings.`;
    console.log(`💬 [SMS Dispatch mock] To: ${worker.user.phone} - Msg: ${dispatchMessage}`);
    console.log(`💬 [WhatsApp Dispatch mock] To: ${worker.user.phone} - Msg: ${dispatchMessage}`);
    console.log(`✉️ [Mail Gateway mock] To: ${worker.user.email} - Msg: ${dispatchMessage}`);

    res.status(200).json({ success: true, message: 'Worker approved successfully', worker });
  } catch (error) {
    console.error('Error approving worker:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reject a worker
exports.rejectWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const reasonText = rejectionReason || 'Document verification failed or details mismatched.';
    
    const worker = await db.worker.update({
      where: { id },
      data: { 
        approvalStatus: 'REJECTED',
        availability: reasonText
      },
      include: { user: true }
    });

    // Create Notification
    await db.notification.create({
      data: {
        userId: worker.userId,
        type: 'ADMIN_UPDATE',
        title: 'Account Rejected',
        message: `Your Service Partner application was rejected. Reason: ${reasonText}`
      }
    });

    // SMS/WhatsApp/Email Dispatch Logs
    const rejectMessage = `Dear Partner, your JK Enterprises Service Partner application was unfortunately rejected. Reason: ${reasonText}. Please contact support at support@jkenterprises.com for details.`;
    console.log(`💬 [SMS Dispatch mock] To: ${worker.user.phone} - Msg: ${rejectMessage}`);
    console.log(`💬 [WhatsApp Dispatch mock] To: ${worker.user.phone} - Msg: ${rejectMessage}`);
    console.log(`✉️ [Mail Gateway mock] To: ${worker.user.email} - Msg: ${rejectMessage}`);

    res.status(200).json({ success: true, message: 'Worker rejected successfully', worker });
  } catch (error) {
    console.error('Error rejecting worker:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update worker status manually (e.g. to UNDER_REVIEW)
exports.updateWorkerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // PENDING, UNDER_REVIEW, APPROVED, REJECTED
    
    if (!['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid approval status.' });
    }

    const worker = await db.worker.update({
      where: { id },
      data: { approvalStatus: status },
      include: { user: true }
    });

    // Create Notification
    await db.notification.create({
      data: {
        userId: worker.userId,
        type: 'ADMIN_UPDATE',
        title: `Account Status: ${status.replace('_', ' ')}`,
        message: `Your Service Partner account status is now ${status.replace('_', ' ')}.`
      }
    });

    res.status(200).json({ success: true, message: `Worker status updated to ${status}`, worker });
  } catch (error) {
    console.error('Error updating worker status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get high-level analytics
exports.getAnalytics = async (req, res) => {
  try {
    let totalWorkers = 0;
    let pendingWorkers = 0;
    let totalBookings = 0;
    let completedBookings = 0;
    let revenue = 0;

    if (db.isSandbox()) {
      const workers = await db.worker.findMany();
      totalWorkers = workers.length;
      pendingWorkers = workers.filter(w => w.approvalStatus === 'PENDING').length;
      
      const bookings = await db.booking.findMany();
      totalBookings = bookings.length;
      const completed = bookings.filter(b => b.status === 'COMPLETED');
      completedBookings = completed.length;
      revenue = completed.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    } else {
      totalWorkers = await db.worker.count();
      pendingWorkers = await db.worker.count({ where: { approvalStatus: 'PENDING' } });
      totalBookings = await db.booking.count();
      completedBookings = await db.booking.count({ where: { status: 'COMPLETED' } });
      
      const revenueObj = await db.booking.aggregate({
        _sum: { finalPrice: true },
        where: { status: 'COMPLETED', paymentStatus: 'PAID' }
      });
      revenue = revenueObj._sum.finalPrice || 0;
    }

    res.status(200).json({
      success: true,
      analytics: {
        totalWorkers,
        pendingWorkers,
        totalBookings,
        completedBookings,
        revenue
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all database records for the unified Admin SaaS dashboard
exports.getDashboardData = async (req, res) => {
  try {
    // 1. Fetch all bookings (include users and assigned workers)
    const bookings = await db.booking.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        worker: {
          include: {
            user: { select: { name: true, phone: true, email: true } }
          }
        },
        items: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch all workers (include users and skills)
    const workers = await db.worker.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        skills: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Fetch all customers (role = USER)
    const customers = await db.user.findMany({
      where: { role: 'USER' },
      select: { id: true, name: true, email: true, phone: true, pincode: true, serviceArea: true, createdAt: true }
    });

    // 4. Fetch all services
    const services = await db.service.findMany({});

    console.log("Partner Approval Center Fetch Result");
    console.log("Full Database Response (Workers):", JSON.stringify(workers, null, 2));

    res.status(200).json({
      success: true,
      bookings,
      workers,
      customers,
      services
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard data' });
  }
};
