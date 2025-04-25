// Consolidated Admin Dashboard JavaScript combining admin-scripts.js, admin-dashboard.js, and relevant parts of admin.js

const AdminManager = {
    apiBaseUrl: '/api/orders',

    // Initialize the admin dashboard
    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.loadRecentOrders();

        // Show dashboard by default
        this.showSection('dashboard');
    },

    // Set up event listeners
    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn') || document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    if (response.ok) {
                        localStorage.removeItem('adminToken');
                        window.location.href = 'login.html';
                    } else {
                        alert('Logout failed. Please try again.');
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Logout error. Please try again.');
                }
            });
        }

        // Time period filter
        const timePeriod = document.getElementById('timePeriod');
        if (timePeriod) {
            timePeriod.addEventListener('change', () => {
                this.loadDashboardData();
            });
        }

        // Order search
        const orderSearch = document.getElementById('orderSearch');
        if (orderSearch) {
            orderSearch.addEventListener('input', (e) => {
                this.filterOrders();
            });
        }

        // Order status filter
        const orderStatusFilter = document.getElementById('orderStatusFilter');
        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', () => {
                this.filterOrders();
            });
        }

        // Order date filter
        const orderDateFilter = document.getElementById('orderDateFilter');
        if (orderDateFilter) {
            orderDateFilter.addEventListener('change', () => {
                this.filterOrders();
            });
        }

        // Save order button
        const saveOrderBtn = document.getElementById('saveOrderBtn');
        if (saveOrderBtn) {
            saveOrderBtn.addEventListener('click', () => {
                this.saveOrderChanges();
            });
        }
    },

    // Show a specific section
    showSection(section) {
        // Hide all sections
        document.querySelectorAll('#mainContent > section').forEach(sec => {
            sec.classList.add('d-none');
        });

        // Show the selected section
        const sectionEl = document.getElementById(`${section}Section`);
        if (sectionEl) {
            sectionEl.classList.remove('d-none');
        }

        // Update active nav link
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load section data if needed
        switch(section) {
            case 'orders':
                this.loadAllOrders();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    },

    // Load dashboard data
    async loadDashboardData() {
        const period = document.getElementById('timePeriod') ? document.getElementById('timePeriod').value : null;
        try {
            const response = await fetch('/api/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }
            const data = await response.json();
            // Update UI with data
            if (document.getElementById('totalOrders')) {
                document.getElementById('totalOrders').textContent = data.totalOrders;
            }
            if (document.getElementById('ordersChange')) {
                document.getElementById('ordersChange').innerHTML = `
                    <i class="fas ${data.ordersChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger'}"></i> 
                    ${Math.abs(data.ordersChange)}% from yesterday
                `;
            }
            if (document.getElementById('totalRevenue')) {
                document.getElementById('totalRevenue').textContent = `$${data.totalRevenue.toFixed(2)}`;
            }
            if (document.getElementById('revenueChange')) {
                document.getElementById('revenueChange').innerHTML = `
                    <i class="fas ${data.revenueChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger'}"></i> 
                    ${Math.abs(data.revenueChange)}% from yesterday
                `;
            }
            if (document.getElementById('newCustomers')) {
                document.getElementById('newCustomers').textContent = data.newCustomers;
            }
            if (document.getElementById('customersChange')) {
                document.getElementById('customersChange').innerHTML = `
                    <i class="fas fa-arrow-up text-success"></i> 
                    ${data.customersChange} from yesterday
                `;
            }
            if (document.getElementById('avgRating')) {
                document.getElementById('avgRating').textContent = data.avgRating.toFixed(1);
            }
            if (document.getElementById('ratingChange')) {
                document.getElementById('ratingChange').innerHTML = `
                    <i class="fas fa-arrow-up text-success"></i> 
                    ${data.ratingChange} from last week
                `;
            }
            this.updateCharts(data.orders);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    },

    // Update charts with order data
    updateCharts(orders) {
        // Sales Chart
        const salesCtx = document.getElementById('salesChart') ? document.getElementById('salesChart').getContext('2d') : null;
        if (!salesCtx) return;

        // Group orders by day for the last 7 days
        const dates = [];
        const salesData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            const daySales = orders
                .filter(order => order.order.status === 'completed' && 
                       new Date(order.order.orderDate).toISOString().split('T')[0] === dateStr)
                .reduce((total, order) => total + this.calculateOrderTotal(order.order.items), 0);

            salesData.push(daySales);
        }

        if (window.salesChart) {
            window.salesChart.destroy();
        }

        window.salesChart = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily Sales',
                    data: salesData,
                    backgroundColor: 'rgba(255, 107, 139, 0.2)',
                    borderColor: 'rgba(255, 107, 139, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Products Chart
        const productsCtx = document.getElementById('productsChart') ? document.getElementById('productsChart').getContext('2d') : null;
        if (!productsCtx) return;

        // Count product occurrences
        const productCounts = {};
        orders.forEach(order => {
            order.order.items.forEach(item => {
                productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
            });
        });

        const sortedProducts = Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (window.productsChart) {
            window.productsChart.destroy();
        }

        window.productsChart = new Chart(productsCtx, {
            type: 'doughnut',
            data: {
                labels: sortedProducts.map(p => p[0]),
                datasets: [{
                    data: sortedProducts.map(p => p[1]),
                    backgroundColor: [
                        'rgba(255, 107, 139, 0.8)',
                        'rgba(255, 209, 102, 0.8)',
                        'rgba(6, 214, 160, 0.8)',
                        'rgba(23, 162, 184, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    },

    // Load recent orders for dashboard
    loadRecentOrders() {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]')
            .sort((a, b) => new Date(b.order.orderDate) - new Date(a.order.orderDate))
            .slice(0, 5);

        const tbody = document.querySelector('#recentOrdersTable tbody');
        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No recent orders</td></tr>';
            return;
        }

        orders.forEach(order => {
            const orderDate = new Date(order.order.orderDate);
            const row = document.createElement('tr');

            row.innerHTML = `
                <td class="order-id">#${order.orderId}</td>
                <td>${order.customer.firstName} ${order.customer.lastName}</td>
                <td>${orderDate.toLocaleDateString()}</td>
                <td>$${this.calculateOrderTotal(order.order.items).toFixed(2)}</td>
                <td><span class="badge badge-${order.order.status}">${order.order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-order" data-id="${order.orderId}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewOrderDetails(btn.getAttribute('data-id'));
            });
        });
    },

    // Load all orders for orders section
    loadAllOrders() {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]')
            .sort((a, b) => new Date(b.order.orderDate) - new Date(a.order.orderDate));

        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No orders found</td></tr>';
            return;
        }

        orders.forEach(order => {
            const orderDate = new Date(order.order.orderDate);
            const row = document.createElement('tr');

            row.innerHTML = `
                <td class="order-id">#${order.orderId}</td>
                <td>${order.customer.firstName} ${order.customer.lastName}</td>
                <td>${orderDate.toLocaleDateString()}</td>
                <td>${order.order.items.reduce((total, item) => total + item.quantity, 0)}</td>
                <td>$${this.calculateOrderTotal(order.order.items).toFixed(2)}</td>
                <td><span class="badge badge-${order.order.status}">${order.order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-order" data-id="${order.orderId}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-order" data-id="${order.orderId}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewOrderDetails(btn.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.edit-order').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editOrder(btn.getAttribute('data-id'));
            });
        });
    },

    // Filter orders based on search and filters
    filterOrders() {
        const searchTerm = document.getElementById('orderSearch') ? document.getElementById('orderSearch').value.toLowerCase() : '';
        const statusFilter = document.getElementById('orderStatusFilter') ? document.getElementById('orderStatusFilter').value : 'all';
        const dateFilter = document.getElementById('orderDateFilter') ? document.getElementById('orderDateFilter').value : 'all';

        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];

        const orders = JSON.parse(localStorage.getItem('orders') || '[]')
            .filter(order => {
                // Apply status filter
                if (statusFilter !== 'all' && order.order.status !== statusFilter) {
                    return false;
                }

                // Apply date filter
                const orderDate = new Date(order.order.orderDate).toISOString().split('T')[0];
                if (dateFilter === 'today' && orderDate !== today) {
                    return false;
                }
                if (dateFilter === 'week' && orderDate < weekAgo) {
                    return false;
                }
                if (dateFilter === 'month' && orderDate < monthAgoStr) {
                    return false;
                }

                // Apply search
                if (searchTerm &&
                    !order.orderId.toLowerCase().includes(searchTerm) &&
                    !order.customer.firstName.toLowerCase().includes(searchTerm) &&
                    !order.customer.lastName.toLowerCase().includes(searchTerm) &&
                    !order.customer.email.toLowerCase().includes(searchTerm)) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => new Date(b.order.orderDate) - new Date(a.order.orderDate));

        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No orders match your criteria</td></tr>';
            return;
        }

        orders.forEach(order => {
            const orderDate = new Date(order.order.orderDate);
            const row = document.createElement('tr');

            row.innerHTML = `
                <td class="order-id">#${order.orderId}</td>
                <td>${order.customer.firstName} ${order.customer.lastName}</td>
                <td>${orderDate.toLocaleDateString()}</td>
                <td>${order.order.items.reduce((total, item) => total + item.quantity, 0)}</td>
                <td>$${this.calculateOrderTotal(order.order.items).toFixed(2)}</td>
                <td><span class="badge badge-${order.order.status}">${order.order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-order" data-id="${order.orderId}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-order" data-id="${order.orderId}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewOrderDetails(btn.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.edit-order').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editOrder(btn.getAttribute('data-id'));
            });
        });
    },

    // View order details
    viewOrderDetails(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find(o => o.orderId === orderId);

        if (!order) {
            this.showNotification('Order not found', 'error');
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        document.getElementById('orderModalTitle').textContent = `Order #${order.orderId}`;

        const orderDate = new Date(order.order.orderDate);
        const deliveryDate = new Date(order.order.dateNeeded);

        // Create order items HTML
        let itemsHtml = '';
        order.order.items.forEach(item => {
            itemsHtml += `
                <div class="row mb-3">
                    <div class="col-2">
                        <img src="${item.image || 'images/default-preview.jpg'}" 
                             alt="${item.name}" class="img-fluid rounded item-image"
                             onerror="this.src='images/default-preview.jpg'">
                    </div>
                    <div class="col-6">
                        <h6>${item.name}</h6>
                        <p class="text-muted mb-1">Quantity: ${item.quantity}</p>
                        ${item.type === 'custom' ? `
                            <div class="custom-details">
                                <p class="mb-1"><small>Cupcake: ${item.details.cupcakeFlavor} (${item.details.cupcakeColor})</small></p>
                                <p class="mb-1"><small>Icing: ${item.details.icingFlavor} (${item.details.icingColor})</small></p>
                                ${item.details.specialDecorations ? `
                                    <p class="mb-1"><small>Decorations: ${item.details.specialDecorations}</small></p>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    <div class="col-2 text-end">
                        <span>$${item.price.toFixed(2)}</span>
                    </div>
                    <div class="col-2 text-end">
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                </div>
            `;
        });

        // Create timeline HTML based on status
        let timelineHtml = '';
        const statusTimeline = [
            { status: 'Order Placed', date: orderDate, completed: true },
            { status: 'Order Confirmed', date: new Date(orderDate.getTime() + 3600000), completed: true },
            { status: 'Processing', date: null, completed: false, active: order.order.status === 'processing' },
            { status: 'Completed', date: null, completed: order.order.status === 'completed', active: false },
            { status: 'Cancelled', date: null, completed: order.order.status === 'cancelled', active: false }
        ];

        statusTimeline.forEach(step => {
            if (step.completed || step.active) {
                timelineHtml += `
                    <div class="timeline-item ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}">
                        <div class="timeline-icon">
                            <i class="fas ${step.completed ? 'fa-check' : (step.active ? 'fa-spinner fa-spin' : 'fa-circle')}" aria-hidden="true"></i>
                        </div>
                        <div class="timeline-content">
                            <h5>${step.status}</h5>
                            <p>${step.date ? step.date.toLocaleString() : ''}</p>
                        </div>
                    </div>
                `;
            }
        });

        // Set modal content
        document.getElementById('orderModalBody').innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <h3 class="h6">Customer Information</h3>
                    <p><strong>Name:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
                    <p><strong>Email:</strong> ${order.customer.email}</p>
                    <p><strong>Phone:</strong> ${order.customer.phone || 'N/A'}</p>
                    <p><strong>Type:</strong> ${order.customer.isGuest ? 'Guest' : 'Registered'}</p>
                </div>
                <div class="col-md-6">
                    <h3 class="h6">Delivery Information</h3>
                    <p><strong>Type:</strong> ${order.delivery.type}</p>
                    ${order.delivery.type === 'delivery' ? `
                        <p><strong>Address:</strong> ${order.delivery.address}</p>
                        <p><strong>City:</strong> ${order.delivery.city}</p>
                    ` : ''}
                    <p><strong>Date Needed:</strong> ${deliveryDate.toLocaleDateString()}</p>
                    <p><strong>Time Needed:</strong> ${order.order.timeNeeded || 'Anytime'}</p>
                </div>
            </div>

            <div class="mb-4">
                <h3 class="h6">Order Items</h3>
                ${itemsHtml}
                <div class="row mt-3">
                    <div class="col-8"></div>
                    <div class="col-2 text-end">
                        <p><strong>Subtotal:</strong></p>
                        <p><strong>Tax:</strong></p>
                        <p><strong>Delivery Fee:</strong></p>
                        <p><strong>Total:</strong></p>
                    </div>
                    <div class="col-2 text-end">
                        <p>$${this.calculateOrderTotal(order.order.items).toFixed(2)}</p>
                        <p>$${(this.calculateOrderTotal(order.order.items) * 0.1).toFixed(2)}</p>
                        <p>$${order.delivery.type === 'delivery' ? '5.00' : '0.00'}</p>
                        <p>$${(this.calculateOrderTotal(order.order.items) * 1.1 + (order.delivery.type === 'delivery' ? 5 : 0)).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <h3 class="h6">Order Status</h3>
                <div class="timeline">
                    ${timelineHtml}
                </div>
            </div>

            <div class="mb-3">
                <h3 class="h6">Special Instructions</h3>
                <p>${order.order.specialInstructions || 'None'}</p>
            </div>
        `;

        modal.show();
    },

    // Edit order
    editOrder(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find(o => o.orderId === orderId);

        if (!order) {
            this.showNotification('Order not found', 'error');
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        document.getElementById('editOrderModalTitle').textContent = `Edit Order #${order.orderId}`;

        // Set form values
        document.getElementById('editOrderStatus').value = order.order.status;
        document.getElementById('editOrderDate').value = new Date(order.order.orderDate).toISOString().split('T')[0];
        document.getElementById('editDeliveryDate').value = order.order.dateNeeded;
        document.getElementById('editDeliveryTime').value = order.order.timeNeeded || '';
        document.getElementById('editSpecialInstructions').value = order.order.specialInstructions || '';

        // Store order ID for saving
        document.getElementById('editOrderModal').setAttribute('data-order-id', orderId);

        modal.show();
    },

    // Save order changes
    saveOrderChanges() {
        const orderId = document.getElementById('editOrderModal').getAttribute('data-order-id');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderIndex = orders.findIndex(o => o.orderId === orderId);

        if (orderIndex === -1) {
            this.showNotification('Order not found', 'error');
            return;
        }

        // Update order
        orders[orderIndex].order.status = document.getElementById('editOrderStatus').value;
        orders[orderIndex].order.orderDate = document.getElementById('editOrderDate').value;
        orders[orderIndex].order.dateNeeded = document.getElementById('editDeliveryDate').value;
        orders[orderIndex].order.timeNeeded = document.getElementById('editDeliveryTime').value || null;
        orders[orderIndex].order.specialInstructions = document.getElementById('editSpecialInstructions').value || null;

        // Save to localStorage
        localStorage.setItem('orders', JSON.stringify(orders));

        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide();

        // Refresh UI
        this.loadAllOrders();
        this.loadRecentOrders();
        this.loadDashboardData();

        this.showNotification('Order updated successfully', 'success');
    },

    // Calculate order total
    calculateOrderTotal(items) {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // Show notification
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 150);
        }, 5000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminManager.init();
});
