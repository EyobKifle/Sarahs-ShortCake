
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Protected route for creating orders (authentication required)
router.post('/', protect, orderController.createOrder);

// Public route for getting public order by ID (no authentication required)
router.get('/public/:id', orderController.getPublicOrderById);

// Public route for getting public order by orderNumber (no authentication required)
router.get('/public/orderNumber/:orderNumber', orderController.getPublicOrderByOrderNumber);

// New route to get orders for logged-in customer
router.get('/my-orders', orderController.getOrdersForCustomer);

// Generate daily order report
router.get('/reports/daily', orderController.generateDailyOrderReport);

// Payment methods route
router.get('/payment/methods', (req, res) => paymentController.getPaymentMethods(req, res));

// Protected routes (require admin authentication)
router.use(protect);

// Routes with ':id' parameters moved after specific routes
router.post('/:id/pay', (req, res) => paymentController.processPayment(req, res));
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;
