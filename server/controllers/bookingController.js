const db = require('../db');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/auditLogger');

// Helper to send mock WhatsApp notification to Admin
const sendAdminWhatsAppNotification = (name, mobile, email, action) => {
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`
==================================================
💬 [WhatsApp Dispatch mock to ADMIN]
New Customer Activity

Name: ${name || 'N/A'}
Mobile: ${mobile || 'N/A'}
Email: ${email || 'N/A'}

Action: ${action}

Time: ${time}
==================================================
`);
};

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
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        serviceCategory: firstCategory,
        items: {
          createMany: {
            data: bookingItemsToCreate
          }
        }
      }
    });

    // Audit Logging
    logActivity(req, {
      userId: req.user.id,
      eventType: 'BOOKING',
      action: 'BOOKING_CREATED',
      details: { bookingId: booking.id, finalPrice: booking.finalPrice }
    });

    if (couponCode) {
      logActivity(req, {
        userId: req.user.id,
        eventType: 'BOOKING',
        action: 'COUPON_APPLIED',
        details: { bookingId: booking.id, couponCode, discountApplied }
      });
    }

    // WhatsApp Notification
    sendAdminWhatsAppNotification(req.user?.name || 'Customer', phone, req.user?.email || 'N/A', 'Booking');

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
    res.status(500).json({ success: false, message: 'Unable to complete booking. Please try again shortly.' });
  }
};

/**
 * Retrieve Bookings List (User, Worker, Admin scope)
 */
exports.getBookings = async (req, res) => {
  try {
    let bookings = [];

    const includeOptions = {
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
    };

    if (req.user.role === 'ADMIN') {
      bookings = await db.booking.findMany({
        include: includeOptions,
        orderBy: { createdAt: 'desc' }
      });
    } else if (req.user.role === 'WORKER') {
      const worker = await db.worker.findUnique({ where: { userId: req.user.id } });
      if (worker) {
        bookings = await db.booking.findMany({
          where: { workerId: worker.id },
          include: includeOptions,
          orderBy: { createdAt: 'desc' }
        });
      }
    } else {
      bookings = await db.booking.findMany({
        where: { userId: req.user.id },
        include: includeOptions,
        orderBy: { createdAt: 'desc' }
      });
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

exports.assignWorker = async (req, res) => {
  try {
    const { partnerName, partnerMobile } = req.body;
    if (!partnerName || !partnerMobile) {
      return res.status(400).json({ success: false, message: 'Please provide both Partner Name and Partner Mobile Number.' });
    }

    const bookingId = req.params.id;
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const updated = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: 'ASSIGNED',
        booking_status: 'Assigned',
        partnerName,
        partnerMobile
      }
    });

    // Create Notification
    await db.notification.create({
      data: {
        userId: booking.userId,
        type: 'WORKER_ASSIGNMENT',
        title: 'Partner Assigned!',
        message: `Your professional ${partnerName} (${partnerMobile}) has been assigned to your booking. Check dashboard for details.`
      }
    }).catch(() => {});

    // Log Activity
    logActivity(req, {
      userId: req.user.id,
      eventType: 'BOOKING',
      action: 'BOOKING_ASSIGNED',
      details: { bookingId, partnerName, partnerMobile }
    });

    // Send Email to Customer
    const { sendEmail } = require('../utils/email');
    const customerEmail = booking.email || booking.user?.email;
    if (customerEmail) {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #06b6d4; text-align: center;">JK Home Care</h2>
          <p>Hello,</p>
          <p>A service partner has been successfully assigned to your booking <strong>#${bookingId.substring(0,8).toUpperCase()}</strong>.</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #0f172a;">Assigned Partner Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${partnerName}</p>
            <p style="margin: 5px 0;"><strong>Mobile:</strong> ${partnerMobile}</p>
          </div>
          <p>They will contact you shortly regarding their arrival. You can track their status in real-time on your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 JK Home Care. All rights reserved.</p>
        </div>
      `;
      sendEmail({
        to: customerEmail,
        subject: `JK Home Care - Partner Assigned for Booking #${bookingId.substring(0,8).toUpperCase()}`,
        html: htmlContent
      }).catch(err => console.error('Error sending assignment email:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Partner assigned successfully.',
      booking: updated
    });
  } catch (error) {
    console.error('Assign partner error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign partner.' });
  }
};

exports.acceptBookingByPartner = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Worker operations are no longer supported on this platform.' });
};

exports.rejectBookingByPartner = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Worker operations are no longer supported on this platform.' });
};

/**
 * Create a booking after successful payment
 */
exports.confirmPaymentSuccess = async (req, res) => {
  try {
    const { 
      booking_id, 
      customer_name, 
      phone, 
      email, 
      service_name, 
      amount, 
      address, 
      area, 
      pincode, 
      notes, 
      transaction_id,
      coupon_code,
      discount_applied
    } = req.body;

    if (!booking_id || !customer_name || !phone || !service_name || !amount || !address) {
      return res.status(400).json({ success: false, message: 'Please provide all required transaction fields.' });
    }

    // ACID transaction: booking + coupon + customer update + notifications
    const booking = await db.transaction(async (tx) => {
      // 1. Verify/fetch serviceArea pincode
      const serviceArea = await tx.serviceArea.findUnique({ where: { pincode: pincode || '560073' } });
      const serviceAreaId = serviceArea ? serviceArea.id : 'sa-sample';

      // 2. Resolve service reference
      const matchingService = await tx.service.findFirst({
        where: { name: { contains: service_name } }
      });
      const serviceId = matchingService ? matchingService.id : 's-1';

      // 3. Create the Booking entry (this updates customer history and booking count automatically)
      const newBooking = await tx.booking.create({
        data: {
          id: booking_id,
          userId: req.user.id,
          serviceAreaId: serviceAreaId,
          status: 'PENDING',
          scheduledAt: new Date(),
          timeSlot: 'Instant Dispatch',
          address: address,
          phone: phone,
          totalPrice: parseFloat(amount) + parseFloat(discount_applied || 0),
          discountApplied: parseFloat(discount_applied || 0.0),
          finalPrice: parseFloat(amount),
          paymentStatus: 'PAID',
          paymentMethod: 'CARD',
          paymentId: transaction_id,
          serviceCategory: matchingService ? matchingService.category : 'General',
          couponCode: coupon_code || null,
          
          customer_name,
          email,
          service_name,
          amount: parseFloat(amount),
          area,
          pincode,
          notes,
          payment_status: 'Paid',
          transaction_id,
          booking_status: 'New Booking',
          
          items: {
            createMany: {
              data: [
                {
                  serviceId: serviceId,
                  quantity: 1,
                  price: parseFloat(amount)
                }
              ]
            }
          }
        }
      });

      // 4. Increment coupon usage count
      if (coupon_code) {
        const uppercaseCode = coupon_code.trim().toUpperCase();
        await tx.promoCode.update({
          where: { code: uppercaseCode },
          data: { usedCount: { increment: 1 } }
        });
      }

      // 5. Fire system notification
      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'PAYMENT_SUCCESS',
          title: 'Booking Confirmed!',
          message: `Your booking #${booking_id} for ${service_name} has been processed successfully.`
        }
      });

      return newBooking;
    });

    // Audit Logging
    logActivity(req, {
      userId: req.user.id,
      eventType: 'BOOKING',
      action: 'BOOKING_CREATED',
      details: { bookingId: booking.id, serviceName: service_name, amount: booking.finalPrice }
    });

    // 6. Trigger simulated Admin WhatsApp Dispatch Log to Console
    console.log('\n==================================================');
    console.log('💬 [WhatsApp Dispatch mock to ADMIN]');
    console.log('New Booking Request\n');
    console.log(`Booking ID:\n#${booking_id}\n`);
    console.log(`Customer Name:\n${customer_name}\n`);
    console.log(`Mobile Number:\n${phone}\n`);
    console.log(`Email:\n${email || 'N/A'}\n`);
    console.log(`Service:\n${service_name}\n`);
    console.log(`Amount Paid:\n₹${amount}\n`);
    console.log(`Address:\n${address}\n`);
    console.log(`Area:\n${area || 'N/A'}\n`);
    console.log(`Pincode:\n${pincode || 'N/A'}\n`);
    console.log(`Additional Notes:\n${notes || 'None'}\n`);
    console.log('Payment Status:\nPAID\n');
    console.log(`Transaction ID:\n${transaction_id}\n`);
    console.log(`Booking Time:\n${new Date(booking.createdAt).toLocaleString()}\n`);
    console.log('==================================================\n');

    res.status(201).json({
      success: true,
      message: 'Booking created and payment confirmed successfully!',
      booking
    });

  } catch (error) {
    console.error('Confirm Payment Success Error:', error);
    
    // Log payment failures
    console.error(`[PAYMENT FAILURE] Failed transaction: ${req.body.transaction_id || 'N/A'} under booking: ${req.body.booking_id || 'N/A'}. Error: ${error.message}`);
    
    res.status(500).json({ success: false, message: 'Unable to confirm booking. Please try again shortly.' });
  }
};
