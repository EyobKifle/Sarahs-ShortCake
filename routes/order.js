
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Protected route for creating orders (authentication required)
router.post('/', protect, orderController.createOrder);

// Note: Public order routes are now handled directly in server.js to bypass authentication

// New route to get orders for logged-in customer
router.get('/my-orders', orderController.getOrdersForCustomer);

// Generate daily order report
router.get('/reports/daily', orderController.generateDailyOrderReport);

// Payment methods route
router.get('/payment/methods', (req, res) => paymentController.getPaymentMethods(req, res));

// Add route to get all orders or limited recent orders (admin protected)
router.get('/', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit);
        if (limit && limit > 0) {
            const orders = await orderController.getAllOrdersLimited(limit);
            res.status(200).json(orders);
        } else {
            // Call the controller function with req and res
            await orderController.getAllOrders(req, res);
        }
    } catch (error) {
        console.error('Error in order route:', error);
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

// Protected routes (require admin authentication)
router.use(protect);

// Routes with ':id' parameters moved after specific routes
router.post('/:id/pay', (req, res) => paymentController.processPayment(req, res));
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id', orderController.updateOrder);
router.post('/:id/accept', orderController.acceptOrder);
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;
