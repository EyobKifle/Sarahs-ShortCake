const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', notificationController.getNotifications);

// Protected routes (require admin authentication)
router.use(protect);

router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
