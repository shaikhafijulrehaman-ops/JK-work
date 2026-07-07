const db = require('../db');
const cache = require('../utils/cache');
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

const sanitizeBookingForUser = (booking, user) => {
  if (!user || user.role !== 'ADMIN') {
    if (Array.isArray(booking)) {
      return booking.map(b => {
        const { arrivalOtp, ...rest } = b;
        return rest;
      });
    } else if (booking) {
      const { arrivalOtp, ...rest } = booking;
      return rest;
    }
  }
  return booking;
};


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

    // Log status history
    await logStatusHistory(booking.id, 'PENDING');

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

    cache.clearCache();
    res.status(201).json({
      success: true,
      message: 'Service booking placed successfully.',
      booking: sanitizeBookingForUser(booking, req.user)
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Unable to complete booking. Please try again shortly.' });
  }
};

/**
 * Retrieve Bookings List (User, Admin scope)
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
      partner: true,
      review: true
    };

    if (req.user.role === 'ADMIN') {
      bookings = await db.booking.findMany({
        include: includeOptions,
        orderBy: { createdAt: 'desc' }
      });
    } else {
      bookings = await db.booking.findMany({
        where: { userId: req.user.id },
        include: includeOptions,
        orderBy: { createdAt: 'desc' }
      });
    }

    cache.clearCache();
    res.status(200).json({
      success: true,
      bookings: sanitizeBookingForUser(bookings, req.user)
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
};

/**
 * Get dynamic booking detail (including assigned service partners)
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
        partner: true,
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    // Role safety gate: Only Admin or the booking owner can fetch details
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to booking.' });
    }

    cache.clearCache();
    res.status(200).json({
      success: true,
      booking: sanitizeBookingForUser(booking, req.user)
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
        const decoded = jwt.verify(req.cookies.accessToken, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {}
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

exports.assignPartner = async (req, res) => {
  try {
    const { partnerId, partnerName, partnerMobile } = req.body;
    
    let finalPartnerId = partnerId || null;
    let finalPartnerName = partnerName;
    let finalPartnerMobile = partnerMobile;
    let partner = null;

    if (partnerId) {
      partner = await db.servicePartner.findUnique({
        where: { id: partnerId }
      });
      if (!partner) {
        return res.status(404).json({ success: false, message: 'Service partner not found.' });
      }
      finalPartnerName = partner.name;
      finalPartnerMobile = partner.phone;
    } else {
      if (!finalPartnerName || !finalPartnerMobile) {
        return res.status(400).json({ success: false, message: 'Please select a Service Partner or provide Partner Name and Mobile Number.' });
      }
    }

    const bookingId = req.params.id;
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { user: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // ── PARTNER AVAILABILITY CHECK ──
    // If partner is ON_JOB, only allow if they are already assigned to THIS booking
    if (partner && partner.status === 'ON_JOB' && booking.partnerId !== finalPartnerId) {
      return res.status(400).json({ 
        success: false, 
        message: `Service partner "${partner.name}" is currently assigned to another booking. Please select an available partner.` 
      });
    }

    const isSamePartner = finalPartnerId 
      ? (booking.partnerId === finalPartnerId) 
      : (booking.partnerName === finalPartnerName && booking.partnerMobile === finalPartnerMobile);

    // ── DUPLICATE GUARD: Same partner already assigned + emails already sent ──
    if (booking.status === 'ASSIGNED' && isSamePartner && booking.arrivalOtp && booking.emailSent) {
      return res.status(200).json({
        success: true,
        message: 'Partner is already assigned to this booking. OTP and emails were already sent.',
        booking: sanitizeBookingForUser(booking, req.user)
      });
    }

    // ── OTP LOGIC: Reuse existing OTP for same partner, generate new for different partner ──
    let arrivalOtp;
    let otpGeneratedAt;
    if (isSamePartner && booking.arrivalOtp) {
      arrivalOtp = booking.arrivalOtp;
      otpGeneratedAt = booking.otpGeneratedAt || new Date();
    } else {
      arrivalOtp = Math.floor(1000 + Math.random() * 9000).toString();
      otpGeneratedAt = new Date();
    }

    // ── Release old partner if switching to a different one ──
    if (booking.partnerId && !isSamePartner) {
      await db.servicePartner.update({
        where: { id: booking.partnerId },
        data: { status: 'AVAILABLE' }
      }).catch(err => console.error('Error releasing old partner:', err.message));
    }

    // ── Determine if emails need sending ──
    const shouldSendEmail = !(isSamePartner && booking.emailSent);

    const updated = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: 'ASSIGNED',
        booking_status: 'Assigned',
        partnerId: finalPartnerId,
        partnerName: finalPartnerName,
        partnerMobile: finalPartnerMobile,
        arrivalOtp: arrivalOtp,
        otpVerified: false,
        arrivalTime: null,
        otpGeneratedAt: otpGeneratedAt,
        otpVerifiedAt: null,
        emailSent: shouldSendEmail ? false : true // Will be set true after send
      }
    });

    // Set new partner to ON_JOB
    if (finalPartnerId) {
      await db.servicePartner.update({
        where: { id: finalPartnerId },
        data: { status: 'ON_JOB' }
      }).catch(err => console.error('Error updating partner status:', err.message));
    }

    // Create Notification (only for new assignments)
    if (!isSamePartner || !booking.emailSent) {
      await db.notification.create({
        data: {
          userId: booking.userId,
          type: 'WORKER_ASSIGNMENT',
          title: 'Partner Assigned!',
          message: `Your professional ${finalPartnerName} (${finalPartnerMobile}) has been assigned to your booking. Check dashboard for details.`
        }
      }).catch(() => {});
    }

    // Log Activity
    logActivity(req, {
      userId: req.user.id,
      eventType: 'BOOKING',
      action: 'BOOKING_ASSIGNED',
      details: { bookingId, partnerName: finalPartnerName, partnerMobile: finalPartnerMobile }
    });

    // Log status history
    await logStatusHistory(bookingId, 'ASSIGNED');

    // Sync partner performance
    if (finalPartnerId) {
      await syncPartnerPerformance(finalPartnerId);
    }

    // ── SEND EMAILS ONLY IF NOT ALREADY SENT ──
    if (shouldSendEmail) {
      const { sendEmail } = require('../utils/email');
      const customerEmail = booking.email || booking.user?.email;

      // Email to Customer
      if (customerEmail) {
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #06b6d4; text-align: center;">JK Home Care</h2>
            <p>Hello,</p>
            <p>A service partner has been successfully assigned to your booking <strong>#${bookingId.substring(0,8).toUpperCase()}</strong>.</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #0f172a;">Assigned Partner Details:</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${finalPartnerName}</p>
              <p style="margin: 5px 0;"><strong>Mobile:</strong> ${finalPartnerMobile}</p>
              <p style="margin: 5px 0;"><strong>Service Type:</strong> ${booking.serviceCategory || 'Home Service'}</p>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
            </div>
            <p>Please ask the service partner for the arrival verification OTP when they reach your doorstep, and enter it on your dashboard to confirm their arrival.</p>
            <p>They will contact you shortly regarding their arrival. You can track their status in real-time on your dashboard.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 JK Home Care. All rights reserved.</p>
          </div>
        `;
        sendEmail({
          to: customerEmail,
          subject: `JK Home Care - Partner Assigned for Booking #${bookingId.substring(0,8).toUpperCase()}`,
          html: htmlContent
        }).then(async () => {
          await db.emailLog.create({
            data: {
              to: customerEmail,
              subject: `JK Home Care - Partner Assigned for Booking #${bookingId.substring(0,8).toUpperCase()}`,
              body: htmlContent,
              bookingId: bookingId
            }
          }).catch(err => console.error('Error logging customer email:', err.message));
        }).catch(err => console.error('Error sending customer email:', err.message));
      }

      // Email to Service Partner (with OTP)
      if (partner && partner.email) {
        const partnerHtmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #06b6d4; text-align: center;">JK Home Care - New Job Assigned</h2>
            <p>Hello ${partner.name},</p>
            <p>You have been assigned a new booking <strong>#${bookingId.substring(0,8).toUpperCase()}</strong>.</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: #0f172a;">Customer & Job Details:</h3>
              <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${booking.customer_name || booking.user?.name || 'Customer'}</p>
              <p style="margin: 5px 0;"><strong>Customer Phone:</strong> ${booking.phone || booking.user?.phone || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Customer Address:</strong> ${booking.address}</p>
              <p style="margin: 5px 0;"><strong>Service Details:</strong> ${booking.service_name || 'Home Service'}</p>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
              <p style="margin: 5px 0; font-size: 16px; color: #06b6d4;"><strong>Arrival OTP:</strong> ${arrivalOtp}</p>
            </div>
            <p>Please contact the customer immediately, arrive at their location on time, and share the above 4-digit Arrival OTP with them so they can verify your arrival on the platform.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 JK Home Care. All rights reserved.</p>
          </div>
        `;
        sendEmail({
          to: partner.email,
          subject: `JK Home Care - New Job Assigned: Booking #${bookingId.substring(0,8).toUpperCase()}`,
          html: partnerHtmlContent
        }).then(async () => {
          await db.emailLog.create({
            data: {
              to: partner.email,
              subject: `JK Home Care - New Job Assigned: Booking #${bookingId.substring(0,8).toUpperCase()}`,
              body: partnerHtmlContent,
              bookingId: bookingId
            }
          }).catch(err => console.error('Error logging partner email:', err.message));
        }).catch(err => console.error('Error sending partner email:', err.message));
      }

      // Mark emails as sent
      await db.booking.update({
        where: { id: bookingId },
        data: { emailSent: true }
      }).catch(err => console.error('Error marking emailSent:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Partner assigned successfully.',
      booking: sanitizeBookingForUser(updated, req.user)
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
      discount_applied,
      rawAddress,
      landmark,
      altPhone
    } = req.body;

    if (!booking_id || !customer_name || !phone || !service_name || !amount || !address) {
      return res.status(400).json({ success: false, message: 'Please provide all required transaction fields.' });
    }

    // Idempotency Check: If booking already exists, return it with success
    const existingBooking = await db.booking.findUnique({
      where: { id: booking_id },
      include: {
        items: {
          include: {
            service: true
          }
        },
        partner: true,
        review: true
      }
    });

    if (existingBooking) {
      return res.status(200).json({
        success: true,
        message: 'Booking already confirmed.',
        booking: sanitizeBookingForUser(existingBooking, req.user)
      });
    }

    // Idempotency Check 2: If a booking with the same transaction_id / paymentId already exists, return it
    if (transaction_id) {
      const duplicatePaymentBooking = await db.booking.findFirst({
        where: {
          OR: [
            { paymentId: transaction_id },
            { transaction_id: transaction_id }
          ]
        },
        include: {
          items: {
            include: {
              service: true
            }
          },
          partner: true,
          review: true
        }
      });

      if (duplicatePaymentBooking) {
        console.log(`⚠️  [Idempotency Check] Booking already exists under transaction ID ${transaction_id}. Returning existing.`);
        return res.status(200).json({
          success: true,
          message: 'Booking already confirmed via transaction ID.',
          booking: sanitizeBookingForUser(duplicatePaymentBooking, req.user)
        });
      }
    }

    let booking;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        // ACID transaction: booking + coupon + customer update + notifications
        booking = await db.transaction(async (tx) => {
          // 1. Verify/fetch serviceArea pincode
          const serviceArea = await tx.serviceArea.findUnique({ where: { pincode: pincode || '560073' } });
          let serviceAreaId = serviceArea ? serviceArea.id : null;
          if (!serviceAreaId) {
            const fallbackArea = await tx.serviceArea.findFirst({
              where: { isActive: true }
            });
            serviceAreaId = fallbackArea ? fallbackArea.id : null;
          }

          // 2. Resolve service reference
          const matchingService = await tx.service.findFirst({
            where: { name: { contains: service_name } }
          });
          let serviceId;
          if (matchingService) {
            serviceId = matchingService.id;
          } else {
            const fallbackService = await tx.service.findFirst();
            serviceId = fallbackService ? fallbackService.id : 's-1';
          }

          // 3. Create the Booking entry
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

          // 3.5 Log status history
          await tx.bookingStatusHistory.create({
            data: {
              bookingId: booking_id,
              status: 'PENDING'
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

          // 5.5 Update User's default profile area and pincode
          await tx.user.update({
            where: { id: req.user.id },
            data: {
              pincode: pincode || undefined,
              serviceArea: area || undefined
            }
          });

          // 5.6 Save or update Address in user's saved addresses registry
          if (rawAddress) {
            const addrRecord = await tx.address.findFirst({
              where: {
                userId: req.user.id,
                houseFlat: rawAddress,
                street: area || ''
              }
            });

            if (!addrRecord) {
              await tx.address.updateMany({
                where: { userId: req.user.id },
                data: { isDefault: false }
              });

              await tx.address.create({
                data: {
                  userId: req.user.id,
                  houseFlat: rawAddress,
                  street: area || '',
                  landmark: landmark || null,
                  altMobile: altPhone || null,
                  isDefault: true
                }
              });
            } else {
              await tx.address.updateMany({
                where: { userId: req.user.id },
                data: { isDefault: false }
              });

              await tx.address.update({
                where: { id: addrRecord.id },
                data: {
                  landmark: landmark || null,
                  altMobile: altPhone || null,
                  isDefault: true
                }
              });
            }
          }

          return newBooking;
        }, { maxWait: 15000, timeout: 30000 });
        break; // Success! Exit retry loop
      } catch (err) {
        lastError = err;
        console.warn(`⚠️  [Confirm Payment Success] Transaction attempt ${attempts} failed: ${err.message}.`);
        if (attempts < maxAttempts) {
          const delay = attempts * 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!booking) {
      console.error(`💥 [Confirm Payment Success Fatal] Failed all ${maxAttempts} attempts. Error: ${lastError.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Your payment succeeded but we encountered a database synchronization issue. Please contact support with your Transaction ID.' 
      });
    }

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

    cache.clearCache();
    res.status(201).json({
      success: true,
      message: 'Booking created and payment confirmed successfully!',
      booking
    });
  } catch (error) {
    console.error('Confirm Payment Success Error:', error);
    console.error(`[PAYMENT FAILURE] Failed transaction: ${req.body.transaction_id || 'N/A'} under booking: ${req.body.booking_id || 'N/A'}. Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Unable to confirm booking. Please contact support.' });
  }
};

// ==================== BOOKING STATUS & REFUNDS ====================

const Razorpay = require('razorpay');
const { sendEmail } = require('../utils/email');

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide target booking status.' });
    }

    const booking = await db.booking.findUnique({ 
      where: { id: req.params.id },
      include: { user: true }
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Role gate: Only Admin can update status under the new flow
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only admins can transition booking status.' });
    }

    if (status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Only customers can confirm work completion.' });
    }

    if (status === 'IN_PROGRESS') {
      return res.status(400).json({ success: false, message: 'In Progress status is no longer supported.' });
    }

    if (status === 'ON_THE_WAY') {
      return res.status(400).json({ success: false, message: 'On The Way status is no longer supported.' });
    }

    const updateData = { 
      status,
      booking_status: status === 'PENDING' ? 'New Booking' : 
                      status === 'ASSIGNED' ? 'Assigned' : 
                      status === 'ARRIVED' ? 'Arrived' : 
                      status === 'CANCELLED' ? 'Cancelled' : status
    };

    const customerEmail = booking.email || booking.user?.email;

    if (status === 'CANCELLED') {
      logActivity(req, {
        userId: req.user.id,
        eventType: 'BOOKING',
        action: 'BOOKING_CANCELLED',
        details: { bookingId: booking.id }
      });

      const paymentId = booking.paymentId || booking.transaction_id;
      const wasPaid = booking.paymentStatus === 'PAID' || booking.payment_status === 'Paid';
      
      let refundId = null;

      if (wasPaid && paymentId && paymentId !== 'N/A') {
        const isSimulated = paymentId.startsWith('pay_sim_') || paymentId.startsWith('order_mock_') || !process.env.RAZORPAY_KEY_SECRET;
        
        if (isSimulated) {
          refundId = `ref_sim_${Math.random().toString(36).substring(2,10)}`;
          console.log(`✉️ [Refund System] Simulated Refund processed successfully for simulated payment ${paymentId}. Refund ID: ${refundId}`);
        } else {
          try {
            console.log(`✉️ [Refund System] Initiating Razorpay Refund for payment ${paymentId}...`);
            const razorpayClient = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET
            });
            
            const refund = await razorpayClient.payments.refund(paymentId, {
              amount: Math.round(booking.finalPrice * 100), // amount in paise
              notes: { bookingId: booking.id, reason: 'Admin cancelled booking' }
            });
            refundId = refund.id;
            console.log(`✉️ [Refund System] Razorpay Refund completed. Refund ID: ${refundId}`);
          } catch (refundError) {
            return res.status(500).json({ success: false, message: 'Refund processing failed. Please contact support.' });
          }
        }

        updateData.paymentStatus = 'REFUNDED';
        updateData.payment_status = 'Refunded';
        updateData.refundId = refundId;
      }

      await db.notification.create({
        data: {
          userId: booking.userId,
          type: 'SYSTEM_ALERT',
          title: 'Booking Cancelled & Refunded',
          message: `Your booking #${booking.id.substring(0,8)} has been cancelled. A full refund of Rs. ${booking.finalPrice} was initiated.`
        }
      }).catch(() => {});

      if (customerEmail) {
        const refundDetailsHtml = refundId ? `
          <div style="background-color: #f0fdfa; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ccfbf1;">
            <h3 style="margin-top: 0; color: #0d9488;">Refund Confirmation</h3>
            <p style="margin: 5px 0;"><strong>Refund Amount:</strong> Rs. ${booking.finalPrice}</p>
            <p style="margin: 5px 0;"><strong>Refund Reference ID:</strong> ${refundId}</p>
            <p style="margin: 5px 0; font-size: 11px; color: #0f766e;">The refunded amount will reflect in your account within 5-7 business days.</p>
          </div>
        ` : '';

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #e11d48; text-align: center;">Booking Cancelled</h2>
            <p>Hello,</p>
            <p>Your booking <strong>#${booking.id.substring(0,8).toUpperCase()}</strong> has been cancelled by the administrator.</p>
            ${refundDetailsHtml}
            <p>If you have any questions or require further assistance, please contact our customer support team.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 JK Home Care. All rights reserved.</p>
          </div>
        `;

        sendEmail({
          to: customerEmail,
          subject: `JK Home Care - Cancellation & Refund confirmation for Booking #${booking.id.substring(0,8).toUpperCase()}`,
          html: htmlContent
        }).then(async () => {
          await db.emailLog.create({
            data: {
              to: customerEmail,
              subject: `JK Home Care - Cancellation & Refund confirmation for Booking #${booking.id.substring(0,8).toUpperCase()}`,
              body: htmlContent,
              bookingId: booking.id
            }
          }).catch(err => console.error('Error logging cancellation email:', err.message));
        }).catch(err => console.error('Error sending cancellation email:', err.message));
      }
    }

    const updated = await db.booking.update({
      where: { id: booking.id },
      data: updateData
    });

    // Log status history
    await logStatusHistory(booking.id, status);

    // Sync partner performance
    if (booking.partnerId) {
      await syncPartnerPerformance(booking.partnerId);
    }

    cache.clearCache();
    res.status(200).json({
      success: true,
      message: `Job status transitioned successfully to ${status}.`,
      booking: updated
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job status.' });
  }
};

exports.verifyArrival = async (req, res) => {
  try {
    const { otp } = req.body;
    const bookingId = req.params.id;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please provide the 4-digit arrival OTP.' });
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Role protection: Only the customer who placed the booking can verify arrival
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only the booking customer can verify arrival.' });
    }

    // Idempotency: If arrival was already verified, return success to sync frontend state
    if (booking.status === 'ARRIVED' || booking.status === 'COMPLETED') {
      cache.clearCache();
      return res.status(200).json({
        success: true,
        message: 'Arrival has already been verified.',
        booking
      });
    }

    if (booking.status !== 'ASSIGNED') {
      return res.status(400).json({ success: false, message: 'Service partner must be assigned to verify arrival.' });
    }

    if (booking.arrivalOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Verification failed.' });
    }

    // Update booking status to ARRIVED
    const updated = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: 'ARRIVED',
        booking_status: 'Arrived',
        otpVerified: true,
        arrivalTime: new Date(),
        otpVerifiedAt: new Date()
      }
    });

    // Log status history
    await logStatusHistory(bookingId, 'ARRIVED');

    // Create Notification
    await db.notification.create({
      data: {
        userId: booking.userId,
        type: 'SYSTEM_ALERT',
        title: 'Arrival Verified!',
        message: `Service partner arrival has been verified successfully.`
      }
    }).catch(() => {});

    // Sync partner performance
    if (booking.partnerId) {
      await syncPartnerPerformance(booking.partnerId);
    }

    cache.clearCache();
    res.status(200).json({
      success: true,
      message: 'Service Partner Arrival Verified',
      booking: sanitizeBookingForUser(updated, req.user)
    });
  } catch (error) {
    console.error('Verify arrival error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify partner arrival.' });
  }
};

// ==================== DEPRECATED WORKER STUBS ====================

exports.getMyJobs = async (req, res) => {
  res.status(200).json({ success: true, bookings: [] });
};

exports.getAllWorkers = async (req, res) => {
  res.status(200).json({ success: true, workers: [] });
};

exports.toggleWorkerStatus = async (req, res) => {
  res.status(200).json({ success: true, message: 'Worker status updates are no longer supported.' });
};

exports.getCategoryRequests = async (req, res) => {
  res.status(200).json({ success: true, bookings: [] });
};

async function logStatusHistory(bookingId, status) {
  try {
    await db.bookingStatusHistory.create({
      data: {
        bookingId,
        status
      }
    });
  } catch (err) {
    console.error(`Error logging status history for booking ${bookingId}:`, err.message);
  }
}

async function syncPartnerPerformance(partnerId) {
  if (!partnerId) return;
  try {
    const partner = await db.servicePartner.findUnique({
      where: { id: partnerId }
    });
    if (!partner) return;

    const bookings = await db.booking.findMany({
      where: { partnerId }
    });

    const completedJobs = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelledJobs = bookings.filter(b => b.status === 'CANCELLED').length;
    const activeJobs = bookings.filter(b => ['ASSIGNED', 'ARRIVED'].includes(b.status)).length;
    
    const totalRevenue = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    const reviews = await db.review.findMany({
      where: { partnerId }
    });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0.0;

    await db.partnerPerformance.upsert({
      where: { partnerId },
      update: {
        totalJobs: completedJobs,
        totalRevenue,
        averageRating,
        activeJobs,
        completedJobs,
        cancelledJobs
      },
      create: {
        partnerId,
        totalJobs: completedJobs,
        totalRevenue,
        averageRating,
        activeJobs,
        completedJobs,
        cancelledJobs
      }
    });
  } catch (err) {
    console.error(`Error syncing partner performance for ${partnerId}:`, err.message);
  }
}

exports.logStatusHistory = logStatusHistory;
exports.syncPartnerPerformance = syncPartnerPerformance;
