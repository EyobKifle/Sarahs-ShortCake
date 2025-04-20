const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Admin login
router.post('/admin/login', authController.adminLogin);

// Customer login
router.post('/login', authController.login);

// Customer register
router.post('/register', authController.register);

// Get current admin profile
router.get('/profile', protect, authController.getProfile);

module.exports = router;
