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

// Get analytics
router.get('/analytics', protect, restrictTo('ADMIN'), adminController.getAnalytics);

module.exports = router;
