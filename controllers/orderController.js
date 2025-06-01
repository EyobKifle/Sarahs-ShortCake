const Order = require('../models/Order');
const Product = require('../models/Product');
const { generateOrderReport } = require('../utils/generateReport');

// Helper function to safely convert order to object with defaults
const safeOrderToObject = (order, index = 'unknown') => {
    try {
        if (!order) {
            console.log(`Order at index ${index} is null/undefined`);
            return null;
        }

        let orderObj;
        if (typeof order.toObject === 'function') {
            orderObj = order.toObject();
        } else if (typeof order === 'object') {
            orderObj = { ...order };
        } else {
            console.log(`Order at index ${index} is not an object:`, typeof order);
            return null;
        }

        if (!orderObj || typeof orderObj !== 'object') {
            console.log(`Failed to convert order at index ${index} to object`);
            return null;
        }

        // Set safe defaults for all required fields
        const safeOrder = {
            _id: orderObj._id || `temp-${Date.now()}-${index}`,
            orderNumber: orderObj.orderNumber || `ORD-${Date.now()}-${index}`,
            status: orderObj.status || 'pending',
            customerType: orderObj.customerType || (orderObj.customerId ? 'registered' : 'guest'),
            totalAmount: typeof orderObj.totalAmount === 'number' ? orderObj.totalAmount : 0,
            items: Array.isArray(orderObj.items) ? orderObj.items : [],
            deliveryInfo: {
                method: orderObj.deliveryInfo?.method || 'pickup',
                deliveryDate: orderObj.deliveryInfo?.deliveryDate || new Date(),
                deliveryTime: orderObj.deliveryInfo?.deliveryTime || '00:00',
                address: orderObj.deliveryInfo?.address || ''
            },
            customer: {
                firstName: orderObj.customerId?.firstName || orderObj.customer?.firstName || orderObj.guestInfo?.name?.split(' ')[0] || 'Unknown',
                lastName: orderObj.customerId?.lastName || orderObj.customer?.lastName || orderObj.guestInfo?.name?.split(' ').slice(1).join(' ') || 'Customer',
                email: orderObj.customerId?.email || orderObj.customer?.email || orderObj.guestInfo?.email || 'unknown@example.com',
                phone: orderObj.customerId?.phone || orderObj.customer?.phone || orderObj.guestInfo?.phone || ''
            },
            customerId: orderObj.customerId || null,
            guestInfo: orderObj.guestInfo || null,
            payment: {
                method: orderObj.payment?.method || (orderObj.customerType === 'registered' ? 'integrated' : 'proof_upload'),
                amount: orderObj.payment?.amount || orderObj.totalAmount || 0,
                status: orderObj.payment?.status || 'pending',
                transactionId: orderObj.payment?.transactionId || null,
                paymentDate: orderObj.payment?.paymentDate || null,
                proofImage: orderObj.payment?.proofImage || null,
                proofImageOriginalName: orderObj.payment?.proofImageOriginalName || null,
                paymentProvider: orderObj.payment?.paymentProvider || null,
                paymentReference: orderObj.payment?.paymentReference || null
            },
            paymentMethod: orderObj.paymentMethod || orderObj.payment?.method || 'cash', // Legacy support
            createdAt: orderObj.createdAt || new Date(),
            updatedAt: orderObj.updatedAt || new Date()
        };

        return safeOrder;
    } catch (error) {
        console.error(`Error processing order at index ${index}:`, error);
        return null;
    }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        console.log('Fetching all orders...');
        const rawOrders = await Order.find()
            .populate('customerId', 'firstName lastName email phone address')
            .sort({ createdAt: -1 });
        console.log(`Fetched ${rawOrders.length} raw orders from database`);

        const processedOrders = [];
        for (let i = 0; i < rawOrders.length; i++) {
            const safeOrder = safeOrderToObject(rawOrders[i], i);
            if (safeOrder) {
                processedOrders.push(safeOrder);
            }
        }

        console.log(`Successfully processed ${processedOrders.length} orders out of ${rawOrders.length}`);

        // Check if response has already been sent
        if (res.headersSent) {
            console.log('Response headers already sent, cannot send response');
            return;
        }

        try {
            res.status(200).json(processedOrders);
            console.log('Response sent successfully');
        } catch (responseError) {
            console.error('Error sending response:', responseError);
            throw responseError;
        }
    } catch (error) {
        console.error('Error in getAllOrders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
};

// Get limited number of recent orders
exports.getAllOrdersLimited = async (limit) => {
    try {
        console.log(`Fetching ${limit} limited orders...`);
        const rawOrders = await Order.find()
            .populate('customerId', 'firstName lastName email phone address')
            .sort({ createdAt: -1 })
            .limit(limit);
        console.log(`Fetched ${rawOrders.length} limited raw orders from database`);

        const processedOrders = [];
        for (let i = 0; i < rawOrders.length; i++) {
            const safeOrder = safeOrderToObject(rawOrders[i], `limited-${i}`);
            if (safeOrder) {
                processedOrders.push(safeOrder);
            }
        }

        console.log(`Successfully processed ${processedOrders.length} limited orders out of ${rawOrders.length}`);
        return processedOrders;
    } catch (error) {
        console.error('Error in getAllOrdersLimited:', error);
        throw error;
    }
};

// Get orders for logged-in customer
exports.getOrdersForCustomer = async (req, res) => {
    try {
        const customerId = req.user._id;
        console.log(`Fetching orders for customer: ${customerId}`);

        const rawOrders = await Order.find({ 'customerId': customerId })
            .populate('customerId', 'firstName lastName email phone address')
            .sort({ 'deliveryInfo.deliveryDate': -1, 'deliveryInfo.deliveryTime': -1 });
        console.log(`Found ${rawOrders.length} orders for customer ${customerId}`);

        const processedOrders = [];
        for (let i = 0; i < rawOrders.length; i++) {
            const safeOrder = safeOrderToObject(rawOrders[i], `customer-${i}`);
            if (safeOrder) {
                processedOrders.push(safeOrder);
            }
        }

        res.status(200).json({
            success: true,
            data: processedOrders
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
        const orderId = req.params.id;
        console.log(`Fetching order by ID: ${orderId}`);

        const rawOrder = await Order.findById(orderId)
            .populate('customerId', 'firstName lastName email phone address')
            .lean();

        if (!rawOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Enhanced order details with complete information
        const Product = require('../models/Product');
        const enhancedItems = await Promise.all((rawOrder.items || []).map(async (item) => {
            let product = null;
            try {
                if (item.productId) {
                    const objectIdRegex = /^[a-f\d]{24}$/i;
                    if (objectIdRegex.test(item.productId)) {
                        product = await Product.findById(item.productId);
                    } else {
                        // Try to find by slug first, then by name as fallback
                        product = await Product.findOne({ slug: item.productId.toLowerCase() }) ||
                                 await Product.findOne({ name: item.productId });
                    }
                }
            } catch (err) {
                console.log('Error fetching product:', err);
            }

            return {
                ...item,
                product: product ? {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.imagePath,
                    description: product.description,
                    category: product.category
                } : {
                    name: item.name || 'Unknown Product',
                    price: item.price || 0,
                    image: '',
                    description: '',
                    category: 'Unknown'
                },
                subtotal: (item.price || 0) * (item.quantity || 1),
                customizations: item.customization || item.customizations || {}
            };
        }));

        const enhancedOrder = {
            ...rawOrder,
            orderNumber: rawOrder.orderNumber || `ORD-${rawOrder._id.toString().slice(-8).toUpperCase()}`,
            customer: rawOrder.customerId || {
                firstName: rawOrder.guestInfo?.name?.split(' ')[0] || 'Guest',
                lastName: rawOrder.guestInfo?.name?.split(' ').slice(1).join(' ') || 'Customer',
                email: rawOrder.guestInfo?.email || '',
                phone: rawOrder.guestInfo?.phone || '',
                address: rawOrder.deliveryInfo?.address || ''
            },
            items: enhancedItems,
            timeline: [
                { status: 'pending', date: rawOrder.createdAt, label: 'Order Placed' },
                rawOrder.confirmedAt ? { status: 'confirmed', date: rawOrder.confirmedAt, label: 'Order Confirmed' } : null,
                rawOrder.status === 'processing' ? { status: 'processing', date: rawOrder.updatedAt, label: 'In Progress' } : null,
                rawOrder.status === 'completed' ? { status: 'completed', date: rawOrder.updatedAt, label: 'Completed' } : null,
                rawOrder.status === 'cancelled' ? { status: 'cancelled', date: rawOrder.updatedAt, label: 'Cancelled' } : null
            ].filter(Boolean),
            paymentDetails: {
                method: rawOrder.paymentMethod || 'Not specified',
                status: rawOrder.paymentStatus || 'pending',
                amount: rawOrder.totalAmount || 0,
                currency: 'USD',
                transactionId: rawOrder.transactionId || null
            },
            deliveryDetails: {
                method: rawOrder.deliveryInfo?.method || 'pickup',
                address: rawOrder.deliveryInfo?.address || '',
                deliveryDate: rawOrder.deliveryInfo?.deliveryDate || null,
                deliveryTime: rawOrder.deliveryInfo?.deliveryTime || null,
                instructions: rawOrder.deliveryInfo?.instructions || '',
                fee: rawOrder.deliveryInfo?.fee || 0
            },
            totals: {
                subtotal: enhancedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0),
                deliveryFee: rawOrder.deliveryInfo?.fee || 0,
                tax: rawOrder.tax || 0,
                discount: rawOrder.discount || 0,
                total: rawOrder.totalAmount || 0
            }
        };

        res.status(200).json({
            success: true,
            data: enhancedOrder
        });
    } catch (error) {
        console.error('Error fetching order by ID:', error);
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

        // Update inventory when order status changes to completed
        let inventoryMessage = '';
        if (status === 'completed') {
            const { deductInventoryForOrder } = require('../utils/inventoryDeduction');
            const Product = require('../models/Product');

            // Convert order items to the format expected by deductInventoryForOrder
            // Need to fetch product names from Product model
            const orderItems = await Promise.all(order.items.map(async (item) => {
                let productName = 'Unknown Product';

                try {
                    // Try to find product by ID or slug
                    let product = null;
                    const objectIdRegex = /^[a-f\d]{24}$/i;

                    if (objectIdRegex.test(item.productId)) {
                        product = await Product.findById(item.productId);
                    } else {
                        // Try to find by slug first, then by name as fallback
                        product = await Product.findOne({ slug: item.productId.toLowerCase() }) ||
                                 await Product.findOne({ name: item.productId });
                    }

                    if (product) {
                        productName = product.name;
                    } else {
                        // Convert slug-like productId to readable name as fallback
                        if (typeof item.productId === 'string' && item.productId.includes('-')) {
                            productName = item.productId
                                .split('-')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching product for inventory deduction:', error);
                }

                return {
                    productName: productName,
                    quantity: item.quantity
                };
            }));

            console.log('🔄 Processing inventory deduction for order items:', orderItems);

            const inventoryUpdate = await deductInventoryForOrder(
                orderItems,
                order.orderNumber || order._id.toString(),
                req.user ? req.user.name : 'Admin'
            );

            if (inventoryUpdate.success) {
                inventoryMessage = ` and inventory updated (${inventoryUpdate.summary.totalIngredients} ingredients deducted)`;

                // Log warnings if any
                if (inventoryUpdate.warnings.length > 0) {
                    console.warn('Inventory warnings for order:', inventoryUpdate.warnings);
                }
            } else {
                console.error('Failed to update inventory for order:', inventoryUpdate.errors);
                inventoryMessage = ' (inventory update failed)';

                // Still allow order completion but log the error
                console.error('Inventory deduction errors:', inventoryUpdate.errors);
            }
        }

        // Send status update notifications
        try {
            const emailService = require('../services/emailService');
            let customerEmail = null;

            // Determine customer email
            if (order.customerId && order.customerId.email) {
                customerEmail = order.customerId.email;
            } else if (order.guestInfo && order.guestInfo.email) {
                customerEmail = order.guestInfo.email;
            }

            // Send email for specific status changes
            if (customerEmail && (status === 'confirmed' || status === 'accepted' || status === 'completed')) {
                console.log(`📧 Sending ${status} email to: ${customerEmail}`);
                await emailService.sendOrderStatusUpdate(order, customerEmail, status);
                console.log('✅ Order status update email sent successfully');
            }
        } catch (notificationError) {
            console.error('⚠️ Error sending status update notifications:', notificationError);
            // Don't fail the status update if notifications fail
        }

        res.status(200).json({
            success: true,
            data: order,
            message: 'Order status updated successfully' + inventoryMessage,
            inventoryUpdate: status === 'completed' ? {
                success: inventoryMessage.includes('updated'),
                details: inventoryMessage
            } : undefined
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
};

// Accept order (change status to confirmed)
exports.acceptOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: 'confirmed',
                confirmedAt: new Date()
            },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update inventory when order is confirmed
        const inventoryController = require('./inventoryController');
        const inventoryUpdate = await inventoryController.updateInventoryForOrder(order.items);

        if (!inventoryUpdate.success) {
            console.warn('Failed to update inventory for order:', inventoryUpdate.error);
        }

        // Send order acceptance notification
        try {
            const emailService = require('../services/emailService');
            let customerEmail = null;

            // Determine customer email
            if (order.customerId && order.customerId.email) {
                customerEmail = order.customerId.email;
            } else if (order.guestInfo && order.guestInfo.email) {
                customerEmail = order.guestInfo.email;
            }

            // Send confirmation email
            if (customerEmail) {
                console.log(`📧 Sending order confirmation email to: ${customerEmail}`);
                await emailService.sendOrderStatusUpdate(order, customerEmail, 'confirmed');
                console.log('✅ Order acceptance email sent successfully');
            }
        } catch (notificationError) {
            console.error('⚠️ Error sending order acceptance notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            data: order,
            message: 'Order accepted successfully' + (inventoryUpdate.success ? ' and inventory updated' : '')
        });
    } catch (error) {
        console.error('Error accepting order:', error);
        res.status(500).json({
            success: false,
            message: 'Error accepting order'
        });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: 'cancelled',
                cancellationReason: reason || 'No reason provided'
            },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Send order cancellation notification
        try {
            const NotificationService = require('../services/notificationService');
            await NotificationService.sendOrderStatusUpdate(order, 'cancelled');
            console.log('✅ Order cancellation notifications sent successfully');
        } catch (notificationError) {
            console.error('⚠️ Error sending order cancellation notifications:', notificationError);
        }

        res.status(200).json({
            success: true,
            data: order,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling order'
        });
    }
};

// Update order details
exports.updateOrder = async (req, res) => {
    try {
        const { deliveryInfo, customer, guestInfo, items, totalAmount, paymentMethod } = req.body;

        const updateData = {};
        if (deliveryInfo) updateData.deliveryInfo = deliveryInfo;
        if (customer) updateData.customer = customer;
        if (guestInfo) updateData.guestInfo = guestInfo;
        if (items) updateData.items = items;
        if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
        if (paymentMethod) updateData.paymentMethod = paymentMethod;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order,
            message: 'Order updated successfully'
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order'
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
    // Generate EDB5A185 format order number
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let orderNumber = '';

    // Add 3 random letters
    for (let i = 0; i < 3; i++) {
        orderNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Add random number (1-9)
    orderNumber += Math.floor(Math.random() * 9) + 1;

    // Add random letter
    orderNumber += letters.charAt(Math.floor(Math.random() * letters.length));

    // Add 3-4 random numbers
    const numCount = Math.random() > 0.5 ? 3 : 4;
    for (let i = 0; i < numCount; i++) {
        orderNumber += Math.floor(Math.random() * 10);
    }

    return orderNumber;
}

// Create guest order (no authentication required)
exports.createGuestOrder = async (req, res) => {
    try {
        let orderData = req.body;
        console.log('🛒 Creating guest order with data:', orderData);

        // Force guest customer type
        orderData.customerType = 'guest';
        orderData.customerId = null;

        // Set totalAmount from total or calculate from subtotal, tax, and deliveryFee
        if (orderData.total !== undefined) {
            orderData.totalAmount = orderData.total;
        } else {
            const subtotal = orderData.subtotal || 0;
            const tax = orderData.tax || 0;
            const deliveryFee = orderData.deliveryFee || 0;
            orderData.totalAmount = subtotal + tax + deliveryFee;
        }

        // Initialize payment object if not provided
        if (!orderData.payment) {
            orderData.payment = {};
        }

        // Set payment method for guest (always proof upload)
        orderData.payment.method = 'proof_upload';
        orderData.payment.amount = orderData.payment.amount || orderData.totalAmount;
        orderData.payment.status = 'pending';

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

        // Validate guest information is provided
        if (!orderData.guestInfo || !orderData.guestInfo.name || !orderData.guestInfo.email) {
            return res.status(400).json({
                success: false,
                message: 'Guest name and email are required for guest orders'
            });
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
        }

        // Set default status to pending
        orderData.status = 'pending';

        // Generate order number
        if (!orderData.orderNumber) {
            orderData.orderNumber = generateOrderNumber();
        }

        console.log('🛒 Final guest order data before saving:', orderData);

        const order = new Order(orderData);
        await order.save();

        console.log('✅ Guest order created successfully:', order.orderNumber);

        // Send notifications after order creation
        try {
            const NotificationService = require('../services/notificationService');

            // Send order confirmation to customer
            await NotificationService.sendOrderConfirmation(order);

            // Send new order alert to admin
            await NotificationService.sendNewOrderAlert(order);

            console.log('✅ Guest order notifications sent successfully');
        } catch (notificationError) {
            console.error('⚠️ Error sending guest order notifications:', notificationError);
            // Don't fail the order creation if notifications fail
        }

        res.status(201).json({
            success: true,
            data: order,
            message: 'Guest order created successfully',
            orderNumber: order.orderNumber,
            orderId: order._id
        });
    } catch (error) {
        console.error('❌ Error creating guest order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating guest order',
            error: error.message
        });
    }
};

exports.createOrder = async (req, res) => {
    try {
        let orderData = req.body;
        console.log('Received Order Data:', orderData);

        // Log req.user to verify authentication
        console.log('Authenticated user in createOrder:', req.user);

        // Set customerId and customerType from authenticated user if available
        if (req.user && req.user._id) {
            orderData.customerId = req.user._id;
            orderData.customerType = 'registered';
        } else {
            orderData.customerType = 'guest';
        }

        // Set totalAmount from total or calculate from subtotal, tax, and deliveryFee
        if (orderData.total !== undefined) {
            orderData.totalAmount = orderData.total;
        } else {
            const subtotal = orderData.subtotal || 0;
            const tax = orderData.tax || 0;
            const deliveryFee = orderData.deliveryFee || 0;
            orderData.totalAmount = subtotal + tax + deliveryFee;
        }

        // Initialize payment object if not provided
        if (!orderData.payment) {
            orderData.payment = {};
        }

        // Set payment method based on customer type if not provided
        if (!orderData.payment.method) {
            orderData.payment.method = orderData.customerType === 'registered' ? 'integrated' : 'proof_upload';
        }

        // Set payment amount
        orderData.payment.amount = orderData.payment.amount || orderData.totalAmount;

        // Set order status to 'processing' if paymentMethod is 'cash' to assume paid
        if (orderData.paymentMethod && orderData.paymentMethod.toLowerCase() === 'cash') {
            orderData.status = 'processing';
        }

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

        // Send notifications after order creation
        try {
            const NotificationService = require('../services/notificationService');

            // Send order confirmation to customer
            await NotificationService.sendOrderConfirmation(order);

            // Send new order alert to admin
            await NotificationService.sendNewOrderAlert(order);

            console.log('✅ Order notifications sent successfully');
        } catch (notificationError) {
            console.error('⚠️ Error sending order notifications:', notificationError);
            // Don't fail the order creation if notifications fail
        }

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
                // Try to find by slug first, then by name as fallback
                product = await Product.findOne({ slug: item.productId.toLowerCase() }) ||
                         await Product.findOne({ name: item.productId });
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
