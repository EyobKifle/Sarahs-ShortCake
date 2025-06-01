// Consolidated auth routes with validation and admin management
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Input validation middleware for register
const validateRegister = [
  check('firstName').notEmpty().withMessage('First name is required').trim(),
  check('lastName').notEmpty().withMessage('Last name is required').trim(),
  check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  check('phone').notEmpty().withMessage('Phone number is required').trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Input validation middleware for login
const validateLogin = [
  check('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  check('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/admin/login', authController.adminLogin);
router.post('/logout', authController.logout);

// Password reset routes (OTP-based)
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getProfile);
router.get('/profile', protect, authController.getProfile);

// Admin management routes
router.get('/admins', protect, admin, adminController.getAllAdmins);
router.post('/admins', protect, admin, adminController.createAdmin);
router.get('/admins/:id', protect, admin, adminController.getAdminById);
router.put('/admins/:id', protect, admin, adminController.updateAdmin);
router.delete('/admins/:id', protect, admin, adminController.deleteAdmin);

module.exports = router;
