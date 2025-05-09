const AdminManager = {
    apiBaseUrl: '/api/orders',

    async init() {
        await this.loadOrders();
        this.setupEventListeners();
    },

    async loadOrders() {
        try {
            const response = await fetch(this.apiBaseUrl, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            const orders = await response.json();
            this.displayOrders(orders);
            this.updateOrderStats(orders);
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Error loading orders', 'error');
        }
    },

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

    createOrderCard(order) {
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        const orderTime = new Date(order.orderDate).toLocaleTimeString();
        const total = this.calculateOrderTotal(order.items);

        return `
            <div class="order-card" data-order-id="${order._id}">
                <div class="order-header">
                    <h3>Order #${order._id}</h3>
                    <span class="order-date">${orderDate} ${orderTime}</span>
                    <span class="order-status ${order.status}">${order.status}</span>
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
                        ${this.createOrderItemsList(order.items)}
                    </div>
                    <div class="order-summary">
                        <p><strong>Total:</strong> $${total.toFixed(2)}</p>
                        <p><strong>Date Needed:</strong> ${order.dateNeeded}</p>
                        <p><strong>Time Needed:</strong> ${order.timeNeeded}</p>
                        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
                    </div>
                </div>
                <div class="order-actions">
                    <select class="status-select" onchange="AdminManager.updateOrderStatus('${order._id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                    <button class="print-order" onclick="AdminManager.printOrder('${order._id}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
            </div>
        `;
    },

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

    calculateOrderTotal(items) {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    async updateOrderStatus(orderId, newStatus) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) {
                throw new Error('Failed to update order status');
            }
            this.showNotification(`Order status updated to ${newStatus}`, 'success');
            await this.loadOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showNotification('Error updating order status', 'error');
        }
    },

    async printOrder(orderId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) {
                throw new Error('Order not found');
            }
            const order = await response.json();

            const printWindow = window.open('', '_blank');
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            const orderTime = new Date(order.orderDate).toLocaleTimeString();
            const total = this.calculateOrderTotal(order.items);

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
                                ${order.items.map(item => `
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
                        <p>Date Needed: ${order.dateNeeded}</p>
                        <p>Time Needed: ${order.timeNeeded}</p>
                        ${order.notes ? `<p>Notes: ${order.notes}</p>` : ''}
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.print();
        } catch (error) {
            console.error('Error printing order:', error);
            this.showNotification('Error printing order', 'error');
        }
    },

    updateOrderStats(orders) {
        const statsContainer = document.getElementById('order-stats');
        if (!statsContainer) return;

        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const processingOrders = orders.filter(order => order.status === 'processing').length;
        const completedOrders = orders.filter(order => order.status === 'completed').length;
        const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

        const totalRevenue = orders
            .filter(order => order.status === 'completed')
            .reduce((total, order) => total + this.calculateOrderTotal(order.items), 0);

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

    setupEventListeners() {
        const filterSelect = document.getElementById('order-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', async (e) => {
                const status = e.target.value;
                try {
                    const response = await fetch(this.apiBaseUrl, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        }
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch orders');
                    }
                    const orders = await response.json();
                    const filteredOrders = status === 'all' ? orders : orders.filter(order => order.status === status);
                    this.displayOrders(filteredOrders);
                } catch (error) {
                    console.error('Error filtering orders:', error);
                    this.showNotification('Error filtering orders', 'error');
                }
            });
        }

        const searchInput = document.getElementById('order-search');
        if (searchInput) {
            searchInput.addEventListener('input', async (e) => {
                const searchTerm = e.target.value.toLowerCase();
                try {
                    const response = await fetch(this.apiBaseUrl, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        }
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch orders');
                    }
                    const orders = await response.json();
                    const filteredOrders = orders.filter(order =>
                        order._id.toLowerCase().includes(searchTerm) ||
                        order.customer.firstName.toLowerCase().includes(searchTerm) ||
                        order.customer.lastName.toLowerCase().includes(searchTerm) ||
                        order.customer.email.toLowerCase().includes(searchTerm)
                    );
                    this.displayOrders(filteredOrders);
                } catch (error) {
                    console.error('Error searching orders:', error);
                    this.showNotification('Error searching orders', 'error');
                }
            });
        }
    },

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    generateReport(period) {
        // This method can be improved to fetch report data from backend API
        this.showNotification('Report generation from backend API not implemented yet', 'info');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    AdminManager.init();
});
