const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const PDFDocument = require('pdfkit');

// Helper functions to extract report data without response objects
async function getSalesReportData(startDate, endDate) {
    const { period = 'daily' } = {};

    // Set default date range (last 30 days if not provided)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Ensure end date includes the full day
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    // Get all orders in date range with customer population
    const orders = await Order.find({
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' }
    }).populate('customerId', 'firstName lastName email phone')
    .sort({ createdAt: 1 });

    // Calculate summary metrics using the same logic as dashboard stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
        // Use the same logic as dashboard stats to get total amount
        let orderTotal = order.total || order.totalAmount || order.payment?.amount;

        // If no total found, calculate from items
        if (!orderTotal && order.items && Array.isArray(order.items)) {
            orderTotal = order.items.reduce((total, item) => {
                if (!item.price || !item.quantity) return total;
                return total + (parseFloat(item.price) * parseInt(item.quantity));
            }, 0);
        }

        const validTotal = parseFloat(orderTotal) || 0;
        console.log(`📊 PDF Sales Report - Order ${order._id}: total = ${validTotal}`);
        return sum + validTotal;
    }, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Count unique customers (registered + unique guest emails)
    const uniqueCustomers = new Set();
    orders.forEach(order => {
        if (order.customerId) {
            uniqueCustomers.add(order.customerId.toString());
        } else if (order.guestInfo?.email) {
            uniqueCustomers.add(`guest_${order.guestInfo.email}`);
        }
    });
    const totalCustomers = uniqueCustomers.size;

    // Calculate totals for summary table
    const totalTax = orders.reduce((sum, order) => {
        if (order.tax !== undefined && order.tax !== null) {
            return sum + order.tax;
        } else {
            const deliveryFee = order.deliveryInfo?.method === 'delivery' ? 5.00 : 0;
            const subtotal = (order.total || 0) - deliveryFee;
            const calculatedTax = subtotal * 0.08;
            return sum + calculatedTax;
        }
    }, 0);

    const totalDeliveryFee = orders.reduce((sum, order) => {
        if (order.deliveryFee !== undefined && order.deliveryFee !== null) {
            return sum + order.deliveryFee;
        } else {
            const deliveryFee = order.deliveryInfo?.method === 'delivery' ? 5.00 : 0;
            return sum + deliveryFee;
        }
    }, 0);

    const totalItems = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0);

    // Get top products with enhanced data structure
    const productStats = {};
    const productColors = {
        'Vanilla Cupcake': '#FFE4B5',
        'Chocolate Cupcake': '#8B4513',
        'Strawberry Cupcake': '#FFB6C1',
        'Red Velvet Cupcake': '#DC143C',
        'Lemon Cupcake': '#FFFF00',
        'Blueberry Cupcake': '#4169E1',
        'Carrot Cupcake': '#FF8C00',
        'Coconut Cupcake': '#F5F5DC',
        'Funfetti Cupcake': '#FF69B4',
        'Peanut Butter Cupcake': '#DEB887'
    };

    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                // Try multiple field names to get product name
                const productName = item.name || item.productName || item.productId || 'Unknown Product';
                const quantity = parseInt(item.quantity) || 1;
                const price = parseFloat(item.price) || 0;
                const revenue = price * quantity;

                if (!productStats[productName]) {
                    productStats[productName] = {
                        name: productName,
                        quantity: 0,
                        revenue: 0,
                        orders: 0,
                        avgPrice: 0,
                        color: productColors[productName] || `#${Math.floor(Math.random()*16777215).toString(16)}`
                    };
                }

                productStats[productName].quantity += quantity;
                productStats[productName].revenue += revenue;
                productStats[productName].orders += 1;
            });
        }
    });

    const topProducts = Object.values(productStats)
        .map(product => ({
            ...product,
            avgPrice: product.quantity > 0 ? Math.round((product.revenue / product.quantity) * 100) / 100 : 0,
            revenue: Math.round(product.revenue * 100) / 100
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    console.log('🏆 Enhanced top products (getSalesReportData):', topProducts.slice(0, 3));

    // Prepare detailed orders
    const detailedOrders = orders.map(order => {
        const orderIdHex = order._id.toString().slice(-8).toUpperCase();

        let customerName = 'Unknown Customer';
        if (order.customerId && typeof order.customerId === 'object') {
            customerName = `${order.customerId.firstName || ''} ${order.customerId.lastName || ''}`.trim();
        } else if (order.guestInfo?.name) {
            customerName = order.guestInfo.name;
        }

        // Use the same total calculation logic as revenue calculation
        let totalAmount = order.total || order.totalAmount || order.payment?.amount;
        if (!totalAmount && order.items && Array.isArray(order.items)) {
            totalAmount = order.items.reduce((total, item) => {
                if (!item.price || !item.quantity) return total;
                return total + (parseFloat(item.price) * parseInt(item.quantity));
            }, 0);
        }
        totalAmount = parseFloat(totalAmount) || 0;
        console.log(`📋 PDF Detailed Order ${order._id.toString().slice(-8).toUpperCase()}: ${order.guestInfo?.name || 'Unknown'}, $${totalAmount.toFixed(2)}`);

        let paymentMethodDisplay = 'N/A';
        const paymentMethod = order.payment?.method;
        if (paymentMethod) {
            switch (paymentMethod) {
                case 'cash':
                    paymentMethodDisplay = 'Cash';
                    break;
                case 'card':
                case 'integrated':
                    paymentMethodDisplay = 'Card';
                    break;
                case 'proof_upload':
                    paymentMethodDisplay = 'Card';
                    break;
                case 'mobile_money':
                    paymentMethodDisplay = 'Card';
                    break;
                default:
                    paymentMethodDisplay = 'Card';
            }
        }

        let orderTax = order.tax;
        let orderDeliveryFee = order.deliveryFee;

        if (orderTax === undefined || orderTax === null) {
            const deliveryFee = order.deliveryInfo?.method === 'delivery' ? 5.00 : 0;
            const subtotal = totalAmount - deliveryFee;
            orderTax = subtotal * 0.08;
        }

        if (orderDeliveryFee === undefined || orderDeliveryFee === null) {
            orderDeliveryFee = order.deliveryInfo?.method === 'delivery' ? 5.00 : 0;
        }

        return {
            orderId: order._id.toString(),
            orderNumber: orderIdHex,
            orderDate: order.createdAt,
            customerName: customerName,
            customerEmail: order.customerId?.email || order.guestInfo?.email || 'N/A',
            customerPhone: order.customerId?.phone || order.guestInfo?.phone || 'N/A',
            customerType: order.customerId ? 'Registered' : 'Guest',
            status: order.status || 'Pending',
            paymentMethod: paymentMethodDisplay,
            deliveryMethod: order.deliveryInfo?.method || 'N/A',
            totalPrice: totalAmount,
            tax: Math.round(orderTax * 100) / 100,
            deliveryFee: Math.round(orderDeliveryFee * 100) / 100,
            itemCount: order.items?.length || 0,
            items: order.items?.map(item => ({
                productName: item.name || item.productId || 'Unknown Product',
                quantity: item.quantity || 0,
                unitPrice: item.price || 0,
                subtotal: (item.quantity || 0) * (item.price || 0)
            })) || []
        };
    });

    return {
        summary: {
            totalOrders,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            totalCustomers,
            totalTax: Math.round(totalTax * 100) / 100,
            totalDeliveryFee: Math.round(totalDeliveryFee * 100) / 100,
            totalItems,
            period: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`
        },
        topProducts,
        detailedOrders
    };
}

async function getInventoryReportData() {
    const inventoryItems = await InventoryItem.find().sort({ name: 1 });

    const lowStockItems = inventoryItems.filter(item =>
        item.quantity <= item.threshold
    );

    const totalValue = inventoryItems.reduce((sum, item) =>
        sum + (item.quantity * (item.costPerUnit || 0)), 0
    );

    return {
        summary: {
            totalItems: inventoryItems.length,
            lowStockItems: lowStockItems.length,
            totalValue: Math.round(totalValue * 100) / 100
        },
        lowStockItems,
        allItems: inventoryItems.map(item => ({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            threshold: item.threshold,
            costPerUnit: item.costPerUnit || 0,
            totalValue: (item.quantity * (item.costPerUnit || 0)),
            status: item.quantity <= item.threshold ? 'Low Stock' : 'In Stock',
            location: item.location || '',
            supplier: item.supplier || ''
        }))
    };
}

async function getCustomerReportData() {
    const customers = await Customer.aggregate([
        {
            $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'customerId',
                as: 'orders'
            }
        },
        {
            $addFields: {
                orderCount: { $size: '$orders' },
                totalSpent: {
                    $sum: {
                        $map: {
                            input: '$orders',
                            as: 'order',
                            in: {
                                $ifNull: [
                                    '$$order.total',
                                    { $ifNull: ['$$order.totalAmount', 0] }
                                ]
                            }
                        }
                    }
                },
                lastOrderDate: {
                    $max: '$orders.createdAt'
                }
            }
        },
        {
            $sort: { totalSpent: -1 }
        }
    ]);

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.orderCount > 0).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

    return {
        summary: {
            totalCustomers,
            activeCustomers,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageSpentPerCustomer: activeCustomers > 0 ? Math.round((totalRevenue / activeCustomers) * 100) / 100 : 0
        },
        customers: customers.map(customer => ({
            name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
            email: customer.email,
            phone: customer.phone || '',
            orderCount: customer.orderCount,
            totalSpent: Math.round(customer.totalSpent * 100) / 100,
            lastOrderDate: customer.lastOrderDate,
            joinDate: customer.createdAt,
            isGuest: customer.isGuest || false
        }))
    };
}

// Get comprehensive sales report
exports.getSalesReport = async (req, res) => {
    try {
        console.log('🔍 DEBUG: Sales report request received');
        console.log('🔍 DEBUG: req.query:', req.query);

        const { startDate, endDate, period = 'daily' } = req.query;

        console.log('🔍 DEBUG: Extracted parameters:', { startDate, endDate, period });

        // Set default date range (last 30 days if not provided)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        console.log('🔍 DEBUG: Date objects created:', { start, end });
        console.log('🔍 DEBUG: Date validation - start valid:', !isNaN(start.getTime()));
        console.log('🔍 DEBUG: Date validation - end valid:', !isNaN(end.getTime()));

        // Ensure end date includes the full day
        end.setHours(23, 59, 59, 999);
        start.setHours(0, 0, 0, 0);

        console.log(`🔍 DEBUG: Final date range: ${start} to ${end}`);
        console.log(`Generating sales report from ${start} to ${end}`);

        // Get all orders in date range with customer population
        console.log('🔍 DEBUG: About to query orders with criteria:', {
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' }
        });

        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end },
            status: { $ne: 'cancelled' }
        }).populate('customerId', 'firstName lastName email phone')
        .sort({ createdAt: 1 });

        console.log('🔍 DEBUG: Orders query completed, found:', orders.length, 'orders');

        // Calculate summary metrics using the same logic as dashboard stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
            // Use the same logic as dashboard stats to get total amount
            let orderTotal = order.total || order.totalAmount || order.payment?.amount;

            // If no total found, calculate from items
            if (!orderTotal && order.items && Array.isArray(order.items)) {
                orderTotal = order.items.reduce((total, item) => {
                    if (!item.price || !item.quantity) return total;
                    return total + (parseFloat(item.price) * parseInt(item.quantity));
                }, 0);
            }

            const validTotal = parseFloat(orderTotal) || 0;
            console.log(`📊 Sales Report - Order ${order._id}: total = ${validTotal}`);
            return sum + validTotal;
        }, 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Count unique customers (registered + unique guest emails)
        const uniqueCustomers = new Set();
        orders.forEach(order => {
            if (order.customerId) {
                uniqueCustomers.add(order.customerId.toString());
            } else if (order.guestInfo?.email) {
                uniqueCustomers.add(`guest_${order.guestInfo.email}`);
            }
        });
        const totalCustomers = uniqueCustomers.size;

        // Group orders by period for charts
        const salesByPeriod = {};
        const ordersByStatus = {};
        const paymentMethodStats = {};
        const deliveryMethodStats = {};

        orders.forEach(order => {
            // Group by period (daily, weekly, monthly)
            let periodKey;
            const orderDate = new Date(order.createdAt);

            if (period === 'daily') {
                periodKey = orderDate.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const weekStart = new Date(orderDate);
                weekStart.setDate(orderDate.getDate() - orderDate.getDay());
                periodKey = weekStart.toISOString().split('T')[0];
            } else if (period === 'monthly') {
                periodKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!salesByPeriod[periodKey]) {
                salesByPeriod[periodKey] = { orders: 0, revenue: 0 };
            }
            salesByPeriod[periodKey].orders += 1;

            // Use the same revenue calculation logic
            let orderTotal = order.total || order.totalAmount || order.payment?.amount;
            if (!orderTotal && order.items && Array.isArray(order.items)) {
                orderTotal = order.items.reduce((total, item) => {
                    if (!item.price || !item.quantity) return total;
                    return total + (parseFloat(item.price) * parseInt(item.quantity));
                }, 0);
            }
            salesByPeriod[periodKey].revenue += parseFloat(orderTotal) || 0;

            // Group by status
            const status = order.status || 'pending';
            ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;

            // Group by payment method
            const paymentMethod = order.paymentMethod || 'unknown';
            paymentMethodStats[paymentMethod] = (paymentMethodStats[paymentMethod] || 0) + 1;

            // Group by delivery method
            const deliveryMethod = order.deliveryInfo?.method || 'pickup';
            deliveryMethodStats[deliveryMethod] = (deliveryMethodStats[deliveryMethod] || 0) + 1;
        });

        // Get top products with Product collection lookup for accurate names
        const productColors = {
            'Vanilla Cupcake': '#FFE4B5',
            'Chocolate Cupcake': '#8B4513',
            'Strawberry Cupcake': '#FFB6C1',
            'Red Velvet Cupcake': '#DC143C',
            'Lemon Cupcake': '#FFFF00',
            'Blueberry Cupcake': '#4169E1',
            'Carrot Cupcake': '#FF8C00',
            'Coconut Cupcake': '#F5F5DC',
            'Funfetti Cupcake': '#FF69B4',
            'Peanut Butter Cupcake': '#DEB887'
        };

        // Use aggregation to get product names from Product collection
        const topProductsAggregation = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            {
                $addFields: {
                    'items.productObjectId': {
                        $cond: {
                            if: { $ne: ['$items.productId', null] },
                            then: {
                                $cond: {
                                    if: { $eq: [{ $type: '$items.productId' }, 'objectId'] },
                                    then: '$items.productId',
                                    else: {
                                        $cond: {
                                            if: { $regexMatch: { input: '$items.productId', regex: /^[0-9a-fA-F]{24}$/ } },
                                            then: { $toObjectId: '$items.productId' },
                                            else: null
                                        }
                                    }
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productObjectId',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            {
                $group: {
                    _id: '$items.productId',
                    productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
                    quantity: { $sum: { $ifNull: ['$items.quantity', 1] } },
                    revenue: {
                        $sum: {
                            $multiply: [
                                { $ifNull: ['$items.price', 0] },
                                { $ifNull: ['$items.quantity', 1] }
                            ]
                        }
                    },
                    orders: { $sum: 1 },
                    avgPrice: {
                        $avg: {
                            $multiply: [
                                { $ifNull: ['$items.price', 0] },
                                { $ifNull: ['$items.quantity', 1] }
                            ]
                        }
                    }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);

        // Convert aggregation results to the expected format
        const topProducts = topProductsAggregation.map(product => {
            // Improved product name resolution logic
            let productName = 'Unknown Product';

            if (product.productName) {
                productName = product.productName;
            } else if (product._id) {
                // If productId is a slug, make it more readable
                if (typeof product._id === 'string' && product._id.includes('-')) {
                    productName = product._id
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                } else {
                    productName = `Product: ${product._id}`;
                }
            }

            return {
                name: productName,
                quantity: product.quantity,
                revenue: Math.round(product.revenue * 100) / 100,
                orders: product.orders,
                avgPrice: Math.round(product.avgPrice * 100) / 100,
                color: productColors[productName] || `#${Math.floor(Math.random()*16777215).toString(16)}`
            };
        });

        console.log('🏆 Enhanced top products for reports with Product lookup:', topProducts.slice(0, 3));

        // Prepare chart data
        const chartData = {
            salesTrend: Object.keys(salesByPeriod).sort().map(period => ({
                period,
                orders: salesByPeriod[period].orders,
                revenue: salesByPeriod[period].revenue
            })),
            ordersByStatus: Object.keys(ordersByStatus).map(status => ({
                status,
                count: ordersByStatus[status]
            })),
            paymentMethods: Object.keys(paymentMethodStats).map(method => ({
                method,
                count: paymentMethodStats[method]
            })),
            deliveryMethods: Object.keys(deliveryMethodStats).map(method => ({
                method,
                count: deliveryMethodStats[method]
            })),
            topProducts: topProducts.slice(0, 5)
        };

        // Calculate totals for summary table
        // For orders without tax/deliveryFee fields, calculate them based on business rules
        const totalTax = orders.reduce((sum, order) => {
            if (order.tax !== undefined && order.tax !== null) {
                return sum + order.tax;
            } else {
                // Calculate tax as 8% of subtotal (total - delivery fee)
                const deliveryFee = order.deliveryInfo?.method === 'delivery' ? 5.00 : 0;
                const subtotal = (order.total || 0) - deliveryFee;
                const calculatedTax = subtotal * 0.08;
                return sum + calculatedTax;
            }
        }, 0);

        const totalDeliveryFee = orders.reduce((sum, order) => {
            if (order.deliveryFee !== undefined && order.deliveryFee !== null) {
                return sum + order.deliveryFee;
            } else {
                // Calculate delivery fee based on delivery method
                const deliveryFee = order.deliveryInfo?.method === 'delivery' ? 5.00 : 0;
                return sum + deliveryFee;
            }
        }, 0);

        const totalItems = orders.reduce((sum, order) => sum + (order.items?.length || 0), 0);

        console.log('🔍 DEBUG: Calculated totals for sales report:');
        console.log(`📊 Total Tax: $${Math.round(totalTax * 100) / 100}`);
        console.log(`📊 Total Delivery Fee: $${Math.round(totalDeliveryFee * 100) / 100}`);
        console.log(`📊 Total Revenue: $${Math.round(totalRevenue * 100) / 100}`);
        console.log(`📊 Total Orders: ${totalOrders}`);
        console.log(`📊 Total Customers: ${totalCustomers}`);
        console.log(`📊 Average Order Value: $${Math.round(averageOrderValue * 100) / 100}`);

        const report = {
            summary: {
                totalOrders,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                totalCustomers,
                totalTax: Math.round(totalTax * 100) / 100,
                totalDeliveryFee: Math.round(totalDeliveryFee * 100) / 100,
                totalItems,
                period: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`
            },
            chartData,
            topProducts,
            detailedOrders: orders.map(order => {
                // Use MongoDB ObjectId hex format (like 98B15AAC) instead of ORD- prefix
                const orderIdHex = order._id.toString().slice(-8).toUpperCase();

                // Get customer name properly
                let customerName = 'Unknown Customer';
                if (order.customerId && typeof order.customerId === 'object') {
                    // Populated customer data
                    customerName = `${order.customerId.firstName || ''} ${order.customerId.lastName || ''}`.trim();
                } else if (order.guestInfo?.name) {
                    // Guest customer data
                    customerName = order.guestInfo.name;
                }

                // Get proper total amount using the same logic as revenue calculation
                let totalAmount = order.total || order.totalAmount || order.payment?.amount;

                // If no total found, calculate from items
                if (!totalAmount && order.items && Array.isArray(order.items)) {
                    totalAmount = order.items.reduce((total, item) => {
                        if (!item.price || !item.quantity) return total;
                        return total + (parseFloat(item.price) * parseInt(item.quantity));
                    }, 0);
                }

                totalAmount = parseFloat(totalAmount) || 0;
                console.log(`📋 Detailed Order ${order._id.toString().slice(-8).toUpperCase()}: ${order.guestInfo?.name || 'Unknown'}, $${totalAmount.toFixed(2)}`);

                // Map payment method to display format
                let paymentMethodDisplay = 'N/A';
                const paymentMethod = order.payment?.method;
                if (paymentMethod) {
                    switch (paymentMethod) {
                        case 'cash':
                            paymentMethodDisplay = 'Cash';
                            break;
                        case 'card':
                        case 'integrated':
                            paymentMethodDisplay = 'Card';
                            break;
                        case 'proof_upload':
                            paymentMethodDisplay = 'Card'; // Assume card for proof uploads
                            break;
                        case 'mobile_money':
                            paymentMethodDisplay = 'Card';
                            break;
                        default:
                            paymentMethodDisplay = 'Card';
                    }
                }

                // Calculate tax and delivery fee if missing
                let orderTax = order.tax;
                let orderDeliveryFee = order.deliveryFee;

                if (orderTax === undefined || orderTax === null) {
                    // Calculate tax as 8% of subtotal (total - delivery fee)
                    const deliveryFee = order.deliveryInfo?.method === 'delivery' ? 5.00 : 0;
                    const subtotal = totalAmount - deliveryFee;
                    orderTax = subtotal * 0.08;
                }

                if (orderDeliveryFee === undefined || orderDeliveryFee === null) {
                    // Calculate delivery fee based on delivery method
                    orderDeliveryFee = order.deliveryInfo?.method === 'delivery' ? 5.00 : 0;
                }

                return {
                    orderId: order._id.toString(),
                    orderNumber: orderIdHex, // Use hex format like 98B15AAC
                    orderDate: order.createdAt,
                    customerName: customerName,
                    customerEmail: order.customerId?.email || order.guestInfo?.email || 'N/A',
                    customerPhone: order.customerId?.phone || order.guestInfo?.phone || 'N/A',
                    customerType: order.customerId ? 'Registered' : 'Guest',
                    status: order.status || 'Pending',
                    paymentMethod: paymentMethodDisplay,
                    deliveryMethod: order.deliveryInfo?.method || 'N/A',
                    totalPrice: totalAmount,
                    tax: Math.round(orderTax * 100) / 100,
                    deliveryFee: Math.round(orderDeliveryFee * 100) / 100,
                    itemCount: order.items?.length || 0,
                    items: order.items?.map(item => {
                        // Improved product name resolution for detailed orders
                        let productName = 'Unknown Product';
                        if (item.name && item.name !== 'Unknown Product') {
                            productName = item.name;
                        } else if (item.productName) {
                            productName = item.productName;
                        } else if (item.productId) {
                            // If productId is a slug, make it more readable
                            if (typeof item.productId === 'string' && item.productId.includes('-')) {
                                productName = item.productId
                                    .split('-')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');
                            } else {
                                productName = `Product: ${item.productId}`;
                            }
                        }

                        return {
                            productName: productName,
                            quantity: item.quantity || 0,
                            unitPrice: item.price || 0,
                            subtotal: (item.quantity || 0) * (item.price || 0)
                        };
                    }) || []
                };
            })
        };

        console.log('🔍 DEBUG: Final report summary being sent to frontend:');
        console.log(`📊 Summary Total Revenue: $${report.summary.totalRevenue}`);
        console.log(`📊 Summary Total Tax: $${report.summary.totalTax}`);
        console.log(`📊 Summary Total Delivery Fee: $${report.summary.totalDeliveryFee}`);
        console.log(`📊 Summary Total Orders: ${report.summary.totalOrders}`);
        console.log(`📊 Summary Avg Order Value: $${report.summary.averageOrderValue}`);

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating sales report'
        });
    }
};

// Get enhanced inventory report
exports.getInventoryReport = async (req, res) => {
    try {
        const { category, status, sortBy, orderBy, limit } = req.query;

        // Build query filter
        let queryFilter = {};
        if (category && category !== 'all') {
            queryFilter.category = category;
        }

        const inventoryItems = await InventoryItem.find(queryFilter).sort({ name: 1 });

        // Apply status filter
        let filteredItems = inventoryItems;
        if (status && status !== 'all') {
            filteredItems = inventoryItems.filter(item => {
                if (status === 'out-of-stock') return item.quantity === 0;
                if (status === 'low-stock') return item.quantity > 0 && item.quantity <= item.threshold;
                if (status === 'in-stock') return item.quantity > item.threshold;
                return true;
            });
        }

        // Apply sorting
        if (sortBy) {
            const order = orderBy === 'desc' ? -1 : 1;
            filteredItems.sort((a, b) => {
                if (sortBy === 'name') return order * a.name.localeCompare(b.name);
                if (sortBy === 'quantity') return order * (a.quantity - b.quantity);
                if (sortBy === 'value') return order * ((a.quantity * (a.costPerUnit || 0)) - (b.quantity * (b.costPerUnit || 0)));
                if (sortBy === 'category') return order * (a.category || '').localeCompare(b.category || '');
                return 0;
            });
        }

        // Apply limit
        if (limit) {
            filteredItems = filteredItems.slice(0, parseInt(limit));
        }

        // Calculate enhanced statistics
        const totalItems = inventoryItems.length;
        const lowStockItems = inventoryItems.filter(item => item.quantity > 0 && item.quantity <= item.threshold).length;
        const outOfStockItems = inventoryItems.filter(item => item.quantity === 0).length;
        const inStockItems = inventoryItems.filter(item => item.quantity > item.threshold).length;
        const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * (item.costPerUnit || 0)), 0);
        const averageValue = totalItems > 0 ? totalValue / totalItems : 0;

        // Category breakdown
        const categories = {};
        inventoryItems.forEach(item => {
            const cat = item.category || 'Uncategorized';
            if (!categories[cat]) {
                categories[cat] = { count: 0, value: 0, lowStock: 0, outOfStock: 0 };
            }
            categories[cat].count++;
            categories[cat].value += item.quantity * (item.costPerUnit || 0);
            if (item.quantity === 0) categories[cat].outOfStock++;
            else if (item.quantity <= item.threshold) categories[cat].lowStock++;
        });

        // Top value items
        const topValueItems = inventoryItems
            .map(item => ({
                name: item.name,
                category: item.category,
                value: item.quantity * (item.costPerUnit || 0),
                quantity: item.quantity
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Items needing restock
        const restockNeeded = inventoryItems
            .filter(item => item.quantity <= item.threshold)
            .map(item => ({
                name: item.name,
                category: item.category,
                currentQuantity: item.quantity,
                threshold: item.threshold,
                deficit: Math.max(0, item.threshold - item.quantity),
                estimatedCost: Math.max(0, item.threshold - item.quantity) * (item.costPerUnit || 0),
                supplier: item.supplier,
                priority: item.quantity === 0 ? 'Critical' : 'Low'
            }))
            .sort((a, b) => {
                if (a.priority === 'Critical' && b.priority !== 'Critical') return -1;
                if (b.priority === 'Critical' && a.priority !== 'Critical') return 1;
                return b.estimatedCost - a.estimatedCost;
            });

        // Usage trends (if history is available)
        const usageTrends = inventoryItems.map(item => {
            const recentHistory = (item.history || [])
                .filter(h => h.action === 'deduct' && h.date >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            const totalUsed = recentHistory.reduce((sum, h) => sum + Math.abs(h.changeAmount || 0), 0);
            const avgDailyUsage = totalUsed / 30;

            return {
                name: item.name,
                totalUsed30Days: totalUsed,
                avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
                daysUntilEmpty: avgDailyUsage > 0 ? Math.floor(item.quantity / avgDailyUsage) : null,
                trend: recentHistory.length > 1 ? 'Declining' : 'Stable'
            };
        }).filter(item => item.totalUsed30Days > 0);

        const report = {
            summary: {
                totalItems,
                inStockItems,
                lowStockItems,
                outOfStockItems,
                totalValue: Math.round(totalValue * 100) / 100,
                averageValue: Math.round(averageValue * 100) / 100,
                restockNeededCount: restockNeeded.length,
                totalRestockCost: Math.round(restockNeeded.reduce((sum, item) => sum + item.estimatedCost, 0) * 100) / 100
            },
            items: filteredItems.map(item => ({
                _id: item._id,
                name: item.name,
                category: item.category || 'Uncategorized',
                quantity: item.quantity,
                unit: item.unit,
                threshold: item.threshold,
                costPerUnit: item.costPerUnit || 0,
                totalValue: Math.round((item.quantity * (item.costPerUnit || 0)) * 100) / 100,
                status: item.quantity === 0 ? 'Out of Stock' :
                        item.quantity <= item.threshold ? 'Low Stock' : 'In Stock',
                lastRestocked: item.lastRestocked,
                supplier: item.supplier,
                location: item.location,
                daysUntilEmpty: usageTrends.find(t => t.name === item.name)?.daysUntilEmpty
            })),
            categories,
            topValueItems,
            restockNeeded,
            usageTrends: usageTrends.slice(0, 20),
            analytics: {
                stockHealthScore: Math.round(((inStockItems / totalItems) * 100) * 100) / 100,
                turnoverRate: usageTrends.length > 0 ?
                    Math.round((usageTrends.reduce((sum, t) => sum + t.avgDailyUsage, 0) / usageTrends.length) * 100) / 100 : 0,
                criticalItemsCount: outOfStockItems + lowStockItems
            }
        };

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating inventory report'
        });
    }
};

// Get enhanced customer report
exports.getCustomerReport = async (req, res) => {
    try {
        const { startDate, endDate, segment, sortBy, orderBy, limit } = req.query;

        // Build date filter for customer registration
        let customerDateFilter = {};
        if (startDate && endDate) {
            customerDateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Enhanced aggregation pipeline
        const customers = await Customer.aggregate([
            { $match: customerDateFilter },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'customerId',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    orderCount: { $size: '$orders' },
                    totalSpent: {
                        $sum: {
                            $map: {
                                input: '$orders',
                                as: 'order',
                                in: {
                                    $ifNull: [
                                        '$$order.total',
                                        { $ifNull: ['$$order.totalAmount', 0] }
                                    ]
                                }
                            }
                        }
                    },
                    lastOrderDate: { $max: '$orders.createdAt' },
                    firstOrderDate: { $min: '$orders.createdAt' },
                    avgOrderValue: {
                        $cond: {
                            if: { $gt: [{ $size: '$orders' }, 0] },
                            then: {
                                $divide: [
                                    {
                                        $sum: {
                                            $map: {
                                                input: '$orders',
                                                as: 'order',
                                                in: {
                                                    $ifNull: [
                                                        '$$order.total',
                                                        { $ifNull: ['$$order.totalAmount', 0] }
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    { $size: '$orders' }
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },
            {
                $addFields: {
                    daysSinceJoin: {
                        $divide: [
                            { $subtract: [new Date(), '$createdAt'] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    daysSinceLastOrder: {
                        $cond: {
                            if: '$lastOrderDate',
                            then: {
                                $divide: [
                                    { $subtract: [new Date(), '$lastOrderDate'] },
                                    1000 * 60 * 60 * 24
                                ]
                            },
                            else: null
                        }
                    },
                    orderFrequency: {
                        $cond: {
                            if: { $gt: ['$daysSinceJoin', 0] },
                            then: {
                                $divide: [
                                    { $multiply: ['$orderCount', 30] },
                                    '$daysSinceJoin'
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },
            {
                $addFields: {
                    segment: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$orderCount', 0] }, then: 'Inactive' },
                                { case: { $gt: ['$totalSpent', 500] }, then: 'VIP' },
                                { case: { $gt: ['$orderCount', 5] }, then: 'Loyal' },
                                { case: { $gt: ['$orderCount', 1] }, then: 'Regular' }
                            ],
                            default: 'New'
                        }
                    },
                    status: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$daysSinceLastOrder', null] }, then: 'Never Ordered' },
                                { case: { $gt: ['$daysSinceLastOrder', 90] }, then: 'Inactive' },
                                { case: { $gt: ['$daysSinceLastOrder', 30] }, then: 'At Risk' }
                            ],
                            default: 'Active'
                        }
                    }
                }
            },
            {
                $sort: { totalSpent: -1 }
            }
        ]);

        // Apply segment filter if specified
        let filteredCustomers = customers;
        if (segment && segment !== 'all') {
            filteredCustomers = customers.filter(c => c.segment.toLowerCase() === segment.toLowerCase());
        }

        // Apply sorting
        if (sortBy) {
            const order = orderBy === 'desc' ? -1 : 1;
            filteredCustomers.sort((a, b) => {
                if (sortBy === 'name') return order * (`${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
                if (sortBy === 'totalSpent') return order * (a.totalSpent - b.totalSpent);
                if (sortBy === 'orderCount') return order * (a.orderCount - b.orderCount);
                if (sortBy === 'lastOrder') return order * (new Date(a.lastOrderDate) - new Date(b.lastOrderDate));
                return 0;
            });
        }

        // Apply limit if specified
        if (limit) {
            filteredCustomers = filteredCustomers.slice(0, parseInt(limit));
        }

        // Calculate enhanced summary statistics
        const totalCustomers = customers.length;
        const activeCustomers = customers.filter(c => c.status === 'Active').length;
        const atRiskCustomers = customers.filter(c => c.status === 'At Risk').length;
        const inactiveCustomers = customers.filter(c => c.status === 'Inactive').length;
        const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
        const averageSpentPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
        const averageOrderValue = customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / totalCustomers;

        // Customer segmentation
        const segments = {
            vip: customers.filter(c => c.segment === 'VIP').length,
            loyal: customers.filter(c => c.segment === 'Loyal').length,
            regular: customers.filter(c => c.segment === 'Regular').length,
            new: customers.filter(c => c.segment === 'New').length,
            inactive: customers.filter(c => c.segment === 'Inactive').length
        };

        // Top customers
        const topCustomers = customers
            .filter(c => c.totalSpent > 0)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)
            .map(customer => ({
                name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
                email: customer.email,
                totalSpent: Math.round(customer.totalSpent * 100) / 100,
                orderCount: customer.orderCount
            }));

        // Monthly customer acquisition
        const monthlyAcquisition = {};
        customers.forEach(customer => {
            const month = new Date(customer.createdAt).toISOString().slice(0, 7);
            monthlyAcquisition[month] = (monthlyAcquisition[month] || 0) + 1;
        });

        const report = {
            summary: {
                totalCustomers,
                activeCustomers,
                atRiskCustomers,
                inactiveCustomers,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                averageSpentPerCustomer: Math.round(averageSpentPerCustomer * 100) / 100,
                averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                guestCustomers: customers.filter(c => c.isGuest).length,
                registeredCustomers: customers.filter(c => !c.isGuest).length,
                segments
            },
            customers: filteredCustomers.map(customer => ({
                _id: customer._id,
                name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
                email: customer.email,
                phone: customer.phone || '',
                orderCount: customer.orderCount,
                totalSpent: Math.round(customer.totalSpent * 100) / 100,
                avgOrderValue: Math.round(customer.avgOrderValue * 100) / 100,
                lastOrderDate: customer.lastOrderDate,
                daysSinceLastOrder: customer.daysSinceLastOrder ? Math.floor(customer.daysSinceLastOrder) : null,
                joinDate: customer.createdAt,
                daysSinceJoin: Math.floor(customer.daysSinceJoin),
                orderFrequency: Math.round(customer.orderFrequency * 100) / 100,
                isGuest: customer.isGuest || false,
                segment: customer.segment,
                status: customer.status
            })),
            topCustomers,
            monthlyAcquisition,
            analytics: {
                retentionRate: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100 * 100) / 100 : 0,
                churnRate: totalCustomers > 0 ? Math.round((inactiveCustomers / totalCustomers) * 100 * 100) / 100 : 0,
                avgCustomerLifespan: customers.reduce((sum, c) => sum + c.daysSinceJoin, 0) / totalCustomers
            },
            period: { startDate, endDate }
        };

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating customer report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating customer report'
        });
    }
};

// Export report data for Excel/PDF
exports.exportReport = async (req, res) => {
    try {
        const { type, format, startDate, endDate } = req.query;

        let reportData;

        // Get the appropriate report data based on type
        switch (type) {
            case 'sales':
                // Call the sales report function directly and capture the data
                try {
                    const salesData = await getSalesReportData(startDate, endDate);
                    reportData = { success: true, data: salesData };
                } catch (error) {
                    console.error('Error getting sales report data:', error);
                    throw error;
                }
                break;

            case 'inventory':
                try {
                    const inventoryData = await getInventoryReportData();
                    reportData = { success: true, data: inventoryData };
                } catch (error) {
                    console.error('Error getting inventory report data:', error);
                    throw error;
                }
                break;

            case 'customers':
                try {
                    const customerData = await getCustomerReportData();
                    reportData = { success: true, data: customerData };
                } catch (error) {
                    console.error('Error getting customer report data:', error);
                    throw error;
                }
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type'
                });
        }

        if (!reportData || !reportData.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate report data'
            });
        }

        // Return the data as JSON with proper headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${new Date().toISOString().split('T')[0]}.json"`);

        res.status(200).json({
            success: true,
            data: reportData.data,
            exportInfo: {
                type,
                format,
                generatedAt: new Date().toISOString(),
                note: 'Report data exported successfully'
            }
        });
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting report: ' + error.message
        });
    }
};

// Legacy function for backward compatibility
exports.generateSalesReport = exports.getSalesReport;
exports.generateDeliveryReport = async (req, res) => {
    try {
        const { date } = req.query;
        const reportDate = date ? new Date(date) : new Date();

        const orders = await Order.find({
            'deliveryInfo.deliveryDate': {
                $gte: new Date(reportDate.setHours(0, 0, 0, 0)),
                $lte: new Date(reportDate.setHours(23, 59, 59, 999))
            },
            'deliveryInfo.method': 'delivery'
        });

        const deliverySchedule = orders.map(order => ({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerName: order.guestInfo?.name || order.customer?.firstName + ' ' + order.customer?.lastName || 'N/A',
            address: order.deliveryInfo?.address || {},
            deliveryTime: order.deliveryInfo?.deliveryTime || 'TBD',
            items: order.items.length,
            total: order.totalAmount || 0
        }));

        const report = {
            date: reportDate.toDateString(),
            totalDeliveries: orders.length,
            deliverySchedule
        };

        res.status(200).json(report);
    } catch (error) {
        console.error('Error generating delivery report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating delivery report'
        });
    }
};
exports.generatePopularItemsReport = async (req, res) => {
    // This is now included in the main sales report
    try {
        await this.getSalesReport(req, res);
    } catch (error) {
        console.error('Error generating popular items report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating popular items report'
        });
    }
};

// Export report as PDF
exports.exportReportPDF = async (req, res) => {
    try {
        console.log('🔍 PDF Export Request:', { type: req.query.type, startDate: req.query.startDate, endDate: req.query.endDate });

        const { type, startDate, endDate, format = 'pdf' } = req.query;

        // Get report data based on type
        let reportData;
        switch (type) {
            case 'sales':
                try {
                    console.log('📊 Fetching sales data for PDF with params:', { startDate, endDate });
                    console.log('📊 About to call getSalesReportData function...');
                    const salesData = await getSalesReportData(startDate, endDate);
                    console.log('📊 getSalesReportData returned:', {
                        hasSummary: !!salesData.summary,
                        hasDetailedOrders: !!salesData.detailedOrders,
                        summaryKeys: salesData.summary ? Object.keys(salesData.summary) : [],
                        totalRevenue: salesData.summary?.totalRevenue,
                        totalOrders: salesData.summary?.totalOrders
                    });
                    reportData = { success: true, data: salesData };
                    console.log('✅ Sales data fetched successfully for PDF:', {
                        totalOrders: salesData.summary?.totalOrders,
                        totalRevenue: salesData.summary?.totalRevenue,
                        detailedOrdersCount: salesData.detailedOrders?.length
                    });
                } catch (error) {
                    console.error('❌ Error getting sales report data for PDF:', error);
                    throw error;
                }
                break;
            case 'inventory':
                try {
                    console.log('📦 Fetching inventory data for PDF...');
                    const inventoryData = await getInventoryReportData();
                    reportData = { success: true, data: inventoryData };
                    console.log('✅ Inventory data fetched successfully for PDF');
                } catch (error) {
                    console.error('❌ Error getting inventory report data for PDF:', error);
                    throw error;
                }
                break;
            case 'customers':
                try {
                    console.log('👥 Fetching customer data for PDF...');
                    const customerData = await getCustomerReportData();
                    reportData = { success: true, data: customerData };
                    console.log('✅ Customer data fetched successfully for PDF');
                } catch (error) {
                    console.error('❌ Error getting customer report data for PDF:', error);
                    throw error;
                }
                break;
            default:
                console.error('❌ Invalid report type for PDF:', type);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type'
                });
        }

        if (!reportData || !reportData.success) {
            console.error('❌ Failed to generate report data for PDF');
            return res.status(500).json({
                success: false,
                message: 'Failed to generate report data'
            });
        }

        console.log('📄 Creating PDF document...');

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="SarahsShortCakes_${type}_Report_${new Date().toISOString().split('T')[0]}.pdf"`);

        // Pipe PDF to response
        doc.pipe(res);

        console.log('📄 Adding PDF header...');

        // Add header
        doc.fontSize(20).text("Sarah's Short Cakes", 50, 50);
        doc.fontSize(16).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 50, 80);
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 110);

        if (startDate && endDate) {
            doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 50, 130);
        }

        // Add content based on report type
        let yPosition = 160;

        console.log('📄 Adding report content for type:', type);

        if (type === 'sales' && reportData.data) {
            const data = reportData.data;
            console.log('📊 Processing sales report PDF with data:', {
                hasDetailedOrders: !!data.detailedOrders,
                detailedOrdersCount: data.detailedOrders?.length,
                hasSummary: !!data.summary,
                totalRevenue: data.summary?.totalRevenue
            });

            // Skip summary and top products sections for PDF
            // Go directly to Detailed Orders Table
            if (data.detailedOrders && data.detailedOrders.length > 0) {
                console.log('📊 Adding detailed orders table to PDF...');
                doc.fontSize(14).text('Detailed Orders', 50, yPosition);
                yPosition += 30;

                // Table configuration
                const tableTop = yPosition;
                const tableLeft = 50;
                const columnWidths = [90, 100, 80, 70, 60, 80, 70]; // Order Number, Customer, Date, Total, Status, Payment, Delivery
                const rowHeight = 20;
                const headerHeight = 25;

                // Draw table header background
                doc.rect(tableLeft, tableTop, columnWidths.reduce((a, b) => a + b, 0), headerHeight)
                   .fillAndStroke('#f0f0f0', '#000000');

                // Table headers
                doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
                let currentX = tableLeft;
                const headers = ['Order Number', 'Customer', 'Date', 'Total', 'Status', 'Payment', 'Delivery'];

                headers.forEach((header, index) => {
                    doc.text(header, currentX + 5, tableTop + 8, { width: columnWidths[index] - 10, align: 'left' });
                    currentX += columnWidths[index];
                });

                yPosition = tableTop + headerHeight;

                // Table data
                doc.font('Helvetica').fontSize(8);
                console.log('📊 Processing all', data.detailedOrders.length, 'orders for PDF (no limit)');
                data.detailedOrders.forEach((order, rowIndex) => {
                    if (yPosition > 700) { // Add new page if needed
                        doc.addPage();
                        yPosition = 50;

                        // Redraw headers on new page
                        doc.rect(tableLeft, yPosition, columnWidths.reduce((a, b) => a + b, 0), headerHeight)
                           .fillAndStroke('#f0f0f0', '#000000');

                        doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
                        currentX = tableLeft;
                        headers.forEach((header, index) => {
                            doc.text(header, currentX + 5, yPosition + 8, { width: columnWidths[index] - 10, align: 'left' });
                            currentX += columnWidths[index];
                        });
                        yPosition += headerHeight;
                        doc.font('Helvetica').fontSize(8);
                    }

                    // Alternate row colors
                    const rowColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
                    doc.rect(tableLeft, yPosition, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
                       .fillAndStroke(rowColor, '#cccccc');

                    // Row data
                    const orderDate = new Date(order.orderDate).toLocaleDateString();
                    const orderNumber = order.orderNumber; // Already in hex format like 98B15AAC

                    const rowData = [
                        orderNumber,
                        (order.customerName || 'Guest').substring(0, 15),
                        orderDate,
                        `$${(order.totalPrice || 0).toFixed(2)}`,
                        order.status || 'Pending',
                        (order.paymentMethod || 'N/A').substring(0, 10),
                        (order.deliveryMethod || 'N/A').substring(0, 10)
                    ];

                    doc.fillColor('#000000');
                    currentX = tableLeft;
                    rowData.forEach((data, index) => {
                        doc.text(data, currentX + 5, yPosition + 6, {
                            width: columnWidths[index] - 10,
                            align: index === 3 ? 'right' : 'left' // Right align total amount
                        });
                        currentX += columnWidths[index];
                    });

                    yPosition += rowHeight;
                });

                // Add totals summary table at the end
                yPosition += 30;

                // Check if we need a new page for the totals table
                if (yPosition > 650) {
                    doc.addPage();
                    yPosition = 50;
                }

                // Totals Summary Section
                console.log('📊 Adding totals summary to PDF with data:', {
                    totalRevenue: data.summary?.totalRevenue,
                    totalOrders: data.summary?.totalOrders,
                    totalItems: data.summary?.totalItems,
                    totalTax: data.summary?.totalTax,
                    totalDeliveryFee: data.summary?.totalDeliveryFee
                });

                doc.fontSize(14).text('Report Totals Summary', 50, yPosition);
                yPosition += 30;

                // Create totals table
                const totalsData = [
                    ['Metric', 'Value'],
                    ['Total Revenue', `$${(data.summary?.totalRevenue || 0).toFixed(2)}`],
                    ['Total Orders', (data.summary?.totalOrders || 0).toString()],
                    ['Total Items', (data.summary?.totalItems || 0).toString()],
                    ['Total Tax Paid', `$${(data.summary?.totalTax || 0).toFixed(2)}`],
                    ['Total Delivery Paid', `$${(data.summary?.totalDeliveryFee || 0).toFixed(2)}`]
                ];

                console.log('📊 Totals table data for PDF:', totalsData);

                // Draw totals table
                const totalsTableStartY = yPosition;
                const totalsColWidths = [200, 150];
                let totalsCurrentY = totalsTableStartY;

                totalsData.forEach((row, rowIndex) => {
                    let currentX = 50;

                    row.forEach((cell, colIndex) => {
                        // Header row styling
                        if (rowIndex === 0) {
                            doc.fontSize(10).fillColor('#000000');
                            doc.rect(currentX, totalsCurrentY, totalsColWidths[colIndex], 20)
                               .fillAndStroke('#f0f0f0', '#000000');
                            doc.fillColor('#000000').text(cell, currentX + 5, totalsCurrentY + 5, {
                                width: totalsColWidths[colIndex] - 10,
                                align: 'left'
                            });
                        } else {
                            // Data row styling
                            doc.fontSize(10).fillColor('#000000');
                            doc.rect(currentX, totalsCurrentY, totalsColWidths[colIndex], 20)
                               .stroke('#000000');

                            const align = colIndex === 1 ? 'right' : 'left';
                            doc.text(cell, currentX + 5, totalsCurrentY + 5, {
                                width: totalsColWidths[colIndex] - 10,
                                align: align
                            });
                        }

                        currentX += totalsColWidths[colIndex];
                    });

                    totalsCurrentY += 20;
                });

                yPosition += 20; // Add space after table
            }
        } else if (type === 'inventory' && reportData.data) {
            const data = reportData.data;

            // Summary section
            doc.fontSize(14).text('Inventory Summary', 50, yPosition);
            yPosition += 30;

            doc.fontSize(10);
            doc.text(`Total Items: ${data.summary?.totalItems || 0}`, 50, yPosition);
            doc.text(`Low Stock Items: ${data.summary?.lowStockItems || 0}`, 200, yPosition);
            doc.text(`Total Value: $${(data.summary?.totalValue || 0).toFixed(2)}`, 350, yPosition);
            yPosition += 40;

            // Low stock items
            if (data.lowStockItems && data.lowStockItems.length > 0) {
                doc.fontSize(14).text('Low Stock Items', 50, yPosition);
                yPosition += 30;

                // Table configuration
                const tableTop = yPosition;
                const tableLeft = 50;
                const columnWidths = [150, 80, 80, 80, 100]; // Item, Quantity, Threshold, Status, Value
                const rowHeight = 18;
                const headerHeight = 22;

                // Draw table header background
                doc.rect(tableLeft, tableTop, columnWidths.reduce((a, b) => a + b, 0), headerHeight)
                   .fillAndStroke('#f0f0f0', '#000000');

                // Table headers
                doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
                let currentX = tableLeft;
                const headers = ['Item Name', 'Quantity', 'Threshold', 'Status', 'Total Value'];

                headers.forEach((header, index) => {
                    doc.text(header, currentX + 5, tableTop + 6, { width: columnWidths[index] - 10, align: 'left' });
                    currentX += columnWidths[index];
                });

                yPosition = tableTop + headerHeight;

                // Table data
                doc.font('Helvetica').fontSize(8);
                data.lowStockItems.slice(0, 20).forEach((item, rowIndex) => {
                    if (yPosition > 700) { // Add new page if needed
                        doc.addPage();
                        yPosition = 50;

                        // Redraw headers on new page
                        doc.rect(tableLeft, yPosition, columnWidths.reduce((a, b) => a + b, 0), headerHeight)
                           .fillAndStroke('#f0f0f0', '#000000');

                        doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
                        currentX = tableLeft;
                        headers.forEach((header, index) => {
                            doc.text(header, currentX + 5, yPosition + 6, { width: columnWidths[index] - 10, align: 'left' });
                            currentX += columnWidths[index];
                        });
                        yPosition += headerHeight;
                        doc.font('Helvetica').fontSize(8);
                    }

                    // Alternate row colors
                    const rowColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
                    doc.rect(tableLeft, yPosition, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
                       .fillAndStroke(rowColor, '#cccccc');

                    // Row data
                    const rowData = [
                        (item.name || 'Unknown').substring(0, 20),
                        (item.quantity || 0).toString(),
                        (item.threshold || 0).toString(),
                        item.status || 'Unknown',
                        `$${((item.quantity || 0) * (item.costPerUnit || 0)).toFixed(2)}`
                    ];

                    doc.fillColor('#000000');
                    currentX = tableLeft;
                    rowData.forEach((data, index) => {
                        const align = (index === 1 || index === 2 || index === 4) ? 'right' : 'left';
                        doc.text(data, currentX + 5, yPosition + 4, {
                            width: columnWidths[index] - 10,
                            align: align
                        });
                        currentX += columnWidths[index];
                    });

                    yPosition += rowHeight;
                });

                yPosition += 20; // Add space after table
            }
        } else if (type === 'customers' && reportData.data) {
            const data = reportData.data;

            // Summary section
            doc.fontSize(14).text('Customer Summary', 50, yPosition);
            yPosition += 30;

            doc.fontSize(10);
            doc.text(`Total Customers: ${data.summary?.totalCustomers || 0}`, 50, yPosition);
            doc.text(`Active Customers: ${data.summary?.activeCustomers || 0}`, 200, yPosition);
            doc.text(`Total Revenue: $${(data.summary?.totalRevenue || 0).toFixed(2)}`, 350, yPosition);
            yPosition += 40;

            // Top customers
            if (data.customers && data.customers.length > 0) {
                doc.fontSize(14).text('Top Customers', 50, yPosition);
                yPosition += 30;

                // Table configuration
                const tableTop = yPosition;
                const tableLeft = 50;
                const columnWidths = [120, 60, 80, 80, 100]; // Customer, Orders, Total Spent, Last Order, Type
                const rowHeight = 18;
                const headerHeight = 22;

                // Draw table header background
                doc.rect(tableLeft, tableTop, columnWidths.reduce((a, b) => a + b, 0), headerHeight)
                   .fillAndStroke('#f0f0f0', '#000000');

                // Table headers
                doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
                let currentX = tableLeft;
                const headers = ['Customer Name', 'Orders', 'Total Spent', 'Last Order', 'Type'];

                headers.forEach((header, index) => {
                    doc.text(header, currentX + 5, tableTop + 6, { width: columnWidths[index] - 10, align: 'left' });
                    currentX += columnWidths[index];
                });

                yPosition = tableTop + headerHeight;

                // Table data
                doc.font('Helvetica').fontSize(8);
                data.customers.slice(0, 20).forEach((customer, rowIndex) => {
                    if (yPosition > 700) { // Add new page if needed
                        doc.addPage();
                        yPosition = 50;

                        // Redraw headers on new page
                        doc.rect(tableLeft, yPosition, columnWidths.reduce((a, b) => a + b, 0), headerHeight)
                           .fillAndStroke('#f0f0f0', '#000000');

                        doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');
                        currentX = tableLeft;
                        headers.forEach((header, index) => {
                            doc.text(header, currentX + 5, yPosition + 6, { width: columnWidths[index] - 10, align: 'left' });
                            currentX += columnWidths[index];
                        });
                        yPosition += headerHeight;
                        doc.font('Helvetica').fontSize(8);
                    }

                    // Alternate row colors
                    const rowColor = rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
                    doc.rect(tableLeft, yPosition, columnWidths.reduce((a, b) => a + b, 0), rowHeight)
                       .fillAndStroke(rowColor, '#cccccc');

                    // Row data
                    const rowData = [
                        (customer.name || 'Unknown').substring(0, 18),
                        (customer.orderCount || 0).toString(),
                        `$${(customer.totalSpent || 0).toFixed(2)}`,
                        customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A',
                        customer.isGuest ? 'Guest' : 'Registered'
                    ];

                    doc.fillColor('#000000');
                    currentX = tableLeft;
                    rowData.forEach((data, index) => {
                        const align = (index === 1 || index === 2) ? 'right' : 'left';
                        doc.text(data, currentX + 5, yPosition + 4, {
                            width: columnWidths[index] - 10,
                            align: align
                        });
                        currentX += columnWidths[index];
                    });

                    yPosition += rowHeight;
                });

                yPosition += 20; // Add space after table
            }
        }

        // Finalize PDF
        console.log('✅ PDF generation completed successfully');
        doc.end();

    } catch (error) {
        console.error('❌ Error exporting PDF report:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting PDF report: ' + error.message
        });
    }
};


