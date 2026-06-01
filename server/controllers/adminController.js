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
    const bookings = await db.booking.findMany({});
    const workers = await db.worker.findMany({});
    const coupons = await db.promoCode.findMany({}).catch(() => []);

    const today = new Date().toDateString();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const todayBookings = bookings.filter(b => new Date(b.createdAt).toDateString() === today);
    const pendingBookings = bookings.filter(b => b.status.toUpperCase() === 'PENDING');
    const completedBookings = bookings.filter(b => b.status.toUpperCase() === 'COMPLETED');
    const cancelledBookings = bookings.filter(b => b.status.toUpperCase() === 'CANCELLED');
    
    const activePartners = workers.filter(w => w.approvalStatus === 'APPROVED');
    const pendingApprovals = workers.filter(w => w.approvalStatus === 'PENDING');
    
    const activeCoupons = coupons.filter(c => c.isActive);

    const todayRevenue = bookings
      .filter(b => b.status === 'COMPLETED' && new Date(b.createdAt).toDateString() === today)
      .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    const monthRevenue = bookings
      .filter(b => b.status === 'COMPLETED' && new Date(b.createdAt).getMonth() === currentMonth && new Date(b.createdAt).getFullYear() === currentYear)
      .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    const stats = {
      todayCount: todayBookings.length,
      pendingCount: pendingBookings.length,
      completedCount: completedBookings.length,
      cancelledCount: cancelledBookings.length,
      activePartnersCount: activePartners.length,
      pendingApprovalsCount: pendingApprovals.length,
      todayRev: todayRevenue,
      monthRev: monthRevenue,
      activeCouponsCount: activeCoupons.length,
      totalCouponsCount: coupons.length
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

    // 5. Fetch all coupons
    const coupons = await db.promoCode.findMany({}).catch(() => []);

    // 6. Fetch all audit logs (include user)
    const auditLogs = await db.auditLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log("Partner Approval Center Fetch Result");
    console.log("Full Database Response (Workers):", JSON.stringify(workers, null, 2));

    res.status(200).json({
      success: true,
      bookings,
      workers,
      customers,
      services,
      coupons,
      auditLogs
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
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    res.status(500).json({ success: false, message: 'Server error fetching bookings' });
  }
};

// Get all customers (User with role='USER')
exports.getCustomers = async (req, res) => {
  try {
    const customers = await db.user.findMany({
      where: { role: 'USER' },
      select: { id: true, name: true, email: true, phone: true, pincode: true, serviceArea: true, createdAt: true }
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
        user: { select: { name: true } },
        worker: { include: { user: { select: { name: true } } } }
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
        partnerName: b.worker?.user?.name || 'Unassigned',
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

