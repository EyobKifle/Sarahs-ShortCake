const paymentSimulator = require('../utils/paymentSimulator');
const Order = require('../models/Order');

class PaymentController {
    /**
     * Get available payment methods
     */
    async getPaymentMethods(req, res) {
        try {
            const methods = paymentSimulator.getPaymentMethods();
            res.json({ success: true, data: methods });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Process a simulated payment
     */
    async processPayment(req, res) {
        try {
            const { orderId, method, phoneNumber, accountNumber, pin } = req.body;
            
            // Validate input
            if (!orderId || !method || (method === 'Telebirr' && !phoneNumber) || 
                (method === 'CBE' && (!accountNumber || !pin))) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required payment details' 
                });
            }

            // Get order
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Order not found' 
                });
            }

            // Simulate payment
            const result = await paymentSimulator.processPayment(
                method, 
                order.totalPrice,
                { phoneNumber, accountNumber }
            );

            // Update order status
            if (result.success) {
                order.paymentStatus = 'paid';
                order.paymentMethod = method;
                order.paymentDetails = result;
                await order.save();
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new PaymentController();