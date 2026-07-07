const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/auth');
const { cacheMiddleware } = require('../utils/cache');

// Get all workers (filtered by status)
router.get('/workers', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getWorkers);

// Approve a worker
router.put('/workers/:id/approve', protect, restrictTo('ADMIN'), adminController.approveWorker);

// Reject a worker
router.put('/workers/:id/reject', protect, restrictTo('ADMIN'), adminController.rejectWorker);

// Update status manually (e.g. UNDER_REVIEW)
router.put('/workers/:id/status', protect, restrictTo('ADMIN'), adminController.updateWorkerStatus);

// Get analytics
router.get('/analytics', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getAnalytics);

// Get full dashboard data
router.get('/dashboard-data', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getDashboardData);

// Coupon CRUD Management
router.get('/coupons', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getCoupons);
router.post('/coupons', protect, restrictTo('ADMIN'), adminController.createCoupon);
router.put('/coupons/:id', protect, restrictTo('ADMIN'), adminController.updateCoupon);
router.delete('/coupons/:id', protect, restrictTo('ADMIN'), adminController.deleteCoupon);

// Service Partner CRUD Management
router.get('/partners', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getPartners);
router.post('/partners', protect, restrictTo('ADMIN'), adminController.createPartner);
router.put('/partners/:id', protect, restrictTo('ADMIN'), adminController.updatePartner);
router.delete('/partners/:id', protect, restrictTo('ADMIN'), adminController.deletePartner);
router.get('/partners/performance', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getPartnersPerformance);
router.post('/partners/:id/refresh-payout', protect, restrictTo('ADMIN'), adminController.refreshPartnerPayout);

// Customer Ratings
router.get('/reviews', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getReviews);

// Resource-specific admin query lists
router.get('/bookings', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getBookings);
router.get('/customers', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getCustomers);
router.get('/services', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getServices);
router.get('/payments', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getPayments);
router.get('/audit-logs', protect, restrictTo('ADMIN'), cacheMiddleware(10000), adminController.getAuditLogs);

module.exports = router;

