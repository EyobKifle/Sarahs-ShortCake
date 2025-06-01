const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public admin login route with rate limiter
router.post('/login', authLimiter, authController.adminLogin);

// All admin management routes require admin authentication and admin role
router.use(protect);
router.use(admin);

// Admin dashboard stats route
router.get('/dashboard-stats', adminController.getDashboardStats);

// Admin recent orders route (always returns 10 most recent)
router.get('/recent-orders', adminController.getRecentOrders);

// Admin notification routes
router.get('/notifications/count', adminController.getNotificationCount);
router.get('/messages/unread/count', adminController.getUnreadMessagesCount);

// Admin auth check route
router.get('/auth/check', adminController.checkAuth);

// Example admin routes - you can expand these as needed
router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.get('/:id', adminController.getAdminById);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
