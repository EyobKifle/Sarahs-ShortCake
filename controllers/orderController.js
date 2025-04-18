const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { generateOrderReport } = require('../utils/generateReport');

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { customer, items, deliveryOption, neededDate, neededTime, notes } = req.body;
        
        // Calculate total price
        const totalPrice = items.reduce((total, item) => {
            // Base price is $4 per cupcake
            let itemPrice = item.quantity * 4;
            
            // Add $1 for special decorations
            if (item.decoration && item.decoration.trim() !== '') {
                itemPrice += item.quantity * 1;
            }
            
            return total + itemPrice;
        }, 0);
        
        // Add delivery fee if applicable
        const finalPrice = deliveryOption === 'delivery' ? totalPrice + 5 : totalPrice;
        
        // Create the order
        const order = new Order({
            customer,
            items,
            deliveryOption,
            neededDate,
            neededTime,
            notes,
            totalPrice: finalPrice,
            status: 'pending'
        });
        
        await order.save();
        
        // Update customer's order history
        await Customer.findByIdAndUpdate(customer, {
            $push: { orders: order._id }
        });
        
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

// Get all orders with filtering
exports.getAllOrders = async (req, res) => {
    try {
        const { status, deliveryType, startDate, endDate, search } = req.query;
        
        let query = {};
        
        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Delivery type filter
        if (deliveryType && deliveryType !== 'all') {
            query.deliveryOption = deliveryType;
        }
        
        // Date range filter
        if (startDate && endDate) {
            query.neededDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        // Search filter (customer name or order ID)
        if (search) {
            const customers = await Customer.find({
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ]
            });
            
            query.$or = [
                { _id: search },
                { customer: { $in: customers.map(c => c._id) } }
            ];
        }
        
        const orders = await Order.find(query)
            .populate('customer')
            .sort({ neededDate: 1, neededTime: 1 });
        
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

// Get a single order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('customer');
        
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
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('customer');
        
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
exports.createOrder = async (req, res) => {
    try {
        const { deliveryLocation, ...orderData } = req.body;
        
        const order = new Order({
            ...orderData,
            deliveryLocation: deliveryLocation && {
                type: "Point",
                coordinates: [
                    deliveryLocation.lng,
                    deliveryLocation.lat
                ],
                address: deliveryLocation.address
            },
            estimatedDistance: deliveryLocation?.distance,
            estimatedTime: deliveryLocation?.time
        });

        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Generate daily order report
exports.generateDailyOrderReport = async (req, res) => {
    try {
        const { date } = req.query;
        
        const reportDate = date ? new Date(date) : new Date();
        
        const orders = await Order.find({
            neededDate: {
                $gte: new Date(reportDate.setHours(0, 0, 0, 0)),
                $lte: new Date(reportDate.setHours(23, 59, 59, 999))
            }
        }).populate('customer');
        
        const report = generateOrderReport(orders);
        
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