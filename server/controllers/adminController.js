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
    
    const worker = await db.worker.update({
      where: { id },
      data: { approvalStatus: 'REJECTED' },
      include: { user: true }
    });

    // Create Notification
    await db.notification.create({
      data: {
        userId: worker.userId,
        type: 'ADMIN_UPDATE',
        title: 'Account Rejected',
        message: 'Your Service Partner application was rejected. Please contact support.'
      }
    });

    res.status(200).json({ success: true, message: 'Worker rejected', worker });
  } catch (error) {
    console.error('Error rejecting worker:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get high-level analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalWorkers = await db.worker.count();
    const pendingWorkers = await db.worker.count({ where: { approvalStatus: 'PENDING' } });
    const totalBookings = await db.booking.count();
    const completedBookings = await db.booking.count({ where: { status: 'COMPLETED' } });
    
    // Sum total revenue
    const revenueObj = await db.booking.aggregate({
      _sum: { finalPrice: true },
      where: { status: 'COMPLETED', paymentStatus: 'PAID' }
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalWorkers,
        pendingWorkers,
        totalBookings,
        completedBookings,
        revenue: revenueObj._sum.finalPrice || 0
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
