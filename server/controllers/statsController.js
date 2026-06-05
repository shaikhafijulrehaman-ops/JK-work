const db = require('../db');

/**
 * ADMIN: Get dashboard metrics and charts statistics
 */
exports.getAdminStats = async (req, res) => {
  try {
    const bookings = await db.booking.findMany({});
    const workers = await db.worker.findMany({});
    const users = await db.user.findMany({ where: { role: 'USER' } });

    // 1. Calculate general stats
    const totalBookings = bookings.length;
    const paidBookings = bookings.filter(b => b.paymentStatus === 'PAID' || b.payment_status === 'Paid');
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    const totalSales = paidBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0.0);
    
    const activeWorkersCount = workers.filter(w => w.status === 'AVAILABLE').length;
    const onJobWorkersCount = workers.filter(w => w.status === 'ON_JOB').length;
    const utilizationRate = workers.length > 0 
      ? Math.round((onJobWorkersCount / workers.length) * 100) 
      : 0;

    // 2. Formulate dynamic charts dataset (last 7 days dynamically from real data)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        dateStr: d.toDateString(),
        day: daysOfWeek[d.getDay()],
        bookings: 0,
        sales: 0
      });
    }

    bookings.forEach(b => {
      const bDateStr = new Date(b.createdAt).toDateString();
      const dayObj = last7Days.find(d => d.dateStr === bDateStr);
      if (dayObj) {
        dayObj.bookings++;
        if (b.paymentStatus === 'PAID' || b.payment_status === 'Paid') {
          dayObj.sales += b.finalPrice || 0;
        }
      }
    });

    const dailySales = last7Days.map(d => ({
      day: d.day,
      bookings: d.bookings,
      sales: d.sales
    }));

    // Top services mapping from real categories
    const categoryCounts = {};
    bookings.forEach(b => {
      const cat = b.serviceCategory || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const serviceDistribution = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      value: categoryCounts[cat]
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        completedCount: completedBookings.length,
        totalSales,
        activeWorkers: activeWorkersCount + onJobWorkersCount,
        utilizationRate,
        customerCount: users.length
      },
      charts: {
        dailySales,
        serviceDistribution
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to compute admin statistics.' });
  }
};

/**
 * ADMIN: Fetch audit log files
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await db.auditLog.findMany({});
    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve system audit logs.' });
  }
};

/**
 * Fetch in-app notifications/alerts
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const alerts = await db.notification.findMany({
      where: { userId: req.user.id }
    });

    res.status(200).json({
      success: true,
      notifications: alerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    await db.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });

    res.status(200).json({
      success: true,
      message: 'Alert status cleared.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update alert.' });
  }
};
