const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
console.log('customerController:', customerController);
const customerProfileController = require('../controllers/customerProfileController');
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/', customerController.createOrUpdateCustomer);

// Admin routes to manage customers (requires admin role)
router.get('/', protect, authorize('admin'), customerController.getAllCustomers);
router.get('/admin/:id', protect, authorize('admin'), customerController.getCustomerById);
router.get('/admin/credentials/all', protect, authorize('admin'), customerController.getCustomerCredentials);
router.post('/admin/reset-passwords', protect, authorize('admin'), customerController.resetAllPasswords);

// Protected routes (require authentication and customer role)
router.use(protect);
router.use(authorize('customer'));

// New route to get logged-in customer's profile
router.get('/me', authController.getProfile);

// New route to update logged-in customer's profile
router.put('/me', customerProfileController.updateProfile);


// New route to get dashboard stats for logged-in customer
router.get('/dashboard-stats', customerController.getDashboardStats);

// Get addresses for logged-in customer
router.get('/addresses', customerController.getAddresses);

// Get wishlist items for logged-in customer
router.get('/wishlist', customerController.getWishlist);

// Remove item from wishlist
router.delete('/wishlist/:itemId', customerController.removeFromWishlist);

// Get reviews for logged-in customer
router.get('/reviews', customerController.getReviews);

router.get('/:id', customerController.getCustomerById);

module.exports = router;
