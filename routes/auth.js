const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');

// Admin login
router.post('/login', authController.login);

// Get current admin profile
router.get('/profile', authController.protect, authController.getProfile);

module.exports = router;
