/**
 * Utility functions for generating various reports for the admin panel
 */

/**
 * Generates a daily sales report
 * @param {Array} orders - Array of orders for the day
 * @returns {Object} Daily sales report
 */
exports.generateDailySalesReport = (orders) => {
    const report = {
        date: new Date(),
        totalOrders: orders.length,
        totalCupcakes: 0,
        totalRevenue: 0,
        pickupOrders: 0,
        deliveryOrders: 0,
        ordersByStatus: {
            pending: 0,
            processing: 0,
            completed: 0,
            cancelled: 0
        },
        popularItems: {},
        orders: []
    };

    // Process each order
    orders.forEach(order => {
        // Count total cupcakes
        const cupcakeCount = order.items.reduce((total, item) => total + item.quantity, 0);
        report.totalCupcakes += cupcakeCount;
        
        // Add to revenue
        report.totalRevenue += order.totalPrice;
        
        // Count delivery types
        if (order.deliveryOption === 'pickup') {
            report.pickupOrders++;
        } else {
            report.deliveryOrders++;
        }
        
        // Count by status
        report.ordersByStatus[order.status]++;
        
        // Track popular items
        order.items.forEach(item => {
            const itemKey = item.name;
            if (!report.popularItems[itemKey]) {
                report.popularItems[itemKey] = {
                    name: itemKey,
                    count: 0,
                    revenue: 0
                };
            }
            report.popularItems[itemKey].count += item.quantity;
            report.popularItems[itemKey].revenue += item.price * item.quantity;
        });
        
        // Add order to list
        report.orders.push({
            orderId: order._id,
            customer: {
                firstName: order.customerName.split(' ')[0],
                lastName: order.customerName.split(' ').slice(1).join(' ')
            },
            items: order.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
            cupcakes: cupcakeCount,
            total: order.totalPrice,
            deliveryOption: order.deliveryOption,
            status: order.status,
            neededTime: order.neededTime
        });
    });
    
    // Convert popular items to array and sort by count
    report.popularItems = Object.values(report.popularItems)
        .sort((a, b) => b.count - a.count);
    
    return report;
};

/**
 * Generates a delivery route report
 * @param {Array} orders - Array of delivery orders
 * @returns {Object} Delivery route report
 */
exports.generateDeliveryRouteReport = (orders) => {
    const report = {
        date: new Date(),
        totalDeliveries: orders.length,
        timeWindows: []
    };
    
    // Group deliveries by time window
    const timeWindows = {};
    
    orders.forEach(order => {
        const timeWindow = order.neededTime.split(':')[0] + ':00';
        
        if (!timeWindows[timeWindow]) {
            timeWindows[timeWindow] = [];
        }
        
        timeWindows[timeWindow].push({
            customer: order.customerName,
            address: order.deliveryAddress,
            phone: order.phone,
            items: order.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
            cupcakes: order.items.reduce((total, item) => total + item.quantity, 0),
            total: order.totalPrice,
            notes: order.specialInstructions || 'None'
        });
    });
    
    // Convert to array format
    Object.keys(timeWindows).sort().forEach(timeWindow => {
        report.timeWindows.push({
            timeWindow,
            count: timeWindows[timeWindow].length,
            deliveries: timeWindows[timeWindow]
        });
    });
    
    return report;
};

/**
 * Generates a monthly sales report
 * @param {Array} orders - Array of orders for the month
 * @returns {Object} Monthly sales report
 */
exports.generateMonthlySalesReport = (orders) => {
    const report = {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        totalOrders: orders.length,
        totalCupcakes: 0,
        totalRevenue: 0,
        dailyTotals: {},
        categoryBreakdown: {},
        customerStats: {
            newCustomers: 0,
            returningCustomers: 0,
            topCustomers: []
        }
    };
    
    // Track customers for analysis
    const customerOrders = {};
    
    // Process each order
    orders.forEach(order => {
        // Count total cupcakes
        const cupcakeCount = order.items.reduce((total, item) => total + item.quantity, 0);
        report.totalCupcakes += cupcakeCount;
        
        // Add to revenue
        report.totalRevenue += order.totalPrice;
        
        // Track daily totals
        const date = new Date(order.orderDate).toDateString();
        if (!report.dailyTotals[date]) {
            report.dailyTotals[date] = {
                orders: 0,
                cupcakes: 0,
                revenue: 0
            };
        }
        report.dailyTotals[date].orders++;
        report.dailyTotals[date].cupcakes += cupcakeCount;
        report.dailyTotals[date].revenue += order.totalPrice;
        
        // Track category breakdown
        order.items.forEach(item => {
            const category = item.category || 'Uncategorized';
            if (!report.categoryBreakdown[category]) {
                report.categoryBreakdown[category] = {
                    orders: 0,
                    cupcakes: 0,
                    revenue: 0
                };
            }
            report.categoryBreakdown[category].orders++;
            report.categoryBreakdown[category].cupcakes += item.quantity;
            report.categoryBreakdown[category].revenue += item.price * item.quantity;
        });
        
        // Track customer orders
        const customerId = order.customerId || order.customerEmail;
        if (!customerOrders[customerId]) {
            customerOrders[customerId] = {
                name: order.customerName,
                email: order.customerEmail,
                orders: 0,
                cupcakes: 0,
                revenue: 0
            };
        }
        customerOrders[customerId].orders++;
        customerOrders[customerId].cupcakes += cupcakeCount;
        customerOrders[customerId].revenue += order.totalPrice;
    });
    
    // Convert daily totals to array
    report.dailyTotals = Object.entries(report.dailyTotals).map(([date, data]) => ({
        date,
        ...data
    }));
    
    // Convert category breakdown to array
    report.categoryBreakdown = Object.entries(report.categoryBreakdown).map(([category, data]) => ({
        category,
        ...data
    }));
    
    // Analyze customer data
    const customerArray = Object.values(customerOrders);
    report.customerStats.newCustomers = customerArray.filter(c => c.orders === 1).length;
    report.customerStats.returningCustomers = customerArray.filter(c => c.orders > 1).length;
    report.customerStats.topCustomers = customerArray
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    
    return report;
};

/**
 * Generates a custom report based on specified parameters
 * @param {Array} orders - Array of orders to analyze
 * @param {Object} params - Report parameters
 * @returns {Object} Custom report
 */
exports.generateCustomReport = (orders, params) => {
    const report = {
        title: params.title || 'Custom Report',
        dateGenerated: new Date(),
        filters: params.filters || {},
        summary: {
            totalOrders: orders.length,
            totalCupcakes: 0,
            totalRevenue: 0
        },
        data: []
    };
    
    // Apply filters if specified
    let filteredOrders = [...orders];
    if (params.filters) {
        if (params.filters.status) {
            filteredOrders = filteredOrders.filter(order => order.status === params.filters.status);
        }
        if (params.filters.deliveryOption) {
            filteredOrders = filteredOrders.filter(order => order.deliveryOption === params.filters.deliveryOption);
        }
        if (params.filters.dateRange) {
            const startDate = new Date(params.filters.dateRange.start);
            const endDate = new Date(params.filters.dateRange.end);
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.orderDate);
                return orderDate >= startDate && orderDate <= endDate;
            });
        }
    }
    
    // Calculate summary
    filteredOrders.forEach(order => {
        const cupcakeCount = order.items.reduce((total, item) => total + item.quantity, 0);
        report.summary.totalCupcakes += cupcakeCount;
        report.summary.totalRevenue += order.totalPrice;
    });
    
    // Generate data based on report type
    if (params.type === 'itemPopularity') {
        const itemStats = {};
        
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                if (!itemStats[item.name]) {
                    itemStats[item.name] = {
                        name: item.name,
                        count: 0,
                        revenue: 0
                    };
                }
                itemStats[item.name].count += item.quantity;
                itemStats[item.name].revenue += item.price * item.quantity;
            });
        });
        
        report.data = Object.values(itemStats).sort((a, b) => b.count - a.count);
    } else if (params.type === 'dailyTrends') {
        const dailyStats = {};
        
        filteredOrders.forEach(order => {
            const date = new Date(order.orderDate).toDateString();
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    orders: 0,
                    cupcakes: 0,
                    revenue: 0
                };
            }
            dailyStats[date].orders++;
            dailyStats[date].cupcakes += order.items.reduce((total, item) => total + item.quantity, 0);
            dailyStats[date].revenue += order.totalPrice;
        });
        
        report.data = Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (params.type === 'customerAnalysis') {
        const customerStats = {};
        
        filteredOrders.forEach(order => {
            const customerId = order.customerId || order.customerEmail;
            if (!customerStats[customerId]) {
                customerStats[customerId] = {
                    name: order.customerName,
                    email: order.customerEmail,
                    orders: 0,
                    cupcakes: 0,
                    revenue: 0,
                    firstOrder: new Date(order.orderDate),
                    lastOrder: new Date(order.orderDate)
                };
            }
            customerStats[customerId].orders++;
            customerStats[customerId].cupcakes += order.items.reduce((total, item) => total + item.quantity, 0);
            customerStats[customerId].revenue += order.totalPrice;
            
            const orderDate = new Date(order.orderDate);
            if (orderDate < customerStats[customerId].firstOrder) {
                customerStats[customerId].firstOrder = orderDate;
            }
            if (orderDate > customerStats[customerId].lastOrder) {
                customerStats[customerId].lastOrder = orderDate;
            }
        });
        
        report.data = Object.values(customerStats).sort((a, b) => b.revenue - a.revenue);
    }
    
    return report;
};
