const db = require('../db');
const jwt = require('jsonwebtoken');

// Map workerId -> Array of bookingIds that the worker has rejected
const workerRejections = {};
exports.workerRejections = workerRejections;


/**
 * Create a new service booking
 */
exports.createBooking = async (req, res) => {
  try {
    const { items, pincode, address, scheduledAt, timeSlot, phone, paymentMethod, couponCode } = req.body;

    if (!items || !items.length || !pincode || !address || !scheduledAt || !timeSlot || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide all required booking parameters.' });
    }

    // 1. Verify Service Area / Pincode
    const serviceArea = await db.serviceArea.findUnique({ where: { pincode } });
    if (!serviceArea || !serviceArea.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: `Currently, JK Enterprises does not offer doorstep services in pincode ${pincode}. We currently serve Anchepalya (560073) and adjacent zones.` 
      });
    }

    // 2. Fetch Services and calculate price
    let totalPrice = 0;
    const bookingItemsToCreate = [];
    let firstCategory = null;

    for (const item of items) {
      const s = await db.service.findUnique({ where: { id: item.serviceId } });
      if (!s) {
        return res.status(404).json({ success: false, message: `Selected service reference not found.` });
      }
      
      if (!firstCategory) {
        firstCategory = s.category;
      }
      
      const itemPrice = s.price; // Capture pricing at creation time
      totalPrice += itemPrice * item.quantity;

      bookingItemsToCreate.push({
        serviceId: s.id,
        quantity: item.quantity,
        price: itemPrice,
        variant: item.variant || null
      });
    }

    // 3. Process Dynamic Coupons
    let discountApplied = 0.0;
    if (couponCode) {
      const validation = await validateCoupon(couponCode, totalPrice, req.user.id);
      if (!validation.success) {
        return res.status(400).json({ success: false, message: validation.message });
      }
      discountApplied = validation.discount;

      // Increment coupon count in DB/sandbox
      await db.promoCode.update({
        where: { id: validation.coupon.id },
        data: { usedCount: validation.coupon.usedCount + 1 }
      }).catch(() => {});
    }

    const finalPrice = totalPrice - discountApplied;

    // 4. Instantiate Booking
    const booking = await db.booking.create({
      data: {
        userId: req.user.id,
        serviceAreaId: serviceArea.id,
        status: 'PENDING_PARTNER_ACCEPTANCE',
        scheduledAt: new Date(scheduledAt),
        timeSlot,
        address,
        phone,
        totalPrice,
        discountApplied,
        finalPrice,
        paymentStatus: paymentMethod === 'CASH' ? 'UNPAID' : 'UNPAID', // Webhook / Cash verifies
        paymentMethod: paymentMethod || 'UPI',
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        serviceCategory: firstCategory,
        items: {
          createMany: {
            data: bookingItemsToCreate
          }
        }
      }
    });

    // 5. Fire User and Admin Notifications
    await db.notification.create({
      data: {
        userId: req.user.id,
        type: 'BOOKING_ALERT',
        title: 'Booking Placed Successfully!',
        message: `Your booking for ${items.length} items has been submitted. Our 9-minute Anchepalya dispatcher is matching a trained professional.`
      }
    }).catch(() => {});

    // Notify admins
    const adminUser = await db.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      await db.notification.create({
        data: {
          userId: adminUser.id,
          type: 'BOOKING_ALERT',
          title: 'New Service Booking Placed',
          message: `Booking #${booking.id.substring(0,8)} created. Subtotal: Rs. ${finalPrice}. Needs worker assignment.`
        }
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Service booking placed successfully.',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting booking.' });
  }
};

/**
 * Retrieve Bookings List (User, Worker, Admin scope)
 */
exports.getBookings = async (req, res) => {
  try {
    let bookings = [];

    if (req.user.role === 'ADMIN') {
      bookings = await db.booking.findMany({});
    } else if (req.user.role === 'WORKER') {
      const worker = await db.worker.findUnique({ where: { userId: req.user.id } });
      if (worker) {
        bookings = await db.booking.findMany({ where: { workerId: worker.id } });
      }
    } else {
      bookings = await db.booking.findMany({ where: { userId: req.user.id } });
    }

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
};

/**
 * Get dynamic booking detail (including assigned worker profiles)
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await db.booking.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            service: true
          }
        },
        worker: {
          include: {
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    // Role safety gate: Only Admin, the booking owner, or the assigned worker can fetch details
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.id) {
      const worker = await db.worker.findUnique({ where: { userId: req.user.id } });
      if (!worker || booking.workerId !== worker.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to booking.' });
      }
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve booking detail.' });
  }
};

/**
 * Helper to validate coupon logic
 */
const validateCoupon = async (couponCode, subtotal, userId) => {
  if (!couponCode) {
    return { success: false, message: 'Coupon code is required.' };
  }

  const uppercaseCode = couponCode.trim().toUpperCase();
  const promo = await db.promoCode.findUnique({ where: { code: uppercaseCode } });
  if (!promo) {
    return { success: false, message: 'Invalid or expired promotional code.' };
  }

  if (!promo.isActive) {
    return { success: false, message: 'This promotional code is currently disabled.' };
  }

  if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
    return { success: false, message: 'This promotional code has expired.' };
  }

  if (promo.minOrderValue && subtotal < promo.minOrderValue) {
    return { success: false, message: `Minimum order value of Rs. ${promo.minOrderValue.toLocaleString()} is required for this coupon.` };
  }

  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return { success: false, message: 'This promotional code limit has been reached.' };
  }

  if (userId) {
    const userUsageCount = await db.booking.findMany({
      where: {
        userId,
        couponCode: promo.code
      }
    }).then(list => list.length).catch(() => 0);

    if (userUsageCount >= promo.perUserLimit) {
      return { success: false, message: `You have reached the usage limit for this coupon (${promo.perUserLimit} times per user).` };
    }
  }

  let discount = 0.0;
  if (promo.discountType === 'FLAT') {
    discount = promo.discountValue;
  } else if (promo.discountType === 'PERCENTAGE') {
    discount = (subtotal * promo.discountValue) / 100;
    if (promo.maxDiscount !== null && discount > promo.maxDiscount) {
      discount = promo.maxDiscount;
    }
  }
  discount = parseFloat(discount.toFixed(2));

  return {
    success: true,
    message: 'Coupon applied successfully!',
    coupon: promo,
    discount
  };
};

/**
 * Validate coupon code API endpoint
 */
exports.validateCouponCode = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    let userId = null;

    if (req.cookies && req.cookies.accessToken) {
      try {
        const decoded = jwt.verify(req.cookies.accessToken, process.env.JWT_SECRET || 'jk_enterprises_super_jwt_secret_token_2026');
        userId = decoded.userId;
      } catch (e) {}
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jk_enterprises_super_jwt_secret_token_2026');
        userId = decoded.userId;
      } catch (e) {}
    }

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const validation = await validateCoupon(code, parseFloat(subtotal || 0), userId);
    if (!validation.success) {
      return res.status(200).json({ success: false, message: validation.message });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully!',
      discount: validation.discount,
      coupon: {
        id: validation.coupon.id,
        code: validation.coupon.code,
        discountType: validation.coupon.discountType,
        discountValue: validation.coupon.discountValue,
        minOrderValue: validation.coupon.minOrderValue,
        maxDiscount: validation.coupon.maxDiscount
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate coupon code.' });
  }
};

/**
 * ADMIN: Dispatch and Assign worker to booking
 */
exports.assignWorker = async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Please provide a valid workerId.' });
    }

    const booking = await db.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const worker = await db.worker.findUnique({ where: { id: workerId } });
    if (!worker || worker.status === 'INACTIVE') {
      return res.status(400).json({ success: false, message: 'Worker is currently unavailable or inactive.' });
    }

    // Assign worker and move status to ASSIGNED
    const updated = await db.booking.update({
      where: { id: booking.id },
      data: {
        workerId,
        status: 'ASSIGNED'
      }
    });

    // Notify User
    await db.notification.create({
      data: {
        userId: booking.userId,
        type: 'WORKER_ASSIGNMENT',
        title: 'Service Professional Dispatched!',
        message: `Our dispatcher assigned Ramesh Kumar/Vijay (rating: ${worker.rating}) to your instant booking. Ramesh will arrive within 9 minutes!`
      }
    }).catch(() => {});

    // Notify Worker
    await db.notification.create({
      data: {
        userId: worker.userId,
        type: 'BOOKING_ALERT',
        title: 'New Service Job Assigned',
        message: `You have been assigned job #${booking.id.substring(0,8)} at Anchepalya. Time Slot: ${booking.timeSlot}.`
      }
    }).catch(() => {});

    // Log admin audit
    await db.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'WORKER_STATUS_CHANGE',
        details: JSON.stringify({ bookingId: booking.id, workerId: worker.id }),
        ipAddress: req.ip
      }
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Worker assigned successfully. Status updated to ASSIGNED.',
      booking: updated
    });
  } catch (error) {
    console.error('Assign worker error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign worker.' });
  }
};

/**
 * Worker accepts booking
 */
exports.acceptBookingByPartner = async (req, res) => {
  try {
    const worker = await db.worker.findUnique({
      where: { userId: req.user.id },
      include: { user: true }
    });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const booking = await db.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'PENDING_PARTNER_ACCEPTANCE') {
      return res.status(400).json({ success: false, message: 'This booking has already been accepted or is no longer available.' });
    }

    // Update booking status to PARTNER_ACCEPTED and link worker
    const updatedBooking = await db.booking.update({
      where: { id: booking.id },
      data: {
        status: 'PARTNER_ACCEPTED',
        workerId: worker.id,
        acceptedAt: new Date()
      },
      include: {
        worker: {
          include: {
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // Update worker status to ON_JOB
    await db.worker.update({
      where: { id: worker.id },
      data: { status: 'ON_JOB' }
    }).catch(() => {});

    // Send notifications to Customer and Partner
    await db.notification.create({
      data: {
        userId: booking.userId,
        type: 'WORKER_ASSIGNMENT',
        title: 'Partner Assigned!',
        message: `${worker.user.name} has accepted your booking and is preparing to arrive!`
      }
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Booking accepted successfully.',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({ success: false, message: 'Server error while accepting booking.' });
  }
};

/**
 * Worker rejects booking
 */
exports.rejectBookingByPartner = async (req, res) => {
  try {
    const worker = await db.worker.findUnique({ where: { userId: req.user.id } });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const bookingId = req.params.id;

    // Track the rejection in our in-memory cache
    if (!workerRejections[worker.id]) {
      workerRejections[worker.id] = [];
    }
    if (!workerRejections[worker.id].includes(bookingId)) {
      workerRejections[worker.id].push(bookingId);
    }

    res.status(200).json({
      success: true,
      message: 'Booking request rejected and passed along.'
    });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ success: false, message: 'Server error while rejecting booking.' });
  }
};
