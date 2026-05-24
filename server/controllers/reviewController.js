const db = require('../db');

/**
 * Submit a rating and review for a completed service call
 */
exports.submitReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Please supply bookingId and rating score.' });
    }

    const score = parseInt(rating);
    if (score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
    }

    const booking = await db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    // Role protection: Only the customer who booked the service can leave a review
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You did not place this booking.' });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted for completed service calls.' });
    }

    if (!booking.workerId) {
      return res.status(400).json({ success: false, message: 'This booking has no assigned worker to review.' });
    }

    // Check if review already exists
    const existingReview = await db.booking.findUnique({
      where: { id: bookingId },
      include: { review: true }
    });
    if (existingReview && existingReview.review) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this booking.' });
    }

    // Create Review
    const review = await db.review.create({
      data: {
        bookingId,
        userId: req.user.id,
        workerId: booking.workerId,
        rating: score,
        comment: comment || ''
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your rating! Review saved successfully.',
      review
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Failed to save review.' });
  }
};

/**
 * Get all reviews for a specific worker
 */
exports.getWorkerReviews = async (req, res) => {
  try {
    const reviews = await db.review.findMany({
      where: { workerId: req.params.workerId }
    });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve reviews.' });
  }
};
