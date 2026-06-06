const db = require('../db');

// Deprecated worker endpoints
exports.getWorkers = async (req, res) => {
  return res.status(200).json({ success: true, workers: [] });
};

exports.approveWorker = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Worker approvals are no longer supported.' });
};

exports.rejectWorker = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Worker rejections are no longer supported.' });
};

exports.updateWorkerStatus = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Worker status updates are no longer supported.' });
};

// Get high-level analytics
exports.getAnalytics = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayCount,
      pendingCount,
      completedCount,
      cancelledCount,
      activeCouponsCount,
      totalCouponsCount,
      todayRevenueObj,
      monthRevenueObj
    ] = await Promise.all([
      db.booking.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
      db.booking.count({ where: { status: 'PENDING' } }),
      db.booking.count({ where: { status: 'COMPLETED' } }),
      db.booking.count({ where: { status: 'CANCELLED' } }),
      db.promoCode.count({ where: { isActive: true } }),
      db.promoCode.count(),
      db.booking.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { finalPrice: true }
      }),
      db.booking.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: firstDayOfMonth } },
        _sum: { finalPrice: true }
      })
    ]);

    const stats = {
      todayCount,
      pendingCount,
      completedCount,
      cancelledCount,
      activePartnersCount: 0,
      pendingApprovalsCount: 0,
      todayRev: todayRevenueObj._sum.finalPrice || 0,
      monthRev: monthRevenueObj._sum.finalPrice || 0,
      activeCouponsCount,
      totalCouponsCount
    };

    res.status(200).json({
      success: true,
      analytics: stats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all database records for the unified Admin SaaS dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const bookings = await db.booking.findMany({
      take: 105,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        items: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch other lists
    const workers = [];

    const dbCustomers = await db.user.findMany({
      where: { role: 'USER' },
      include: {
        bookings: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const customers = dbCustomers.map(c => {
      const bookingsCount = c.bookings.length;
      const lastBooking = bookingsCount > 0 ? c.bookings[0].createdAt : null;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        pincode: c.pincode,
        serviceArea: c.serviceArea,
        createdAt: c.createdAt,
        bookingsCount,
        lastBooking
      };
    });

    const services = await db.service.findMany({});

    const coupons = await db.promoCode.findMany({}).catch(() => []);

    res.status(200).json({
      success: true,
      bookings,
      workers,
      customers,
      services,
      coupons,
      auditLogs: []
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard data' });
  }
};

// ==================== COUPON MANAGEMENT CRUD ====================

// Get all coupons
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await db.promoCode.findMany({}).catch(() => []);
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'Server error fetching coupons' });
  }
};

// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, perUserLimit, expiresAt, isActive } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: 'Code, discount type, and discount value are required.' });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code exists
    const existing = await db.promoCode.findUnique({ where: { code: uppercaseCode } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const coupon = await db.promoCode.create({
      data: {
        code: uppercaseCode,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue !== undefined ? parseFloat(minOrderValue) : 0.0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? !!isActive : true
      }
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully.', coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: 'Server error creating coupon' });
  }
};

// Update an existing coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, perUserLimit, expiresAt, isActive } = req.body;

    const existing = await db.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    const updated = await db.promoCode.update({
      where: { id },
      data: {
        code: code ? code.trim().toUpperCase() : existing.code,
        discountType: discountType || existing.discountType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : existing.discountValue,
        minOrderValue: minOrderValue !== undefined ? parseFloat(minOrderValue) : existing.minOrderValue,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : existing.maxDiscount,
        usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : existing.usageLimit,
        perUserLimit: perUserLimit !== undefined ? parseInt(perUserLimit) : existing.perUserLimit,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existing.expiresAt,
        isActive: isActive !== undefined ? !!isActive : existing.isActive
      }
    });

    res.status(200).json({ success: true, message: 'Coupon updated successfully.', coupon: updated });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, message: 'Server error updating coupon' });
  }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.promoCode.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'Server error deleting coupon' });
  }
};

// Get all bookings with includes
exports.getBookings = async (req, res) => {
  try {
    const bookings = await db.booking.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
        items: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    res.status(500).json({ success: false, message: 'Server error fetching bookings' });
  }
};

// Get all customers (User with role='USER')
exports.getCustomers = async (req, res) => {
  try {
    const dbCustomers = await db.user.findMany({
      where: { role: 'USER' },
      include: {
        bookings: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const customers = dbCustomers.map(c => {
      const bookingsCount = c.bookings.length;
      const lastBooking = bookingsCount > 0 ? c.bookings[0].createdAt : null;
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        pincode: c.pincode,
        serviceArea: c.serviceArea,
        createdAt: c.createdAt,
        bookingsCount,
        lastBooking
      };
    });

    res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error('Error fetching admin customers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching customers' });
  }
};

// Get all services
exports.getServices = async (req, res) => {
  try {
    const services = await db.service.findMany({});
    res.status(200).json({ success: true, services });
  } catch (error) {
    console.error('Error fetching admin services:', error);
    res.status(500).json({ success: false, message: 'Server error fetching services' });
  }
};

// Get payments summary and ledger list
exports.getPayments = async (req, res) => {
  try {
    const bookings = await db.booking.findMany({
      include: {
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate aggregate revenue metrics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayRev = 0;
    let weekRev = 0;
    let monthRev = 0;

    const paymentList = bookings.map(b => {
      const price = b.finalPrice || 0;
      const bDate = new Date(b.createdAt);
      
      if (b.paymentStatus === 'PAID') {
        if (bDate >= todayStart) todayRev += price;
        if (bDate >= weekStart) weekRev += price;
        if (bDate >= monthStart) monthRev += price;
      }

      return {
        id: b.id,
        bookingId: b.id,
        customerName: b.user?.name || 'Customer',
        partnerName: 'Managed Service',
        amount: price,
        method: b.paymentMethod || 'UPI',
        status: b.paymentStatus || 'PENDING',
        transactionId: b.paymentId || 'N/A',
        createdAt: b.createdAt
      };
    });

    res.status(200).json({
      success: true,
      todayRev,
      weekRev,
      monthRev,
      paymentList
    });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    res.status(500).json({ success: false, message: 'Server error fetching payments' });
  }
};

// GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { eventType, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (eventType && eventType !== 'All') {
      where.eventType = eventType;
    }

    const [logs, totalCount] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, role: true }
          }
        }
      }),
      db.auditLog.count({ where })
    ]);

    res.status(200).json({
      success: true,
      logs,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / take)
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching audit logs.' });
  }
};

