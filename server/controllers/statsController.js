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
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    const totalSales = completedBookings.reduce((sum, b) => sum + b.finalPrice, 0.0);
    
    const activeWorkersCount = workers.filter(w => w.status === 'AVAILABLE').length;
    const onJobWorkersCount = workers.filter(w => w.status === 'ON_JOB').length;
    const utilizationRate = workers.length > 0 
      ? Math.round((onJobWorkersCount / workers.length) * 100) 
      : 0;

    // 2. Formulate dynamic charts dataset (last 7 days simulation)
    const dailySales = [
      { day: 'Mon', bookings: 5, sales: 2450 },
      { day: 'Tue', bookings: 7, sales: 3890 },
      { day: 'Wed', bookings: 12, sales: 5200 },
      { day: 'Thu', bookings: 9, sales: 4100 },
      { day: 'Fri', bookings: 15, sales: 7490 },
      { day: 'Sat', bookings: 22, sales: 12400 },
      { day: 'Sun', bookings: 18, sales: 9800 }
    ];

    // Include the live sales from this session!
    dailySales[6].sales += totalSales;
    dailySales[6].bookings += completedBookings.length;

    // Top services mapping
    const categoryCounts = {};
    bookings.forEach(b => {
      // Simulate category extraction or map standard cleaning
      categoryCounts['Cleaning'] = (categoryCounts['Cleaning'] || 0) + 1;
      categoryCounts['Technical'] = (categoryCounts['Technical'] || 0) + (Math.random() > 0.5 ? 1 : 0);
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
