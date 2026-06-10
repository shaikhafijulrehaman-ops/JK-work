const db = require('../db');
const { logStatusHistory, syncPartnerPerformance } = require('./bookingController');

/**
 * Submit a rating and review for a completed service call
 * This transitions booking to COMPLETED, partner to AVAILABLE, logs history & revenue.
 */
exports.submitReview = async (req, res) => {
  try {
    const { bookingId, rating, customerOpinion } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Please supply bookingId and rating score.' });
    }

    const score = parseInt(rating);
    if (score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
    }

    const booking = await db.booking.findUnique({ 
      where: { id: bookingId } 
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    // Role protection: Only the customer who booked the service can leave a review
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You did not place this booking.' });
    }

    // Under the new workflow, status must be ARRIVED to complete the service. We also support COMPLETED for flexibility.
    if (booking.status !== 'ARRIVED' && booking.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Work can only be completed and reviewed when the partner has arrived.' });
    }

    if (!booking.partnerId) {
      return res.status(400).json({ success: false, message: 'This booking has no assigned service partner to review.' });
    }

    // ACID transaction: Update Booking status, ServicePartner status, upsert Review, upsert RevenueData
    const result = await db.transaction(async (tx) => {
      // 1. Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'COMPLETED',
          booking_status: 'Completed'
        }
      });

      // 2. Update service partner status to AVAILABLE and increment current revenue
      await tx.servicePartner.update({
        where: { id: booking.partnerId },
        data: { 
          status: 'AVAILABLE',
          currentRevenue: { increment: booking.finalPrice }
        }
      });

      // 3. Create or update Review (upsert to handle admin resets without failing)
      const review = await tx.review.upsert({
        where: { bookingId },
        update: {
          rating: score,
          customerOpinion: customerOpinion || '-',
          createdAt: new Date()
        },
        create: {
          bookingId,
          userId: req.user.id,
          partnerId: booking.partnerId,
          rating: score,
          customerOpinion: customerOpinion || '-'
        }
      });

      // 4. Create or update RevenueData (upsert to avoid unique key conflicts)
      await tx.revenueData.upsert({
        where: { bookingId },
        update: {
          amount: booking.finalPrice,
          partnerId: booking.partnerId,
          partnerName: booking.partnerName,
          date: new Date()
        },
        create: {
          bookingId: bookingId,
          amount: booking.finalPrice,
          partnerId: booking.partnerId,
          partnerName: booking.partnerName,
          date: new Date()
        }
      });

      // 5. Create booking status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'COMPLETED'
        }
      });

      return { review, updatedBooking };
    });

    // Sync partner performance (outside transaction to avoid pool deadlock during heavy queries)
    await syncPartnerPerformance(booking.partnerId);

    res.status(201).json({
      success: true,
      message: 'Thank you for your rating! Service has been confirmed as completed.',
      review: result.review,
      booking: result.updatedBooking
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete service and save review.' });
  }
};

/**
 * Get all reviews for a specific partner
 */
exports.getWorkerReviews = async (req, res) => {
  try {
    const reviews = await db.review.findMany({
      where: { partnerId: req.params.workerId }
    });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve reviews.' });
  }
};
