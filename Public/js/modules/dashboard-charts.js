// Dashboard Charts Module
class DashboardCharts {
    constructor() {
        this.salesChart = null;
        this.orderStatusChart = null;
        this.productsChart = null;
    }

    updateCharts(orders, timePeriod = 'all') {
        console.log('Updating dashboard charts with', orders?.length || 0, 'orders for period:', timePeriod);

        // Update revenue chart only
        this.updateSalesChart(orders, timePeriod);
    }

    updateSalesChart(orders, timePeriod = 'all') {
        const salesCtx = document.getElementById('revenueChart');
        if (!salesCtx) {
            console.log('Revenue chart canvas not found');
            return;
        }

        // Validate orders data
        if (!orders || !Array.isArray(orders)) {
            console.error('Invalid orders data provided to chart');
            this.showEmptyChart(salesCtx, 'No sales data available');
            return;
        }

        if (orders.length === 0) {
            console.warn('No orders data available for chart');
            this.showEmptyChart(salesCtx, 'No sales data for selected period');
            return;
        }

        // Prepare chart data
        const chartData = this.prepareSalesChartData(orders, timePeriod);

        // Destroy existing chart if it exists
        if (this.salesChart && typeof this.salesChart.destroy === 'function') {
            try {
                this.salesChart.destroy();
                this.salesChart = null;
            } catch (error) {
                console.warn('Error destroying sales chart:', error);
                this.salesChart = null;
            }
        }

        // Also check for any existing Chart.js instances on this canvas
        const existingChart = Chart.getChart(salesCtx);
        if (existingChart) {
            try {
                existingChart.destroy();
            } catch (error) {
                console.warn('Error destroying existing chart instance:', error);
            }
        }

        // Create new sales chart
        this.salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: chartData.revenue,
                    borderColor: '#06d6a0',
                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                    pointBackgroundColor: '#06d6a0',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }, {
                    label: 'Orders Count',
                    data: chartData.orders,
                    borderColor: '#118ab2',
                    backgroundColor: 'rgba(17, 138, 178, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1',
                    pointBackgroundColor: '#118ab2',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: this.getXAxisLabel(timePeriod),
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Revenue ($)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: false,
                        min: function(context) {
                            const data = context.chart.data.datasets[0].data;
                            const minValue = Math.min(...data.filter(v => v > 0));
                            return Math.max(0, minValue * 0.9); // Start from 90% of minimum value or 0
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Number of Orders',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: false,
                        min: function(context) {
                            const data = context.chart.data.datasets[1].data;
                            const minValue = Math.min(...data.filter(v => v > 0));
                            return Math.max(0, Math.floor(minValue * 0.8)); // Start from 80% of minimum value or 0
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Sales Overview - ${this.getPeriodDisplayText(timePeriod)}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#06d6a0',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Revenue: $${context.parsed.y.toFixed(2)}`;
                                } else {
                                    return `Orders: ${context.parsed.y} orders`;
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('Sales chart created successfully');
    }

    updateProductsChart(orders, timePeriod = 'week') {
        const productsCtx = document.getElementById('productsChart');
        if (!productsCtx) {
            console.log('Products chart canvas not found');
            return;
        }

        // Validate orders data
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            this.showEmptyChart(productsCtx, 'No product data available');
            return;
        }

        // Prepare product distribution data
        const productData = this.prepareProductChartData(orders);

        // Destroy existing chart if it exists
        if (this.productsChart && typeof this.productsChart.destroy === 'function') {
            try {
                this.productsChart.destroy();
                this.productsChart = null;
            } catch (error) {
                console.warn('Error destroying products chart:', error);
                this.productsChart = null;
            }
        }

        // Also check for any existing Chart.js instances on this canvas
        const existingChart = Chart.getChart(productsCtx);
        if (existingChart) {
            try {
                existingChart.destroy();
            } catch (error) {
                console.warn('Error destroying existing chart instance:', error);
            }
        }

        // Create new products chart
        this.productsChart = new Chart(productsCtx, {
            type: 'doughnut',
            data: {
                labels: productData.labels,
                datasets: [{
                    data: productData.values,
                    backgroundColor: [
                        '#ff69b4',
                        '#ff1493',
                        '#ffc0cb',
                        '#ff91a4',
                        '#ff6b9d',
                        '#e83e8c',
                        '#ff8fa3'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Product Distribution'
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        console.log('Products chart created successfully');
    }

    updateOrderStatusChart(orders) {
        const statusCtx = document.getElementById('orderStatusChart');
        if (!statusCtx) {
            console.log('Order status chart canvas not found');
            return;
        }

        // Validate orders data
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            this.showEmptyChart(statusCtx, 'No order data available');
            return;
        }

        // Prepare order status data
        const statusData = this.prepareOrderStatusData(orders);

        // Destroy existing chart if it exists
        if (this.orderStatusChart && typeof this.orderStatusChart.destroy === 'function') {
            try {
                this.orderStatusChart.destroy();
                this.orderStatusChart = null;
            } catch (error) {
                console.warn('Error destroying order status chart:', error);
                this.orderStatusChart = null;
            }
        }

        // Also check for any existing Chart.js instances on this canvas
        const existingChart = Chart.getChart(statusCtx);
        if (existingChart) {
            try {
                existingChart.destroy();
            } catch (error) {
                console.warn('Error destroying existing chart instance:', error);
            }
        }

        // Create new order status chart
        this.orderStatusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: statusData.labels,
                datasets: [{
                    data: statusData.values,
                    backgroundColor: [
                        '#28a745', // completed - green
                        '#ffc107', // pending - yellow
                        '#17a2b8', // processing - blue
                        '#dc3545', // cancelled - red
                        '#6c757d'  // other - gray
                    ],
                    borderWidth: 3,
                    borderColor: '#fff',
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 11
                            },
                            padding: 15,
                            usePointStyle: true,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        const total = dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);

                                        return {
                                            text: `${label} (${percentage}%)`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.borderColor,
                                            lineWidth: dataset.borderWidth,
                                            pointStyle: 'circle',
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#28a745',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} orders (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000
                }
            }
        });

        console.log('Order status chart created successfully');
    }

    prepareOrderStatusData(orders) {
        const statusCounts = {
            'completed': 0,
            'pending': 0,
            'processing': 0,
            'cancelled': 0,
            'confirmed': 0
        };

        orders.forEach(order => {
            const status = order.status?.toLowerCase() || 'pending';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            } else {
                statusCounts['pending']++; // Default to pending for unknown statuses
            }
        });

        // Filter out zero values and prepare for chart
        const labels = [];
        const values = [];

        Object.entries(statusCounts).forEach(([status, count]) => {
            if (count > 0) {
                labels.push(status.charAt(0).toUpperCase() + status.slice(1));
                values.push(count);
            }
        });

        return { labels, values };
    }

    prepareSalesChartData(orders, timePeriod) {
        const now = new Date();
        const labels = [];
        const revenueData = [];
        const ordersData = [];

        // Generate labels based on time period
        const periods = this.generateTimePeriods(timePeriod, now);

        periods.forEach(period => {
            labels.push(period.label);

            // Filter orders for this period
            const periodOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= period.start && orderDate < period.end;
            });

            // Calculate revenue for this period
            const revenue = periodOrders.reduce((sum, order) => {
                // Try multiple fields to get order total
                let orderTotal = 0;

                if (order.totalAmount) {
                    orderTotal = parseFloat(order.totalAmount);
                } else if (order.total) {
                    orderTotal = parseFloat(order.total);
                } else if (order.payment && order.payment.amount) {
                    orderTotal = parseFloat(order.payment.amount);
                } else if (order.subtotal) {
                    orderTotal = parseFloat(order.subtotal);
                } else if (order.items && Array.isArray(order.items)) {
                    // Calculate from items if no total field
                    orderTotal = order.items.reduce((itemSum, item) => {
                        const price = parseFloat(item.price) || parseFloat(item.unitPrice) || 0;
                        const quantity = parseInt(item.quantity) || 1;
                        return itemSum + (price * quantity);
                    }, 0);
                }

                return sum + orderTotal;
            }, 0);

            revenueData.push(revenue);
            ordersData.push(periodOrders.length);
        });

        return {
            labels,
            revenue: revenueData,
            orders: ordersData
        };
    }

    prepareProductChartData(orders) {
        const productCounts = {};

        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const productName = this.getProductName(item);
                    const quantity = parseInt(item.quantity) || 1;

                    if (productCounts[productName]) {
                        productCounts[productName] += quantity;
                    } else {
                        productCounts[productName] = quantity;
                    }
                });
            }
        });

        // Sort by quantity and take top 7
        const sortedProducts = Object.entries(productCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 7);

        return {
            labels: sortedProducts.map(([name]) => name),
            values: sortedProducts.map(([,count]) => count)
        };
    }

    // Helper method to improve product name resolution (same as in reports-management.js)
    getProductName(item) {
        // Priority order for finding product name
        if (item.product && item.product.name) {
            return item.product.name;
        }
        if (item.productName) {
            return item.productName;
        }
        if (item.name && item.name !== 'Unknown Product') {
            return item.name;
        }
        if (item.productId) {
            // Try to make productId more readable if it's a slug
            if (typeof item.productId === 'string' && item.productId.includes('-')) {
                return item.productId
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
            return `Product: ${item.productId}`;
        }
        return 'Unknown Product';
    }

    generateTimePeriods(timePeriod, referenceDate) {
        const periods = [];
        const now = new Date(referenceDate);

        switch (timePeriod) {
            case 'today':
                // Generate hourly periods for today
                for (let hour = 0; hour < 24; hour += 3) {
                    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
                    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour + 3);
                    periods.push({
                        label: `${hour}:00`,
                        start,
                        end
                    });
                }
                break;

            case 'week':
                // Generate daily periods for the week
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);

                for (let day = 0; day < 7; day++) {
                    const start = new Date(startOfWeek);
                    start.setDate(startOfWeek.getDate() + day);
                    const end = new Date(start);
                    end.setDate(start.getDate() + 1);

                    periods.push({
                        label: start.toLocaleDateString('en-US', { weekday: 'short' }),
                        start,
                        end
                    });
                }
                break;

            case 'month':
                // Generate weekly periods for the month
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                let weekStart = new Date(startOfMonth);
                let weekNum = 1;

                while (weekStart <= endOfMonth) {
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 7);

                    periods.push({
                        label: `Week ${weekNum}`,
                        start: new Date(weekStart),
                        end: weekEnd > endOfMonth ? endOfMonth : weekEnd
                    });

                    weekStart.setDate(weekStart.getDate() + 7);
                    weekNum++;
                }
                break;

            case 'year':
                // Generate monthly periods for the year
                for (let month = 0; month < 12; month++) {
                    const start = new Date(now.getFullYear(), month, 1);
                    const end = new Date(now.getFullYear(), month + 1, 0);

                    periods.push({
                        label: start.toLocaleDateString('en-US', { month: 'short' }),
                        start,
                        end
                    });
                }
                break;

            default: // 'all'
                // Generate monthly periods for the last 6 months
                for (let month = 5; month >= 0; month--) {
                    const start = new Date(now.getFullYear(), now.getMonth() - month, 1);
                    const end = new Date(now.getFullYear(), now.getMonth() - month + 1, 0);

                    periods.push({
                        label: start.toLocaleDateString('en-US', { month: 'short' }),
                        start,
                        end
                    });
                }
                break;
        }

        return periods;
    }

    getXAxisLabel(timePeriod) {
        switch (timePeriod) {
            case 'today': return 'Hours';
            case 'week': return 'Days';
            case 'month': return 'Weeks';
            case 'year': return 'Months';
            default: return 'Months';
        }
    }

    getPeriodDisplayText(timePeriod) {
        switch (timePeriod) {
            case 'today': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'year': return 'This Year';
            default: return 'All Time';
        }
    }

    showEmptyChart(canvas, message = 'No data available') {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set font and text properties
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw message in center of canvas
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);

        console.log('Empty chart displayed:', message);
    }
}

// Export for use in other modules
window.DashboardCharts = DashboardCharts;
