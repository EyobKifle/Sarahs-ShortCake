const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

// Public route to create a contact message
router.post('/', contactController.createContactMessage);

// Admin route to get all contact messages
router.get('/', protect, authorize('admin'), contactController.getAllContactMessages);

module.exports = router;
