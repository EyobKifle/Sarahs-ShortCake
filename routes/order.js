const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Add these routes after the existing ones
router.get('/payment/methods', (req, res) => paymentController.getPaymentMethods(req, res));
router.post('/:id/pay', (req, res) => paymentController.processPayment(req, res));

// Public route for creating orders (no authentication required)
router.post('/', orderController.createOrder);

// Protected routes (require admin authentication)
router.use(protect);

router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.get('/reports/daily', orderController.generateDailyOrderReport);

// New route to get orders for logged-in customer
router.get('/my-orders', orderController.getOrdersForCustomer);

module.exports = router;
