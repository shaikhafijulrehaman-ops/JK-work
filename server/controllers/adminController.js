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
    const partners = await db.servicePartner.findMany({}).catch(() => []);
    const workers = partners;

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
      partners,
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

// ==================== SERVICE PARTNER CRUD ====================

// Get all partners
exports.getPartners = async (req, res) => {
  try {
    const partners = await db.servicePartner.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, partners });
  } catch (error) {
    console.error('Error fetching service partners:', error);
    res.status(500).json({ success: false, message: 'Server error fetching partners' });
  }
};

// Create a new partner
exports.createPartner = async (req, res) => {
  try {
    const { name, phone, email, serviceType, status } = req.body;
    if (!name || !phone || !email || !serviceType) {
      return res.status(400).json({ success: false, message: 'Name, phone, email, and serviceType are required.' });
    }
    const existingPhone = await db.servicePartner.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'A service partner with this phone number already exists.' });
    }
    const existingEmail = await db.servicePartner.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'A service partner with this email address already exists.' });
    }
    const partner = await db.servicePartner.create({
      data: {
        name,
        phone,
        email,
        serviceType,
        status: status || 'AVAILABLE'
      }
    });
    res.status(201).json({ success: true, message: 'Service partner created successfully.', partner });
  } catch (error) {
    console.error('Error creating service partner:', error);
    res.status(500).json({ success: false, message: 'Server error creating service partner' });
  }
};

// Update partner
exports.updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, serviceType, status } = req.body;
    const existing = await db.servicePartner.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service partner not found.' });
    }
    if (phone && phone !== existing.phone) {
      const existingPhone = await db.servicePartner.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'A service partner with this phone number already exists.' });
      }
    }
    if (email && email !== existing.email) {
      const existingEmail = await db.servicePartner.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'A service partner with this email address already exists.' });
      }
    }
    const updated = await db.servicePartner.update({
      where: { id },
      data: {
        name: name || existing.name,
        phone: phone || existing.phone,
        email: email || existing.email,
        serviceType: serviceType || existing.serviceType,
        status: status || existing.status
      }
    });
    res.status(200).json({ success: true, message: 'Service partner updated successfully.', partner: updated });
  } catch (error) {
    console.error('Error updating service partner:', error);
    res.status(500).json({ success: false, message: 'Server error updating service partner' });
  }
};

// Delete partner
exports.deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    await db.servicePartner.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Service partner deleted successfully.' });
  } catch (error) {
    console.error('Error deleting service partner:', error);
    res.status(500).json({ success: false, message: 'Server error deleting service partner' });
  }
};

// Get all customer reviews (Ratings & Complaints)
exports.getReviews = async (req, res) => {
  try {
    const reviews = await db.review.findMany({
      include: {
        user: { select: { name: true } },
        partner: { select: { name: true, serviceType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};

function getPayoutCountdown(lastPayoutDate) {
  if (!lastPayoutDate) return { eligible: true, text: 'Available Now' };
  
  const eligibilityTime = new Date(lastPayoutDate).getTime() + 7 * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  const diff = eligibilityTime - now;
  
  if (diff <= 0) {
    return { eligible: true, text: 'Available Now' };
  }
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  let countdownText = '';
  if (days > 0) {
    countdownText += `${days} Day${days > 1 ? 's' : ''} `;
  }
  countdownText += `${hours} Hour${hours > 1 ? 's' : ''}`;
  
  return {
    eligible: false,
    text: countdownText,
    nextPayoutDate: new Date(eligibilityTime),
    days,
    hours,
    minutes
  };
}

// Get all service partners overview performance metrics
exports.getPartnersPerformance = async (req, res) => {
  try {
    const partners = await db.servicePartner.findMany({
      include: {
        performance: true,
        reviews: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const performance = partners.map(p => {
      const perf = p.performance || {};
      const countdown = getPayoutCountdown(p.lastPayoutDate);
      return {
        id: p.id,
        partnerId: p.id,
        partnerName: p.name,
        serviceType: p.serviceType,
        email: p.email,
        phone: p.phone,
        status: p.status,
        totalJobsCompleted: perf.completedJobs || 0,
        totalRevenueGenerated: perf.totalRevenue || 0.0,
        averageRating: perf.averageRating || 0.0,
        activeJobs: perf.activeJobs || 0,
        completedJobs: perf.completedJobs || 0,
        cancelledJobs: perf.cancelledJobs || 0,
        // Weekly Payout tracking
        lastPayoutDate: p.lastPayoutDate,
        currentRevenue: p.currentRevenue,
        payoutCountdown: countdown.text,
        payoutEligible: countdown.eligible,
        // Customer reviews/feedback list
        customerFeedback: p.reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          customerOpinion: r.customerOpinion,
          customerName: r.user?.name || 'Customer',
          createdAt: r.createdAt
        }))
      };
    });

    res.status(200).json({ success: true, performances: performance, performance });
  } catch (error) {
    console.error('Error fetching partner performance:', error);
    res.status(500).json({ success: false, message: 'Server error fetching partner performance.' });
  }
};

// Refresh partner weekly revenue payout
exports.refreshPartnerPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await db.servicePartner.findUnique({
      where: { id }
    });

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Service partner not found.' });
    }

    // Payout eligibility check: once every 7 days
    if (partner.lastPayoutDate) {
      const nextAvailableTime = new Date(partner.lastPayoutDate).getTime() + 7 * 24 * 60 * 60 * 1000;
      if (new Date().getTime() < nextAvailableTime) {
        const timeDiff = nextAvailableTime - new Date().getTime();
        const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        return res.status(400).json({
          success: false,
          message: `Payout not eligible yet. Available in ${days} days ${hours} hours.`
        });
      }
    }

    const payoutAmount = partner.currentRevenue;

    // Transaction to reset revenue, record payout history, and update payout date
    const updatedPartner = await db.transaction(async (tx) => {
      // 1. Create Payout History record
      await tx.payoutHistory.create({
        data: {
          partnerId: id,
          amount: payoutAmount,
          payoutDate: new Date()
        }
      });

      // 2. Update partner current revenue and last payout date
      return await tx.servicePartner.update({
        where: { id },
        data: {
          currentRevenue: 0.0,
          lastPayoutDate: new Date()
        }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Revenue payout refreshed successfully. Current weekly revenue reset to ₹0.',
      partner: updatedPartner
    });
  } catch (error) {
    console.error('Error refreshing partner payout:', error);
    res.status(500).json({ success: false, message: 'Server error refreshing partner payout.' });
  }
};

