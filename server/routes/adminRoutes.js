const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/auth');

// Get all workers (filtered by status)
router.get('/workers', protect, restrictTo('ADMIN'), adminController.getWorkers);

// Approve a worker
router.put('/workers/:id/approve', protect, restrictTo('ADMIN'), adminController.approveWorker);

// Reject a worker
router.put('/workers/:id/reject', protect, restrictTo('ADMIN'), adminController.rejectWorker);

// Update status manually (e.g. UNDER_REVIEW)
router.put('/workers/:id/status', protect, restrictTo('ADMIN'), adminController.updateWorkerStatus);

// Get analytics
router.get('/analytics', protect, restrictTo('ADMIN'), adminController.getAnalytics);

// Get full dashboard data
router.get('/dashboard-data', protect, restrictTo('ADMIN'), adminController.getDashboardData);

module.exports = router;
