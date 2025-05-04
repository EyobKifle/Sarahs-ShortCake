const Order = require('../models/Order');
const Product = require('../models/Product');
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


function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${randomPart}`;
}

// Create new order
exports.createOrder = async (req, res) => {
    try {
        let orderData = req.body;
        console.log('Received Order Data:', orderData);

        // Normalize payload to expected schema
        // Map items[].id to items[].productId
        if (orderData.items && Array.isArray(orderData.items)) {
            orderData.items = orderData.items.map(item => {
                if (item.id && !item.productId) {
                    item.productId = item.id;
                    delete item.id;
                }
                // Map customizations array to customization object
                if (item.customizations && Array.isArray(item.customizations)) {
                    const customizationObj = {};
                    item.customizations.forEach(c => {
                        const key = c.name.toLowerCase().replace(/\s+/g, '');
                        customizationObj[key] = c.value;
                    });
                    item.customization = customizationObj;
                    delete item.customizations;
                }
                return item;
            });
        }

        // Map customerInfo to guestInfo if present
        if (orderData.customerInfo) {
            orderData.guestInfo = {
                name: orderData.customerInfo.name || '',
                email: orderData.customerInfo.email || '',
                phone: orderData.customerInfo.phone || ''
            };
            delete orderData.customerInfo;
        }

        // Map deliveryMethod to deliveryInfo.method
        if (!orderData.deliveryInfo) {
            orderData.deliveryInfo = {};
        }
        if (orderData.deliveryMethod) {
            orderData.deliveryInfo.method = orderData.deliveryMethod.toLowerCase();
            delete orderData.deliveryMethod;
        }

        // Set default deliveryInfo.method to 'pickup' if not provided
        const validDeliveryMethods = ['pickup', 'delivery'];
        if (!orderData.deliveryInfo.method) {
            orderData.deliveryInfo.method = 'pickup';
        }
        if (!validDeliveryMethods.includes(orderData.deliveryInfo.method)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid deliveryInfo.method. Must be "pickup" or "delivery".'
            });
        }

        // Validate items and productId presence
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order items are required and must be a non-empty array.'
            });
        }
        for (const [index, item] of orderData.items.entries()) {
            if (!item.productId) {
                return res.status(400).json({
                    success: false,
                    message: `productId is required for item at index ${index}.`
                });
            }
            // Remove ObjectId validation since productId is now string
        }

        // Normalize and validate status
        if (orderData.status) {
            orderData.status = orderData.status.toLowerCase();
        }
        const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
        if (orderData.status && !validStatuses.includes(orderData.status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}.`
            });
        }

        // Use provided orderNumber if exists, else generate new one
        if (!orderData.orderNumber) {
            orderData.orderNumber = generateOrderNumber();
        }

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

// Existing getPublicOrderById by MongoDB _id
exports.getPublicOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Populate product details for each item
        const populatedItems = await Promise.all(order.items.map(async (item) => {
            // Check if productId is a valid ObjectId, else fallback to find by name
            let product = null;
            const objectIdRegex = /^[a-f\d]{24}$/i;
            if (objectIdRegex.test(item.productId)) {
                product = await Product.findById(item.productId);
                } else {
                product = await Product.findOne({ slug: item.productId.toLowerCase() });
                }
            console.log(`Lookup product for productId: ${item.productId}, found: ${product ? product.name : 'null'}`);
            return {
                ...item.toObject(),
                name: product ? product.name : 'Unknown Product',
                image: product ? product.imagePath.replace(/^images\//, '') : ''
            };
        }));

        const orderObj = order.toObject();
        orderObj.items = populatedItems;

        res.status(200).json({
            success: true,
            data: orderObj
        });
    } catch (error) {
        console.error('Error fetching public order:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching public order'
        });
    }
};

// New API to get public order by orderNumber
exports.getPublicOrderByOrderNumber = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Populate product details for each item
        const populatedItems = await Promise.all(order.items.map(async (item) => {
            // Check if productId is a valid ObjectId, else fallback to find by name
            let product = null;
            const objectIdRegex = /^[a-f\d]{24}$/i;
            if (objectIdRegex.test(item.productId)) {
                product = await Product.findById(item.productId);
            } else {
                product = await Product.findOne({ name: item.productId });
            }
            return {
                ...item.toObject(),
                name: product ? product.name : 'Unknown Product',
                image: product ? product.imagePath : ''
            };
        }));

        const orderObj = order.toObject();
        orderObj.items = populatedItems;

        res.status(200).json({
            success: true,
            data: orderObj
        });
    } catch (error) {
        console.error('Error fetching public order by orderNumber:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching public order'
        });
    }
};
