const Order = require('../models/Order');
const { generateOrderReport } = require('../utils/generateReport');

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ 'deliveryInfo.deliveryDate': 1, 'deliveryInfo.deliveryTime': 1 });
        res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
};

// Get orders for logged-in customer
exports.getOrdersForCustomer = async (req, res) => {
    try {
        const customerId = req.user._id;
        const orders = await Order.find({ 'customerId': customerId }).sort({ 'deliveryInfo.deliveryDate': -1, 'deliveryInfo.deliveryTime': -1 });
        res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer orders'
        });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order'
        });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        res.status(200).json({
            success: true,
            data: order,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
};

// Generate daily order report
exports.generateDailyOrderReport = async (req, res) => {
    try {
        const report = await generateOrderReport();
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating daily order report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating daily order report'
        });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const orderData = req.body;
        // Generate orderNumber (e.g., SSC-2023-0001)
        const year = new Date().getFullYear();
        const count = await Order.countDocuments({ createdAt: { $gte: new Date(year, 0, 1) } });
        orderData.orderNumber = `SSC-${year}-${(count + 1).toString().padStart(4, '0')}`;
        const order = new Order(orderData);
        await order.save();
        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order'
        });
    }
};
