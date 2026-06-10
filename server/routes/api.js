const express = require('express');
const router = express.Router();

// Middlewares
const { protect, restrictTo } = require('../middlewares/auth');
const { authLimiter, bookingLimiter } = require('../middlewares/rateLimiter');

// Controllers
const authCtrl = require('../controllers/authController');
const serviceCtrl = require('../controllers/serviceController');
const bookingCtrl = require('../controllers/bookingController');
const reviewCtrl = require('../controllers/reviewController');
const paymentCtrl = require('../controllers/paymentController');
const aiAgentCtrl = require('../controllers/aiAgentController');
const statsCtrl = require('../controllers/statsController');
const addressCtrl = require('../controllers/addressController');

// ==================== AUTHENTICATION ====================
router.post('/auth/register', authCtrl.register);
router.post('/auth/register-partner', authCtrl.registerPartner);
router.post('/auth/login', authLimiter, authCtrl.login);
router.post('/auth/google-login', authCtrl.googleLogin);
router.get('/auth/refresh', authCtrl.refresh);
router.get('/auth/logout', authCtrl.logout);
router.get('/auth/me', protect, authCtrl.getMe);
router.post('/auth/otp', authCtrl.sendOTP);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/waitlist', authCtrl.joinWaitlist);
router.post('/auth/sync-supabase', authCtrl.syncSupabase);
router.post('/auth/verify-otp', authCtrl.verifyOTP);
router.put('/auth/update-profile', protect, authCtrl.updateProfile);

// ==================== ADDRESS BOOK CRUD ====================
router.get('/addresses', protect, addressCtrl.getAddresses);
router.post('/addresses', protect, addressCtrl.createAddress);
router.put('/addresses/:id', protect, addressCtrl.updateAddress);
router.delete('/addresses/:id', protect, addressCtrl.deleteAddress);
router.put('/addresses/:id/default', protect, addressCtrl.setDefaultAddress);

// ==================== SERVICE CATALOG ====================
router.get('/services', serviceCtrl.getAllServices);
router.get('/services/:id', serviceCtrl.getServiceById);
router.post('/services', protect, restrictTo('ADMIN'), serviceCtrl.createService);
router.put('/services/:id', protect, restrictTo('ADMIN'), serviceCtrl.updateService);
router.delete('/services/:id', protect, restrictTo('ADMIN'), serviceCtrl.deleteService);

// ==================== DYNAMIC COUPONS ====================
router.post('/coupons/validate', bookingCtrl.validateCouponCode);

// ==================== BOOKINGS SYSTEM ====================
router.post('/bookings', protect, bookingLimiter, bookingCtrl.createBooking);
router.post('/bookings/payment-success', protect, bookingCtrl.confirmPaymentSuccess);
router.get('/bookings', protect, bookingCtrl.getBookings);
router.get('/bookings/:id', protect, bookingCtrl.getBookingById);
router.put('/bookings/:id/assign', protect, restrictTo('ADMIN'), bookingCtrl.assignPartner);
router.put('/bookings/:id/status', protect, restrictTo('ADMIN'), bookingCtrl.updateBookingStatus);
router.post('/bookings/:id/verify-arrival', protect, bookingCtrl.verifyArrival);
router.put('/bookings/:id/accept', protect, restrictTo('WORKER'), bookingCtrl.acceptBookingByPartner);
router.put('/bookings/:id/reject', protect, restrictTo('WORKER'), bookingCtrl.rejectBookingByPartner);

// ==================== WORKERS & PAYROLL LEDGER ====================
router.get('/workers', protect, restrictTo('ADMIN'), bookingCtrl.getAllWorkers);
router.put('/workers/:id/status', protect, restrictTo('ADMIN'), bookingCtrl.toggleWorkerStatus);
router.get('/workers/jobs', protect, restrictTo('WORKER'), bookingCtrl.getMyJobs);
router.get('/workers/requests', protect, restrictTo('WORKER'), bookingCtrl.getCategoryRequests);

// ==================== REVIEWS & RATINGS ====================
router.post('/reviews', protect, reviewCtrl.submitReview);
router.get('/reviews/worker/:workerId', reviewCtrl.getWorkerReviews);

// ==================== SECURE PAYMENTS ====================
router.post('/payments/initialize', protect, paymentCtrl.initializePayment);
router.post('/payments/simulate-success', protect, paymentCtrl.simulatePaymentSuccess);
router.post('/payments/webhook', paymentCtrl.razorpayWebhook); // Secure signature check
router.post('/create-order', protect, paymentCtrl.createOrder);
router.post('/verify-payment', protect, paymentCtrl.verifyPayment);

// ==================== AI CALL AGENT (MICROSERVICE ENDPOINT) ====================
router.post('/ai-agent/simulate', protect, aiAgentCtrl.simulateCallInput);

// ==================== BUSINESS ANALYTICS & AUDIT LOGS ====================
router.get('/stats', protect, restrictTo('ADMIN'), statsCtrl.getAdminStats);
router.get('/stats/audit', protect, restrictTo('ADMIN'), statsCtrl.getAuditLogs);
router.get('/notifications', protect, statsCtrl.getMyNotifications);
router.put('/notifications/:id/read', protect, statsCtrl.markAsRead);

// ==================== ADMIN DASHBOARD ====================
router.use('/admin', require('./adminRoutes'));

// Debug routes cleaned up

module.exports = router;
