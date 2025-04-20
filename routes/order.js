const express = require('express');
const router = express.Router();
const orderController = require('../controllers/ordercontroller');
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentcontroller');

// Add these routes after the existing ones
router.get('/payment/methods', paymentController.getPaymentMethods);
router.post('/:id/pay', paymentController.processPayment);

// Public route for creating orders (no authentication required)
router.post('/', orderController.createOrder);

// Protected routes (require admin authentication)
router.use(protect);

router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.get('/reports/daily', orderController.generateDailyOrderReport);


module.exports = router;
