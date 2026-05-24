const db = require('../db');

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

    for (const item of items) {
      const s = await db.service.findUnique({ where: { id: item.serviceId } });
      if (!s) {
        return res.status(404).json({ success: false, message: `Selected service reference not found.` });
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
      const promo = await db.promoCode.findUnique({ where: { code: couponCode } });
      if (promo && promo.isActive) {
        discountApplied = parseFloat(((totalPrice * promo.discountPct) / 100).toFixed(2));
        
        // Increment coupon count in sandbox/DB
        await db.promoCode.create({
          data: { code: promo.code, discountPct: promo.discountPct, usedCount: promo.usedCount + 1 },
          overwrite: true
        }).catch(() => {});
      }
    }

    const finalPrice = totalPrice - discountApplied;

    // 4. Instantiate Booking
    const booking = await db.booking.create({
      data: {
        userId: req.user.id,
        serviceAreaId: serviceArea.id,
        status: 'PENDING',
        scheduledAt: new Date(scheduledAt),
        timeSlot,
        address,
        phone,
        totalPrice,
        discountApplied,
        finalPrice,
        paymentStatus: paymentMethod === 'CASH' ? 'UNPAID' : 'UNPAID', // Webhook / Cash verifies
        paymentMethod: paymentMethod || 'UPI',
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
    const booking = await db.booking.findUnique({ where: { id: req.params.id } });

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
