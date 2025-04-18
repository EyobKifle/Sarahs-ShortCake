// Admin panel functionality
const AdminManager = {
    // Initialize admin panel
    init() {
        this.loadOrders();
        this.setupEventListeners();
    },
    
    // Load orders from storage
    loadOrders() {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        this.displayOrders(orders);
        this.updateOrderStats(orders);
    },
    
    // Display orders in the admin panel
    displayOrders(orders) {
        const ordersContainer = document.getElementById('orders-container');
        if (!ordersContainer) return;
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p class="no-orders">No orders found</p>';
            return;
        }
        
        const ordersHTML = orders.map(order => this.createOrderCard(order)).join('');
        ordersContainer.innerHTML = ordersHTML;
    },
    
    // Create HTML for an order card
    createOrderCard(order) {
        const orderDate = new Date(order.order.orderDate).toLocaleDateString();
        const orderTime = new Date(order.order.orderDate).toLocaleTimeString();
        const total = this.calculateOrderTotal(order.order.items);
        
        return `
            <div class="order-card" data-order-id="${order.orderId}">
                <div class="order-header">
                    <h3>Order #${order.orderId}</h3>
                    <span class="order-date">${orderDate} ${orderTime}</span>
                    <span class="order-status ${order.order.status}">${order.order.status}</span>
                </div>
                <div class="order-details">
                    <div class="customer-info">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
                        <p><strong>Email:</strong> ${order.customer.email}</p>
                        <p><strong>Phone:</strong> ${order.customer.phone}</p>
                        <p><strong>Type:</strong> ${order.customer.isGuest ? 'Guest' : 'Registered'}</p>
                    </div>
                    <div class="delivery-info">
                        <h4>Delivery Information</h4>
                        <p><strong>Type:</strong> ${order.delivery.type}</p>
                        ${order.delivery.type === 'delivery' ? `
                            <p><strong>Address:</strong> ${order.delivery.address}</p>
                            <p><strong>City:</strong> ${order.delivery.city}</p>
                        ` : ''}
                    </div>
                    <div class="order-items">
                        <h4>Order Items</h4>
                        ${this.createOrderItemsList(order.order.items)}
                    </div>
                    <div class="order-summary">
                        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
                        <p><strong>Date Needed:</strong> ${order.order.dateNeeded}</p>
                        <p><strong>Time Needed:</strong> ${order.order.timeNeeded}</p>
                        ${order.order.notes ? `<p><strong>Notes:</strong> ${order.order.notes}</p>` : ''}
                    </div>
                </div>
                <div class="order-actions">
                    <select class="status-select" onchange="AdminManager.updateOrderStatus('${order.orderId}', this.value)">
                        <option value="pending" ${order.order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${order.order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="print-order" onclick="AdminManager.printOrder('${order.orderId}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
            </div>
        `;
    },
    
    // Create HTML for order items list
    createOrderItemsList(items) {
        return `
            <ul class="items-list">
                ${items.map(item => `
                    <li class="order-item">
                        <img src="${item.image}" alt="${item.name}" onerror="this.src='images/placeholder.jpg'">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-quantity">x${item.quantity}</span>
                            <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                            ${item.type === 'custom' ? this.createCustomItemDetails(item.details) : ''}
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    },
    
    // Create HTML for custom item details
    createCustomItemDetails(details) {
        return `
            <div class="custom-details">
                <p><strong>Cupcake:</strong> ${details.cupcakeFlavor} (${details.cupcakeColor})</p>
                <p><strong>Icing:</strong> ${details.icingFlavor} (${details.icingColor})</p>
                ${details.specialDecorations && details.specialDecorations !== 'None' ? 
                  `<p><strong>Decorations:</strong> ${details.specialDecorations}</p>` : ''}
            </div>
        `;
    },
    
    // Calculate total for an order
    calculateOrderTotal(items) {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    // Update order status
    updateOrderStatus(orderId, newStatus) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderIndex = orders.findIndex(order => order.orderId === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].order.status = newStatus;
            localStorage.setItem('orders', JSON.stringify(orders));
            this.showNotification(`Order status updated to ${newStatus}`, 'success');
            this.loadOrders(); // Refresh the display
        }
    },
    
    // Print order
    printOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find(order => order.orderId === orderId);
        
        if (!order) {
            this.showNotification('Order not found', 'error');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        const orderDate = new Date(order.order.orderDate).toLocaleDateString();
        const orderTime = new Date(order.order.orderDate).toLocaleTimeString();
        const total = this.calculateOrderTotal(order.order.items);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Order #${orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .section { margin-bottom: 20px; }
                    .section h3 { border-bottom: 1px solid #ccc; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .total { text-align: right; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Sarah's Short Cakes</h1>
                    <h2>Order #${orderId}</h2>
                    <p>Date: ${orderDate} ${orderTime}</p>
                </div>
                
                <div class="section">
                    <h3>Customer Information</h3>
                    <p>Name: ${order.customer.firstName} ${order.customer.lastName}</p>
                    <p>Email: ${order.customer.email}</p>
                    <p>Phone: ${order.customer.phone}</p>
                    <p>Type: ${order.customer.isGuest ? 'Guest' : 'Registered'}</p>
                </div>
                
                <div class="section">
                    <h3>Delivery Information</h3>
                    <p>Type: ${order.delivery.type}</p>
                    ${order.delivery.type === 'delivery' ? `
                        <p>Address: ${order.delivery.address}</p>
                        <p>City: ${order.delivery.city}</p>
                    ` : ''}
                </div>
                
                <div class="section">
                    <h3>Order Items</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.order.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.price.toFixed(2)}</td>
                                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                                ${item.type === 'custom' ? `
                                    <tr>
                                        <td colspan="4">
                                            <strong>Cupcake:</strong> ${item.details.cupcakeFlavor} (${item.details.cupcakeColor})<br>
                                            <strong>Icing:</strong> ${item.details.icingFlavor} (${item.details.icingColor})<br>
                                            ${item.details.specialDecorations && item.details.specialDecorations !== 'None' ? 
                                              `<strong>Decorations:</strong> ${item.details.specialDecorations}` : ''}
                                        </td>
                                    </tr>
                                ` : ''}
                            `).join('')}
                        </tbody>
                    </table>
                    <p class="total">Total: $${total.toFixed(2)}</p>
                </div>
                
                <div class="section">
                    <h3>Order Details</h3>
                    <p>Date Needed: ${order.order.dateNeeded}</p>
                    <p>Time Needed: ${order.order.timeNeeded}</p>
                    ${order.order.notes ? `<p>Notes: ${order.order.notes}</p>` : ''}
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    },
    
    // Update order statistics
    updateOrderStats(orders) {
        const statsContainer = document.getElementById('order-stats');
        if (!statsContainer) return;
        
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => order.order.status === 'pending').length;
        const processingOrders = orders.filter(order => order.order.status === 'processing').length;
        const completedOrders = orders.filter(order => order.order.status === 'completed').length;
        const cancelledOrders = orders.filter(order => order.order.status === 'cancelled').length;
        
        const totalRevenue = orders
            .filter(order => order.order.status === 'completed')
            .reduce((total, order) => total + this.calculateOrderTotal(order.order.items), 0);
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>Total Orders</h3>
                <p>${totalOrders}</p>
            </div>
            <div class="stat-card">
                <h3>Pending</h3>
                <p>${pendingOrders}</p>
            </div>
            <div class="stat-card">
                <h3>Processing</h3>
                <p>${processingOrders}</p>
            </div>
            <div class="stat-card">
                <h3>Completed</h3>
                <p>${completedOrders}</p>
            </div>
            <div class="stat-card">
                <h3>Cancelled</h3>
                <p>${cancelledOrders}</p>
            </div>
            <div class="stat-card">
                <h3>Total Revenue</h3>
                <p>$${totalRevenue.toFixed(2)}</p>
            </div>
        `;
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Filter orders
        const filterSelect = document.getElementById('order-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                const status = e.target.value;
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                const filteredOrders = status === 'all' ? 
                    orders : 
                    orders.filter(order => order.order.status === status);
                this.displayOrders(filteredOrders);
            });
        }
        
        // Search orders
        const searchInput = document.getElementById('order-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                const filteredOrders = orders.filter(order => 
                    order.orderId.toLowerCase().includes(searchTerm) ||
                    order.customer.firstName.toLowerCase().includes(searchTerm) ||
                    order.customer.lastName.toLowerCase().includes(searchTerm) ||
                    order.customer.email.toLowerCase().includes(searchTerm)
                );
                this.displayOrders(filteredOrders);
            });
        }
    },
    
    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Generate financial report
    generateReport(period) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const now = new Date();
        let filteredOrders = [];
        
        // Filter orders by period
        switch(period) {
            case 'daily':
                filteredOrders = orders.filter(order => {
                    const orderDate = new Date(order.order.orderDate);
                    return orderDate.toDateString() === now.toDateString();
                });
                break;
            case 'monthly':
                filteredOrders = orders.filter(order => {
                    const orderDate = new Date(order.order.orderDate);
                    return orderDate.getMonth() === now.getMonth() && 
                           orderDate.getFullYear() === now.getFullYear();
                });
                break;
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                filteredOrders = orders.filter(order => {
                    const orderDate = new Date(order.order.orderDate);
                    return Math.floor(orderDate.getMonth() / 3) === quarter && 
                           orderDate.getFullYear() === now.getFullYear();
                });
                break;
            case 'yearly':
                filteredOrders = orders.filter(order => {
                    const orderDate = new Date(order.order.orderDate);
                    return orderDate.getFullYear() === now.getFullYear();
                });
                break;
            default:
                filteredOrders = orders;
        }

        // Calculate metrics
        const totalRevenue = filteredOrders
            .filter(order => order.order.status === 'completed')
            .reduce((total, order) => total + this.calculateOrderTotal(order.order.items), 0);
        
        // For demo purposes, we'll assume cost is 40% of revenue
        const totalCost = totalRevenue * 0.4;
        const totalProfit = totalRevenue - totalCost;
        
        // Display report
        this.displayReport({
            period,
            totalOrders: filteredOrders.length,
            completedOrders: filteredOrders.filter(o => o.order.status === 'completed').length,
            totalRevenue,
            totalCost,
            totalProfit
        });
    },

    // Display report with charts
    displayReport(reportData) {
        // Create report container if it doesn't exist
        let reportContainer = document.getElementById('report-container');
        if (!reportContainer) {
            reportContainer = document.createElement('div');
            reportContainer.id = 'report-container';
            reportContainer.style.margin = '20px 0';
            reportContainer.style.padding = '20px';
            reportContainer.style.backgroundColor = 'white';
            reportContainer.style.borderRadius = '10px';
            reportContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            document.querySelector('.admin-container').appendChild(reportContainer);
        }

        // Create report HTML
        reportContainer.innerHTML = `
            <h2>${this.formatPeriod(reportData.period)} Report</h2>
            <div class="report-stats">
                <div class="stat-card">
                    <h3>Total Orders</h3>
                    <p>${reportData.totalOrders}</p>
                </div>
                <div class="stat-card">
                    <h3>Completed Orders</h3>
                    <p>${reportData.completedOrders}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Revenue</h3>
                    <p>$${reportData.totalRevenue.toFixed(2)}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Cost</h3>
                    <p>$${reportData.totalCost.toFixed(2)}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Profit</h3>
                    <p>$${reportData.totalProfit.toFixed(2)}</p>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <canvas id="report-chart" width="400" height="200"></canvas>
            </div>
        `;

        // Generate chart
        this.generateChart(reportData);
    },

    // Format period for display
    formatPeriod(period) {
        const now = new Date();
        switch(period) {
            case 'daily':
                return now.toLocaleDateString();
            case 'monthly':
                return now.toLocaleDateString('default', { month: 'long', year: 'numeric' });
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3) + 1;
                return `Q${quarter} ${now.getFullYear()}`;
            case 'yearly':
                return now.getFullYear().toString();
            default:
                return 'Custom';
        }
    },

    // Generate chart using Chart.js
    generateChart(reportData) {
        const ctx = document.getElementById('report-chart').getContext('2d');
        
        // Destroy previous chart if exists
        if (this.reportChart) {
            this.reportChart.destroy();
        }

        this.reportChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Revenue', 'Cost', 'Profit'],
                datasets: [{
                    label: 'Financial Overview',
                    data: [reportData.totalRevenue, reportData.totalCost, reportData.totalProfit],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
};

// Initialize admin panel on page load
document.addEventListener('DOMContentLoaded', function() {
    AdminManager.init();
}); 