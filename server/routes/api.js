const express = require('express');
const router = express.Router();

// Middlewares
const { protect, restrictTo } = require('../middlewares/auth');
const { authLimiter, bookingLimiter } = require('../middlewares/rateLimiter');

// Controllers
const authCtrl = require('../controllers/authController');
const serviceCtrl = require('../controllers/serviceController');
const bookingCtrl = require('../controllers/bookingController');
const workerCtrl = require('../controllers/workerController');
const reviewCtrl = require('../controllers/reviewController');
const paymentCtrl = require('../controllers/paymentController');
const aiAgentCtrl = require('../controllers/aiAgentController');
const statsCtrl = require('../controllers/statsController');

// ==================== AUTHENTICATION ====================
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authLimiter, authCtrl.login);
router.get('/auth/refresh', authCtrl.refresh);
router.get('/auth/logout', authCtrl.logout);
router.get('/auth/me', protect, authCtrl.getMe);
router.post('/auth/otp', authCtrl.sendOTP);
router.post('/auth/forgot-password', authCtrl.forgotPassword);

// ==================== SERVICE CATALOG ====================
router.get('/services', serviceCtrl.getAllServices);
router.get('/services/:id', serviceCtrl.getServiceById);
router.post('/services', protect, restrictTo('ADMIN'), serviceCtrl.createService);
router.put('/services/:id', protect, restrictTo('ADMIN'), serviceCtrl.updateService);
router.delete('/services/:id', protect, restrictTo('ADMIN'), serviceCtrl.deleteService);

// ==================== BOOKINGS SYSTEM ====================
router.post('/bookings', protect, bookingLimiter, bookingCtrl.createBooking);
router.get('/bookings', protect, bookingCtrl.getBookings);
router.get('/bookings/:id', protect, bookingCtrl.getBookingById);
router.put('/bookings/:id/assign', protect, restrictTo('ADMIN'), bookingCtrl.assignWorker);
router.put('/bookings/:id/status', protect, workerCtrl.updateJobStatus);

// ==================== WORKERS & PAYROLL LEDGER ====================
router.get('/workers', protect, restrictTo('ADMIN'), workerCtrl.getAllWorkers);
router.put('/workers/:id/status', protect, restrictTo('ADMIN'), workerCtrl.toggleWorkerStatus);
router.get('/workers/jobs', protect, restrictTo('WORKER'), workerCtrl.getMyJobs);

// ==================== REVIEWS & RATINGS ====================
router.post('/reviews', protect, reviewCtrl.submitReview);
router.get('/reviews/worker/:workerId', reviewCtrl.getWorkerReviews);

// ==================== SECURE PAYMENTS ====================
router.post('/payments/initialize', protect, paymentCtrl.initializePayment);
router.post('/payments/simulate-success', protect, paymentCtrl.simulatePaymentSuccess);
router.post('/payments/webhook', paymentCtrl.razorpayWebhook); // Secure signature check

// ==================== AI CALL AGENT (MICROSERVICE ENDPOINT) ====================
router.post('/ai-agent/simulate', protect, aiAgentCtrl.simulateCallInput);

// ==================== BUSINESS ANALYTICS & AUDIT LOGS ====================
router.get('/stats', protect, restrictTo('ADMIN'), statsCtrl.getAdminStats);
router.get('/stats/audit', protect, restrictTo('ADMIN'), statsCtrl.getAuditLogs);
router.get('/notifications', protect, statsCtrl.getMyNotifications);
router.put('/notifications/:id/read', protect, statsCtrl.markAsRead);

module.exports = router;
