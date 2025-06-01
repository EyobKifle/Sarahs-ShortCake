const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

// Public route to create a contact message
router.post('/', contactController.createContactMessage);

// Admin routes to manage contact messages
router.get('/', protect, authorize('admin'), contactController.getAllContactMessages);
router.get('/:id', protect, authorize('admin'), contactController.getContactMessageById);
router.delete('/:id', protect, authorize('admin'), contactController.deleteContactMessage);
router.patch('/:id/read', protect, authorize('admin'), contactController.markAsRead);
router.post('/:id/reply', protect, authorize('admin'), contactController.replyToMessage);

module.exports = router;
