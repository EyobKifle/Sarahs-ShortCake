const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// Payment confirmation upload (no auth required for guest checkout)
router.post('/payment-confirmation', uploadController.uploadPaymentConfirmation);

// Other file uploads (require authentication)
// router.post('/profile-image', protect, uploadController.uploadProfileImage);

module.exports = router;
