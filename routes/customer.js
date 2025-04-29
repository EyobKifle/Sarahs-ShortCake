const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/', customerController.createOrUpdateCustomer);

// Protected routes (require authentication and customer role)
router.use(protect);
router.use(authorize('customer'));

router.get('/', customerController.getAllCustomers);

// New route to get logged-in customer's profile
router.get('/me', authController.getProfile);

router.get('/:id', customerController.getCustomerById);

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

module.exports = router;
