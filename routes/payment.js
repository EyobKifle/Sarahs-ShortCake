const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Route to create a new payment transaction
router.post('/', protect, paymentController.createPaymentTransaction);

// Route to get payment transaction by order ID
router.get('/order/:orderId', protect, paymentController.getPaymentTransactionByOrder);

// Route to update payment transaction status
router.put('/:id/status', protect, paymentController.updatePaymentStatus);

module.exports = router;
