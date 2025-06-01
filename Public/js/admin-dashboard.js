const AdminManager = {
    apiBaseUrl: '/api/admin',

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.loadRecentOrders();
        this.showSection('dashboard');
    },

    setupEventListeners() {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    if (response.ok) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = 'login.html';
                    } else {
                        this.showNotification('Logout failed. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    this.showNotification('Logout error. Please try again.', 'error');
                }
            });
        }

        // Customer management buttons
        const addCustomerBtn = document.getElementById('addCustomerBtn');
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => {
                this.openCustomerModal();
            });
        }

        const saveCustomerBtn = document.getElementById('saveCustomerBtn');
        if (saveCustomerBtn) {
            saveCustomerBtn.addEventListener('click', () => {
                this.saveCustomer();
            });
        }

        // Export customers button removed as requested

        // Inventory management buttons
        const addInventoryBtn = document.getElementById('addInventoryBtn');
        if (addInventoryBtn) {
            addInventoryBtn.addEventListener('click', () => {
                this.openInventoryModal();
            });
        }

        const saveInventoryBtn = document.getElementById('saveInventoryBtn');
        if (saveInventoryBtn) {
            saveInventoryBtn.addEventListener('click', () => {
                this.saveInventoryItem();
            });
        }

        const lowStockBtn = document.getElementById('lowStockBtn');
        if (lowStockBtn) {
            lowStockBtn.addEventListener('click', () => {
                this.showLowStockItems();
            });
        }

        // Export inventory button removed as requested

        const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
        if (refreshInventoryBtn) {
            refreshInventoryBtn.addEventListener('click', () => {
                this.loadInventory();
            });
        }

        const timePeriod = document.getElementById('timePeriod');
        if (timePeriod) {
            timePeriod.addEventListener('change', () => {
                this.loadDashboardData();
            });
        }

        const orderSearch = document.getElementById('orderSearch');
        if (orderSearch) {
            orderSearch.addEventListener('input', () => {
                this.filterOrders();
            });
        }

        const orderStatusFilter = document.getElementById('orderStatusFilter');
        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', () => {
                this.filterOrders();
            });
        }

        const orderDateFilter = document.getElementById('orderDateFilter');
        if (orderDateFilter) {
            orderDateFilter.addEventListener('change', () => {
                this.filterOrders();
            });
        }

        const saveOrderBtn = document.getElementById('saveOrderBtn');
        if (saveOrderBtn) {
            saveOrderBtn.addEventListener('click', () => {
                this.saveOrderChanges();
            });
        }
    },

    showSection(section) {
        document.querySelectorAll('#mainContent > section').forEach(sec => {
            sec.classList.add('d-none');
        });

        const sectionEl = document.getElementById(section + 'Section');
        if (sectionEl) {
            sectionEl.classList.remove('d-none');
        }

        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector('.sidebar .nav-link[data-section="' + section + '"]');
        if (activeLink) {
            activeLink.classList.add('active');
        }

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
            case 'contact-messages':
                this.loadContactMessages();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    },

    async loadDashboardData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch(this.apiBaseUrl + '/dashboard-stats', {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats: ' + response.statusText);
            }
            const data = await response.json();

            function updateElement(id, value) {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            }

            function updateChangeElement(id, value, prefix) {
                prefix = prefix || '';
                const element = document.getElementById(id);
                if (element) {
                    element.innerHTML =
                        '<i class="fas ' + (value >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger') + '"></i> ' +
                        prefix + Math.abs(value) + '% from ' + (prefix ? 'previous period' : 'yesterday');
                }
            }

            updateElement('totalOrders', data.totalOrders || 0);
            updateChangeElement('ordersChange', data.ordersChange || 0);
            updateElement('totalRevenue', '$' + ((data.totalRevenue || 0).toFixed(2)));
            updateChangeElement('revenueChange', data.revenueChange || 0);
            updateElement('newCustomers', data.newCustomers || 0);
            updateChangeElement('customersChange', data.customersChange || 0);
            updateElement('growthRate', (data.customersChange || 0) + '%');
            updateChangeElement('growthChange', data.customersChange || 0, '');

            this.updatePopularProducts(data.popularProducts || []);
            this.updateCharts(data.orders || []);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data: ' + error.message, 'error');
        }
    },

    updatePopularProducts(products) {
        const tbody = document.querySelector('#popularProductsTable tbody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4">No popular products</td></tr>';
            return;
        }

        let html = '';
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            html += '<tr><td>' + product.name + '</td><td>' + product.totalQuantity + '</td><td>$' + (product.totalRevenue ? product.totalRevenue.toFixed(2) : 'N/A') + '</td></tr>';
        }
        tbody.innerHTML = html;
    },

    updateCharts(orders) {
        const salesCtx = document.getElementById('salesChart');
        if (!salesCtx) return;
        const salesCtx2d = salesCtx.getContext('2d');

        const dates = [];
        const salesData = [];
        const orderCounts = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            let daySales = 0;
            let dayOrders = 0;
            for (let j = 0; j < orders.length; j++) {
                const order = orders[j];
                if (new Date(order.createdAt).toISOString().split('T')[0] === dateStr) {
                    if (order.status === 'completed') {
                        daySales += this.calculateOrderTotal(order.items);
                    }
                    dayOrders++;
                }
            }
            salesData.push(daySales);
            orderCounts.push(dayOrders);
        }

        if (this.salesChart && typeof this.salesChart.destroy === 'function') {
            this.salesChart.destroy();
        }

        this.salesChart = new Chart(salesCtx2d, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Revenue ($)',
                    data: salesData,
                    backgroundColor: 'rgba(255, 107, 139, 0.1)',
                    borderColor: 'rgba(255, 107, 139, 1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y',
                    pointBackgroundColor: 'rgba(255, 107, 139, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Orders Count',
                    data: orderCounts,
                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                    borderColor: 'rgba(6, 214, 160, 1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false,
                    yAxisID: 'y1',
                    pointBackgroundColor: 'rgba(6, 214, 160, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 0) {
                                    label += '$' + context.parsed.y.toFixed(2);
                                } else {
                                    label += context.parsed.y + ' orders';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Orders'
                        },
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    },

    async loadRecentOrders() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('/api/orders?limit=5', {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch recent orders: ' + response.statusText);
            }
            const orders = await response.json();

            const tbody = document.querySelector('#recentOrdersTable tbody');
            if (!tbody) return;

            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No recent orders</td></tr>';
                return;
            }

            let html = '';
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                const orderDate = new Date(order.createdAt);
                html += '<tr>' +
                    '<td class="order-id">#' + order._id + '</td>' +
                    '<td>' + (order.customer && order.customer.firstName ? order.customer.firstName : 'N/A') + ' ' + (order.customer && order.customer.lastName ? order.customer.lastName : '') + '</td>' +
                    '<td>' + orderDate.toLocaleDateString() + '</td>' +
                    '<td>$' + this.calculateOrderTotal(order.items).toFixed(2) + '</td>' +
                    '<td><span class="badge badge-' + order.status + '">' + order.status + '</span></td>' +
                    '<td><button class="btn btn-sm btn-outline-primary view-order" data-id="' + order._id + '">' +
                    '<i class="fas fa-eye"></i></button></td>' +
                    '</tr>';
            }
            tbody.innerHTML = html;

            const buttons = document.querySelectorAll('.view-order');
            for (let j = 0; j < buttons.length; j++) {
                buttons[j].addEventListener('click', () => {
                    this.viewOrderDetails(buttons[j].getAttribute('data-id'));
                });
            }
        } catch (error) {
            console.error('Error loading recent orders:', error);
            this.showNotification('Error loading recent orders: ' + error.message, 'error');
        }
    },

    async loadAllOrders() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('/api/orders', {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch orders: ' + response.statusText);
            }
            const orders = await response.json();

            const tbody = document.querySelector('#ordersTable tbody');
            if (!tbody) return;

            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No orders found</td></tr>';
                return;
            }

            let html = '';
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                const orderDate = new Date(order.createdAt);
                html += '<tr>' +
                    '<td class="order-id">#' + order._id + '</td>' +
                    '<td>' + (order.customer && order.customer.firstName ? order.customer.firstName : 'N/A') + ' ' + (order.customer && order.customer.lastName ? order.customer.lastName : '') + '</td>' +
                    '<td>' + orderDate.toLocaleDateString() + '</td>' +
                    '<td>' + order.items.reduce((total, item) => total + item.quantity, 0) + '</td>' +
                    '<td>$' + this.calculateOrderTotal(order.items).toFixed(2) + '</td>' +
                    '<td><span class="badge badge-' + order.status + '">' + order.status + '</span></td>' +
                    '<td>' +
                    '<button class="btn btn-sm btn-outline-primary view-order" data-id="' + order._id + '">' +
                    '<i class="fas fa-eye"></i></button> ' +
                    '<button class="btn btn-sm btn-outline-secondary edit-order" data-id="' + order._id + '">' +
                    '<i class="fas fa-edit"></i></button>' +
                    '</td>' +
                    '</tr>';
            }
            tbody.innerHTML = html;

            const viewButtons = document.querySelectorAll('.view-order');
            for (let j = 0; j < viewButtons.length; j++) {
                viewButtons[j].addEventListener('click', () => {
                    this.viewOrderDetails(viewButtons[j].getAttribute('data-id'));
                });
            }

            const editButtons = document.querySelectorAll('.edit-order');
            for (let k = 0; k < editButtons.length; k++) {
                editButtons[k].addEventListener('click', () => {
                    this.editOrder(editButtons[k].getAttribute('data-id'));
                });
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Error loading orders: ' + error.message, 'error');
        }
    },

    filterOrders() {
        const searchTerm = (document.getElementById('orderSearch') && document.getElementById('orderSearch').value.toLowerCase()) || '';
        const statusFilter = (document.getElementById('orderStatusFilter') && document.getElementById('orderStatusFilter').value) || 'all';
        const dateFilter = (document.getElementById('orderDateFilter') && document.getElementById('orderDateFilter').value) || 'all';

        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthAgoStr = monthAgo.toISOString().split('T')[0];

        const tbody = document.querySelector('#ordersTable tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.forEach(row => {
            const orderId = (row.querySelector('.order-id') && row.querySelector('.order-id').textContent.toLowerCase()) || '';
            const customerName = (row.children[1] && row.children[1].textContent.toLowerCase()) || '';
            const orderDate = new Date(row.children[2] ? row.children[2].textContent : '').toISOString().split('T')[0];
            const status = (row.children[5] && row.children[5].textContent.toLowerCase()) || '';

            let show = true;

            if (statusFilter !== 'all' && status !== statusFilter) {
                show = false;
            }

            if (dateFilter === 'today' && orderDate !== today) {
                show = false;
            }
            if (dateFilter === 'week' && orderDate < weekAgo) {
                show = false;
            }
            if (dateFilter === 'month' && orderDate < monthAgoStr) {
                show = false;
            }

            if (searchTerm && !orderId.includes(searchTerm) && !customerName.includes(searchTerm)) {
                show = false;
            }

            row.style.display = show ? '' : 'none';
        });
    },

    async viewOrderDetails(orderId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('/api/orders/' + orderId, {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch order details: ' + response.statusText);
            }
            const order = await response.json();

            const modal = new bootstrap.Modal(document.getElementById('orderModal'));
            document.getElementById('orderModalTitle').textContent = 'Order #' + order._id;

            const orderDate = new Date(order.createdAt);
            const deliveryDate = new Date((order.deliveryInfo && order.deliveryInfo.deliveryDate) || order.dateNeeded);

            let itemsHtml = '';
            for (let i = 0; i < order.items.length; i++) {
                const item = order.items[i];
                itemsHtml += '<div class="row mb-3">' +
                    '<div class="col-2">' +
                    '<img src="' + (item.image || 'images/default-preview.jpg') + '" alt="' + item.name + '" class="img-fluid rounded item-image" onerror="this.src=\'images/default-preview.jpg\'">' +
                    '</div>' +
                    '<div class="col-6">' +
                    '<h6>' + item.name + '</h6>' +
                    '<p class="text-muted mb-1">Quantity: ' + item.quantity + '</p>';
                if (item.type === 'custom') {
                    itemsHtml += '<div class="custom-details">' +
                        '<p class="mb-1"><small>Cupcake: ' + item.details.cupcakeFlavor + ' (' + item.details.cupcakeColor + ')</small></p>' +
                        '<p class="mb-1"><small>Icing: ' + item.details.icingFlavor + ' (' + item.details.icingColor + ')</small></p>';
                    if (item.details.specialDecorations) {
                        itemsHtml += '<p class="mb-1"><small>Decorations: ' + item.details.specialDecorations + '</small></p>';
                    }
                    itemsHtml += '</div>';
                }
                itemsHtml += '</div>' +
                    '<div class="col-2 text-end"><span>$' + item.price.toFixed(2) + '</span></div>' +
                    '<div class="col-2 text-end"><span>$' + (item.price * item.quantity).toFixed(2) + '</span></div>' +
                    '</div>';
            }

            let timelineHtml = '';
            const statusTimeline = [
                { status: 'Order Placed', date: orderDate, completed: true },
                { status: 'Order Confirmed', date: new Date(orderDate.getTime() + 3600000), completed: true },
                { status: 'Processing', date: null, completed: false, active: order.status === 'processing' },
                { status: 'Completed', date: null, completed: order.status === 'completed', active: false },
                { status: 'Cancelled', date: null, completed: order.status === 'cancelled', active: false }
            ];

            for (let i = 0; i < statusTimeline.length; i++) {
                const step = statusTimeline[i];
                if (step.completed || step.active) {
                    timelineHtml += '<div class="timeline-item ' + (step.completed ? 'completed' : '') + ' ' + (step.active ? 'active' : '') + '">' +
                        '<div class="timeline-icon">' +
                        '<i class="fas ' + (step.completed ? 'fa-check' : (step.active ? 'fa-spinner fa-spin' : 'fa-circle')) + '" aria-hidden="true"></i>' +
                        '</div>' +
                        '<div class="timeline-content">' +
                        '<h5>' + step.status + '</h5>' +
                        '<p>' + (step.date ? step.date.toLocaleString() : '') + '</p>' +
                        '</div>' +
                        '</div>';
                }
            }

            document.getElementById('orderModalBody').innerHTML =
                '<div class="row mb-4">' +
                '<div class="col-md-6">' +
                '<h3 class="h6">Customer Information</h3>' +
                '<p><strong>Name:</strong> ' + (order.customer && order.customer.firstName ? order.customer.firstName : 'N/A') + ' ' + (order.customer && order.customer.lastName ? order.customer.lastName : '') + '</p>' +
                '<p><strong>Email:</strong> ' + (order.customer && order.customer.email ? order.customer.email : 'N/A') + '</p>' +
                '<p><strong>Phone:</strong> ' + (order.customer && order.customer.phone ? order.customer.phone : 'N/A') + '</p>' +
                '<p><strong>Type:</strong> ' + (order.customer && order.customer.isGuest ? 'Guest' : 'Registered') + '</p>' +
                '</div>' +
                '<div class="col-md-6">' +
                '<h3 class="h6">Delivery Information</h3>' +
                '<p><strong>Type:</strong> ' + ((order.deliveryInfo && order.deliveryInfo.method) || 'N/A') + '</p>';

            if (order.deliveryInfo && order.deliveryInfo.method === 'delivery') {
                document.getElementById('orderModalBody').innerHTML +=
                    '<p><strong>Address:</strong> ' + order.deliveryInfo.address + '</p>' +
                    '<p><strong>City:</strong> ' + order.deliveryInfo.city + '</p>';
            }

            document.getElementById('orderModalBody').innerHTML +=
                '<p><strong>Date Needed:</strong> ' + deliveryDate.toLocaleDateString() + '</p>' +
                '<p><strong>Time Needed:</strong> ' + (order.timeNeeded || 'Anytime') + '</p>' +
                '</div>' +
                '</div>' +

                '<div class="mb-4">' +
                '<h3 class="h6">Order Items</h3>' +
                itemsHtml +
                '<div class="row mt-3">' +
                '<div class="col-8"></div>' +
                '<div class="col-2 text-end">' +
                '<p><strong>Subtotal:</strong></p>' +
                '<p>$' + this.calculateOrderTotal(order.items).toFixed(2) + '</p>' +
                '<p><strong>Tax:</strong></p>' +
                '<p>$' + (this.calculateOrderTotal(order.items) * 0.1).toFixed(2) + '</p>' +
                '<p><strong>Delivery Fee:</strong></p>' +
                '<p>$' + ((order.deliveryInfo && order.deliveryInfo.method === 'delivery') ? '5.00' : '0.00') + '</p>' +
                '<p><strong>Total:</strong></p>' +
                '<p>$' + ((this.calculateOrderTotal(order.items) * 1.1) + ((order.deliveryInfo && order.deliveryInfo.method === 'delivery') ? 5 : 0)).toFixed(2) + '</p>' +
                '</div>' +
                '</div>' +
                '</div>' +

                '<div class="mb-3">' +
                '<h3 class="h6">Special Instructions</h3>' +
                '<p>' + (order.specialInstructions || 'None') + '</p>' +
                '</div>';

            modal.show();
        } catch (error) {
            console.error('Error fetching order details:', error);
            this.showNotification('Error fetching order details: ' + error.message, 'error');
        }
    },

    async editOrder(orderId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/orders/' + orderId, {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }

            const orderData = await response.json();
            const order = orderData.data || orderData;

            // Show edit order modal
            this.showEditOrderModal(order);
        } catch (error) {
            console.error('Error loading order for edit:', error);
            this.showNotification('Error loading order details: ' + error.message, 'error');
        }
    },

    showEditOrderModal(order) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('editOrderModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'editOrderModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="editOrderModalTitle">Edit Order</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="editOrderModalBody">
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const modalTitle = document.getElementById('editOrderModalTitle');
        const modalBody = document.getElementById('editOrderModalBody');

        modalTitle.textContent = `Edit Order #${order.orderNumber || order._id}`;

        modalBody.innerHTML = `
            <form id="editOrderForm">
                <input type="hidden" id="editOrderId" value="${order._id}">

                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="editOrderStatus" class="form-label">Order Status</label>
                        <select class="form-select" id="editOrderStatus" required>
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="editPaymentMethod" class="form-label">Payment Method</label>
                        <select class="form-select" id="editPaymentMethod">
                            <option value="cash" ${order.paymentMethod === 'cash' ? 'selected' : ''}>Cash</option>
                            <option value="card" ${order.paymentMethod === 'card' ? 'selected' : ''}>Card</option>
                            <option value="online" ${order.paymentMethod === 'online' ? 'selected' : ''}>Online</option>
                        </select>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <label for="editDeliveryMethod" class="form-label">Delivery Method</label>
                        <select class="form-select" id="editDeliveryMethod">
                            <option value="pickup" ${order.deliveryInfo?.method === 'pickup' ? 'selected' : ''}>Pickup</option>
                            <option value="delivery" ${order.deliveryInfo?.method === 'delivery' ? 'selected' : ''}>Delivery</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="editTotalAmount" class="form-label">Total Amount</label>
                        <input type="number" step="0.01" class="form-control" id="editTotalAmount"
                               value="${order.totalAmount || 0}">
                    </div>
                </div>

                <div class="d-flex justify-content-between">
                    <div>
                        <button type="button" class="btn btn-success me-2" onclick="AdminManager.acceptOrder('${order._id}')">
                            <i class="fas fa-check"></i> Accept Order
                        </button>
                        <button type="button" class="btn btn-danger" onclick="AdminManager.showCancelOrderModal('${order._id}')">
                            <i class="fas fa-times"></i> Cancel Order
                        </button>
                    </div>
                    <div>
                        <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </div>
            </form>
        `;

        // Add form submit handler
        document.getElementById('editOrderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOrderChanges();
        });

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    },

    async saveOrderChanges() {
        try {
            const orderId = document.getElementById('editOrderId').value;
            const token = localStorage.getItem('token');

            const updateData = {
                status: document.getElementById('editOrderStatus').value,
                paymentMethod: document.getElementById('editPaymentMethod').value,
                totalAmount: parseFloat(document.getElementById('editTotalAmount').value),
                deliveryInfo: {
                    method: document.getElementById('editDeliveryMethod').value
                }
            };

            const response = await fetch('/api/orders/' + orderId, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error('Failed to update order');
            }

            this.showNotification('Order updated successfully', 'success');

            // Close modal and refresh orders
            const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
            modal.hide();

            // Refresh the current view
            if (document.getElementById('ordersSection') && !document.getElementById('ordersSection').classList.contains('d-none')) {
                this.loadAllOrders();
            } else {
                this.loadRecentOrders();
            }

        } catch (error) {
            console.error('Error saving order changes:', error);
            this.showNotification('Error saving order changes: ' + error.message, 'error');
        }
    },



    calculateOrderTotal(items) {
        let total = 0;
        for (let i = 0; i < items.length; i++) {
            total += items[i].price * items[i].quantity;
        }
        return total;
    },

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-' + type + ' alert-dismissible fade show position-fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 150);
        }, 5000);
    },

    async loadProducts() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }
            const response = await fetch('/api/products', {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch products: ' + response.statusText);
            }
            const products = await response.json();
            console.log('Loaded products:', products);
            // TODO: Update the UI with products data
            this.showNotification('Products loaded successfully (UI update not implemented)', 'success');
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Error loading products: ' + error.message, 'error');
        }
    },

    async loadCustomers() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }
            const response = await fetch('/api/customers', {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch customers: ' + response.statusText);
            }
            const customers = await response.json();
            console.log('Loaded customers:', customers);
            this.displayCustomers(customers);
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showNotification('Error loading customers: ' + error.message, 'error');
        }
    },

    displayCustomers(customers) {
        const tbody = document.querySelector('#customersTable tbody');
        if (!tbody) return;

        // Update customer statistics
        this.updateCustomerStats(customers);

        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No customers found</td></tr>';
            return;
        }

        let html = '';
        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            const joinDate = new Date(customer.createdAt);
            const customerType = customer.isGuest ? 'Guest' : 'Registered';
            const orderCount = customer.orderCount || 0;
            const totalSpent = customer.totalSpent || 0;

            html += '<tr>' +
                '<td><input type="checkbox" class="form-check-input customer-checkbox" data-id="' + customer._id + '"></td>' +
                '<td>' +
                '<div class="d-flex align-items-center">' +
                '<div class="avatar-circle me-2">' + (customer.firstName ? customer.firstName.charAt(0).toUpperCase() : 'U') + '</div>' +
                '<div>' +
                '<div class="fw-semibold">' + (customer.firstName || 'N/A') + ' ' + (customer.lastName || '') + '</div>' +
                '<small class="text-muted">ID: ' + customer._id.substring(0, 8) + '</small>' +
                '</div>' +
                '</div>' +
                '</td>' +
                '<td>' +
                '<div>' + (customer.email || 'N/A') + '</div>' +
                (customer.emailVerified ? '<small class="text-success"><i class="fas fa-check-circle"></i> Verified</small>' : '<small class="text-muted">Not verified</small>') +
                '</td>' +
                '<td>' + (customer.phone || 'N/A') + '</td>' +
                '<td>' + joinDate.toLocaleDateString() + '</td>' +
                '<td><span class="badge ' + (customer.isGuest ? 'bg-secondary' : 'bg-primary') + '">' + customerType + '</span></td>' +
                '<td class="text-center">' + orderCount + '</td>' +
                '<td class="text-center">$' + totalSpent.toFixed(2) + '</td>' +
                '<td>' +
                '<div class="btn-group" role="group">' +
                '<button class="btn btn-sm btn-outline-primary view-customer" data-id="' + customer._id + '" title="View Details">' +
                '<i class="fas fa-eye"></i></button>' +
                '<button class="btn btn-sm btn-outline-secondary edit-customer" data-id="' + customer._id + '" title="Edit">' +
                '<i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-outline-info email-customer" data-id="' + customer._id + '" title="Send Email">' +
                '<i class="fas fa-envelope"></i></button>' +
                '</div>' +
                '</td>' +
                '</tr>';
        }
        tbody.innerHTML = html;

        // Add event listeners for customer actions
        this.attachCustomerEventListeners();
    },

    updateCustomerStats(customers, summary) {
        if (summary) {
            // Use summary data if available
            document.getElementById('totalCustomersCount').textContent = summary.totalCustomers || 0;
            document.getElementById('newCustomersMonth').textContent = summary.newThisMonth || 0;
            document.getElementById('registeredCustomers').textContent = summary.registeredCustomers || 0;
            document.getElementById('guestCustomers').textContent = summary.guestCustomers || 0;
        } else {
            // Fallback to calculating from customers array
            const totalCount = customers.length;
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const newThisMonth = customers.filter(customer => {
                const joinDate = new Date(customer.createdAt);
                return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
            }).length;

            const registeredCount = customers.filter(customer => !customer.isGuest).length;
            const guestCount = customers.filter(customer => customer.isGuest).length;

            document.getElementById('totalCustomersCount').textContent = totalCount;
            document.getElementById('newCustomersMonth').textContent = newThisMonth;
            document.getElementById('registeredCustomers').textContent = registeredCount;
            document.getElementById('guestCustomers').textContent = guestCount;
        }
    },

    attachCustomerEventListeners() {
        // View customer details
        const viewButtons = document.querySelectorAll('.view-customer');
        for (let j = 0; j < viewButtons.length; j++) {
            viewButtons[j].addEventListener('click', () => {
                this.viewCustomerDetails(viewButtons[j].getAttribute('data-id'));
            });
        }

        // Edit customer
        const editButtons = document.querySelectorAll('.edit-customer');
        for (let k = 0; k < editButtons.length; k++) {
            editButtons[k].addEventListener('click', () => {
                this.editCustomer(editButtons[k].getAttribute('data-id'));
            });
        }

        // Email customer
        const emailButtons = document.querySelectorAll('.email-customer');
        for (let l = 0; l < emailButtons.length; l++) {
            emailButtons[l].addEventListener('click', () => {
                this.emailCustomer(emailButtons[l].getAttribute('data-id'));
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCustomers');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                const checkboxes = document.querySelectorAll('.customer-checkbox');
                for (let m = 0; m < checkboxes.length; m++) {
                    checkboxes[m].checked = selectAllCheckbox.checked;
                }
            });
        }
    },

    async viewCustomerDetails(customerId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('/api/customers/admin/' + customerId, {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch customer details: ' + response.statusText);
            }
            const customerData = await response.json();
            const customer = customerData.data || customerData;

            // Show customer details in modal
            this.showCustomerDetailsModal(customer);
        } catch (error) {
            console.error('Error fetching customer details:', error);
            this.showNotification('Error fetching customer details: ' + error.message, 'error');
        }
    },

    showCustomerDetailsModal(customer) {
        const modal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
        const modalBody = document.getElementById('customerDetailsModalBody');
        const modalTitle = document.getElementById('customerDetailsModalTitle');

        modalTitle.textContent = `${customer.firstName || 'N/A'} ${customer.lastName || ''}`;

        const joinDate = new Date(customer.createdAt);
        const lastLogin = customer.lastLogin ? new Date(customer.lastLogin) : null;

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Personal Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Name:</strong></div>
                                <div class="col-sm-8">${customer.firstName || 'N/A'} ${customer.lastName || ''}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Email:</strong></div>
                                <div class="col-sm-8">${customer.email || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Phone:</strong></div>
                                <div class="col-sm-8">${customer.phone || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Type:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge ${customer.isGuest ? 'bg-secondary' : 'bg-primary'}">
                                        ${customer.isGuest ? 'Guest' : 'Registered'}
                                    </span>
                                </div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Joined:</strong></div>
                                <div class="col-sm-8">${joinDate.toLocaleDateString()}</div>
                            </div>
                            ${lastLogin ? `
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Last Login:</strong></div>
                                <div class="col-sm-8">${lastLogin.toLocaleDateString()}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Order Statistics</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Total Orders:</strong></div>
                                <div class="col-sm-6">${customer.orderCount || 0}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Total Spent:</strong></div>
                                <div class="col-sm-6">$${(customer.totalSpent || 0).toFixed(2)}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Avg Order Value:</strong></div>
                                <div class="col-sm-6">$${customer.orderCount > 0 ? ((customer.totalSpent || 0) / customer.orderCount).toFixed(2) : '0.00'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Status:</strong></div>
                                <div class="col-sm-6">
                                    <span class="badge ${customer.active !== false ? 'bg-success' : 'bg-danger'}">
                                        ${customer.active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Recent Orders</h5>
                        </div>
                        <div class="card-body">
                            <p class="text-muted">Order history will be loaded here...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.show();
    },

    editCustomer(customerId) {
        // Open customer modal for editing
        this.openCustomerModal(customerId);
    },

    emailCustomer(customerId) {
        this.showNotification('Email customer feature will be implemented soon', 'info');
    },

    openCustomerModal(customerId = null) {
        const modal = new bootstrap.Modal(document.getElementById('customerModal'));
        const modalTitle = document.getElementById('customerModalTitle');
        const form = document.getElementById('customerForm');

        if (customerId) {
            modalTitle.textContent = 'Edit Customer';
            // Load customer data for editing
            this.loadCustomerForEdit(customerId);
        } else {
            modalTitle.textContent = 'Add Customer';
            form.reset();
        }

        modal.show();
    },

    async loadCustomerForEdit(customerId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/customers/admin/' + customerId, {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch customer details');
            }

            const customerData = await response.json();
            const customer = customerData.data || customerData;

            // Populate form fields
            document.getElementById('customerFirstName').value = customer.firstName || '';
            document.getElementById('customerLastName').value = customer.lastName || '';
            document.getElementById('customerEmail').value = customer.email || '';
            document.getElementById('customerPhone').value = customer.phone || '';
            document.getElementById('customerAddress').value = customer.address || '';
            document.getElementById('customerBirthday').value = customer.birthday ? customer.birthday.split('T')[0] : '';

            // Store customer ID for updating
            document.getElementById('customerForm').setAttribute('data-customer-id', customerId);
        } catch (error) {
            console.error('Error loading customer for edit:', error);
            this.showNotification('Error loading customer details: ' + error.message, 'error');
        }
    },

    async loadContactMessages() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }
            const response = await fetch('/api/contact', {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch contact messages: ' + response.statusText);
            }
            const messages = await response.json();
            console.log('Loaded contact messages:', messages);
            this.displayContactMessages(messages);
        } catch (error) {
            console.error('Error loading contact messages:', error);
            this.showNotification('Error loading contact messages: ' + error.message, 'error');
        }
    },

    displayContactMessages(messages) {
        const tbody = document.querySelector('#messagesTable tbody');
        const noMessages = document.getElementById('noMessages');

        if (!tbody) return;

        if (messages.length === 0) {
            tbody.innerHTML = '';
            if (noMessages) noMessages.style.display = 'block';
            return;
        }

        if (noMessages) noMessages.style.display = 'none';

        let html = '';
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const messageDate = new Date(message.createdAt);
            const truncatedMessage = message.message.length > 50 ?
                message.message.substring(0, 50) + '...' : message.message;

            html += '<tr>' +
                '<td>' + (message.name || 'N/A') + '</td>' +
                '<td>' + (message.email || 'N/A') + '</td>' +
                '<td>' + (message.subject || 'N/A') + '</td>' +
                '<td title="' + message.message + '">' + truncatedMessage + '</td>' +
                '<td>' + messageDate.toLocaleDateString() + '</td>' +
                '<td>' +
                '<button class="btn btn-sm btn-outline-primary view-message" data-id="' + message._id + '">' +
                '<i class="fas fa-eye"></i></button> ' +
                '<button class="btn btn-sm btn-outline-danger delete-message" data-id="' + message._id + '">' +
                '<i class="fas fa-trash"></i></button>' +
                '</td>' +
                '</tr>';
        }
        tbody.innerHTML = html;

        // Add event listeners for message actions
        const viewButtons = document.querySelectorAll('.view-message');
        for (let j = 0; j < viewButtons.length; j++) {
            viewButtons[j].addEventListener('click', () => {
                this.viewMessageDetails(viewButtons[j].getAttribute('data-id'), messages);
            });
        }

        const deleteButtons = document.querySelectorAll('.delete-message');
        for (let k = 0; k < deleteButtons.length; k++) {
            deleteButtons[k].addEventListener('click', () => {
                this.deleteMessage(deleteButtons[k].getAttribute('data-id'));
            });
        }
    },

    viewMessageDetails(messageId, messages) {
        const message = messages.find(m => m._id === messageId);
        if (!message) {
            this.showNotification('Message not found', 'error');
            return;
        }

        const messageDate = new Date(message.createdAt);
        this.showNotification(
            'Message from ' + message.name + ' (' + message.email + '):\n' +
            'Subject: ' + message.subject + '\n' +
            'Date: ' + messageDate.toLocaleString() + '\n' +
            'Message: ' + message.message,
            'info'
        );
    },

    async deleteMessage(messageId) {
        if (!confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await fetch('/api/contact/' + messageId, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete message: ' + response.statusText);
            }

            this.showNotification('Message deleted successfully', 'success');
            this.loadContactMessages(); // Reload messages
        } catch (error) {
            console.error('Error deleting message:', error);
            this.showNotification('Error deleting message: ' + error.message, 'error');
        }
    },

    async loadInventory() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }
            const response = await fetch('/api/inventory', {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch inventory: ' + response.statusText);
            }
            const inventory = await response.json();
            console.log('Loaded inventory:', inventory);
            this.displayInventory(inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showNotification('Error loading inventory: ' + error.message, 'error');
        }
    },

    displayInventory(inventory) {
        const tbody = document.querySelector('#inventoryTable tbody');
        if (!tbody) return;

        // Update inventory statistics
        this.updateInventoryStats(inventory);

        if (inventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center py-4">No inventory items found</td></tr>';
            return;
        }

        let html = '';
        for (let i = 0; i < inventory.length; i++) {
            const item = inventory[i];
            const lastUpdated = new Date(item.updatedAt || item.createdAt);
            const lowStock = item.quantity < (item.threshold || 10);
            const outOfStock = item.quantity === 0;
            const costPerUnit = item.costPerUnit || 0;
            const totalValue = item.quantity * costPerUnit;

            let rowClass = '';
            if (outOfStock) rowClass = 'table-danger';
            else if (lowStock) rowClass = 'table-warning';

            html += '<tr class="' + rowClass + '">' +
                '<td><input type="checkbox" class="form-check-input inventory-checkbox" data-id="' + item._id + '"></td>' +
                '<td>' +
                '<div class="d-flex align-items-center">' +
                '<div class="me-2">' +
                (outOfStock ? '<i class="fas fa-times-circle text-danger" title="Out of Stock"></i>' :
                 lowStock ? '<i class="fas fa-exclamation-triangle text-warning" title="Low Stock"></i>' :
                 '<i class="fas fa-check-circle text-success" title="In Stock"></i>') +
                '</div>' +
                '<div>' +
                '<div class="fw-semibold">' + (item.name || 'N/A') + '</div>' +
                '<small class="text-muted">' + (item.description || 'No description') + '</small>' +
                '</div>' +
                '</div>' +
                '</td>' +
                '<td><span class="badge bg-secondary">' + (item.category || 'Uncategorized') + '</span></td>' +
                '<td class="text-center ' + (lowStock ? 'text-danger fw-bold' : outOfStock ? 'text-danger fw-bold' : '') + '">' +
                (item.quantity || 0) + '</td>' +
                '<td>' + (item.unit || 'units') + '</td>' +
                '<td class="text-center">' + (item.threshold || 0) + '</td>' +
                '<td>' + (item.location || 'N/A') + '</td>' +
                '<td class="text-center">$' + costPerUnit.toFixed(2) + '</td>' +
                '<td class="text-center">$' + totalValue.toFixed(2) + '</td>' +
                '<td>' + lastUpdated.toLocaleDateString() + '</td>' +
                '<td>' +
                '<div class="btn-group" role="group">' +
                '<button class="btn btn-sm btn-outline-primary edit-inventory" data-id="' + item._id + '" title="Edit">' +
                '<i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-sm btn-outline-success restock-inventory" data-id="' + item._id + '" title="Restock">' +
                '<i class="fas fa-plus"></i></button>' +
                '<button class="btn btn-sm btn-outline-danger delete-inventory" data-id="' + item._id + '" title="Delete">' +
                '<i class="fas fa-trash"></i></button>' +
                '</div>' +
                '</td>' +
                '</tr>';
        }
        tbody.innerHTML = html;

        // Add event listeners for inventory actions
        this.attachInventoryEventListeners();
    },

    updateInventoryStats(inventory) {
        const totalItems = inventory.length;
        const lowStockItems = inventory.filter(item => item.quantity < (item.threshold || 10) && item.quantity > 0).length;
        const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
        const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.costPerUnit || 0)), 0);

        document.getElementById('totalInventoryItems').textContent = totalItems;
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('outOfStockItems').textContent = outOfStockItems;
        document.getElementById('totalInventoryValue').textContent = '$' + totalValue.toFixed(2);
    },

    attachInventoryEventListeners() {
        // Edit inventory item
        const editButtons = document.querySelectorAll('.edit-inventory');
        for (let j = 0; j < editButtons.length; j++) {
            editButtons[j].addEventListener('click', () => {
                this.editInventoryItem(editButtons[j].getAttribute('data-id'));
            });
        }

        // Restock inventory item
        const restockButtons = document.querySelectorAll('.restock-inventory');
        for (let k = 0; k < restockButtons.length; k++) {
            restockButtons[k].addEventListener('click', () => {
                this.restockInventoryItem(restockButtons[k].getAttribute('data-id'));
            });
        }

        // Delete inventory item
        const deleteButtons = document.querySelectorAll('.delete-inventory');
        for (let l = 0; l < deleteButtons.length; l++) {
            deleteButtons[l].addEventListener('click', () => {
                this.deleteInventoryItem(deleteButtons[l].getAttribute('data-id'));
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllInventory');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                const checkboxes = document.querySelectorAll('.inventory-checkbox');
                for (let m = 0; m < checkboxes.length; m++) {
                    checkboxes[m].checked = selectAllCheckbox.checked;
                }
            });
        }
    },

    editInventoryItem(itemId) {
        this.openInventoryModal(itemId);
    },

    async restockInventoryItem(itemId) {
        const quantity = prompt('Enter quantity to add to stock:');
        if (quantity && !isNaN(quantity) && parseFloat(quantity) > 0) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/inventory/${itemId}/restock`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ amount: parseFloat(quantity) })
                });

                if (!response.ok) {
                    throw new Error('Failed to restock item');
                }

                const result = await response.json();
                this.showNotification(`Successfully added ${quantity} units to stock`, 'success');
                this.loadInventory(); // Refresh inventory display
            } catch (error) {
                console.error('Error restocking item:', error);
                this.showNotification('Error restocking item: ' + error.message, 'error');
            }
        }
    },

    async deleteInventoryItem(itemId) {
        if (!confirm('Are you sure you want to delete this inventory item?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/inventory/${itemId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete inventory item');
            }

            this.showNotification('Inventory item deleted successfully', 'success');
            this.loadInventory(); // Refresh inventory display
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            this.showNotification('Error deleting inventory item: ' + error.message, 'error');
        }
    },

    openInventoryModal(itemId = null) {
        const modal = new bootstrap.Modal(document.getElementById('inventoryModal'));
        const modalTitle = document.getElementById('inventoryModalTitle');
        const form = document.getElementById('inventoryForm');

        if (itemId) {
            modalTitle.textContent = 'Edit Inventory Item';
            this.loadInventoryItemForEdit(itemId);
        } else {
            modalTitle.textContent = 'Add Inventory Item';
            form.reset();
        }

        modal.show();
    },

    async loadInventoryItemForEdit(itemId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/inventory/${itemId}`, {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch inventory item details');
            }

            const itemData = await response.json();
            const item = itemData.data || itemData;

            // Populate form fields
            document.getElementById('inventoryName').value = item.name || '';
            document.getElementById('inventoryCategory').value = item.category || '';
            document.getElementById('inventoryDescription').value = item.description || '';
            document.getElementById('inventoryQuantity').value = item.quantity || 0;
            document.getElementById('inventoryUnit').value = item.unit || '';
            document.getElementById('inventoryThreshold').value = item.threshold || 0;
            document.getElementById('inventoryCostPerUnit').value = item.costPerUnit || 0;
            document.getElementById('inventoryLocation').value = item.location || '';
            document.getElementById('inventorySupplier').value = item.supplier || '';

            // Store item ID for updating
            document.getElementById('inventoryForm').setAttribute('data-item-id', itemId);
        } catch (error) {
            console.error('Error loading inventory item for edit:', error);
            this.showNotification('Error loading inventory item details: ' + error.message, 'error');
        }
    },

    async loadReports() {
        // Set up event listeners for report generation
        const generateReportBtn = document.getElementById('generateReportBtn');
        const reportType = document.getElementById('reportType');
        const dateRange = document.getElementById('dateRange');
        const customDateRange = document.getElementById('customDateRange');

        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        if (dateRange) {
            dateRange.addEventListener('change', () => {
                if (dateRange.value === 'custom') {
                    customDateRange.style.display = 'block';
                } else {
                    customDateRange.style.display = 'none';
                }
            });
        }

        this.showNotification('Reports section loaded. Select a report type and date range to generate a report.', 'info');
    },

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        const dateRange = document.getElementById('dateRange').value;

        if (!reportType) {
            this.showNotification('Please select a report type', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            let startDate, endDate;
            const today = new Date();

            switch (dateRange) {
                case 'today':
                    startDate = new Date(today.setHours(0, 0, 0, 0));
                    endDate = new Date(today.setHours(23, 59, 59, 999));
                    break;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    startDate = new Date(yesterday.setHours(0, 0, 0, 0));
                    endDate = new Date(yesterday.setHours(23, 59, 59, 999));
                    break;
                case 'week':
                    startDate = new Date(today.setDate(today.getDate() - 7));
                    endDate = new Date();
                    break;
                case 'month':
                    startDate = new Date(today.setMonth(today.getMonth() - 1));
                    endDate = new Date();
                    break;
                case 'custom':
                    const startDateInput = document.getElementById('startDate').value;
                    const endDateInput = document.getElementById('endDate').value;
                    if (!startDateInput || !endDateInput) {
                        this.showNotification('Please select both start and end dates', 'error');
                        return;
                    }
                    startDate = new Date(startDateInput);
                    endDate = new Date(endDateInput);
                    break;
                default:
                    startDate = new Date(today.setMonth(today.getMonth() - 1));
                    endDate = new Date();
            }

            let endpoint;
            switch (reportType) {
                case 'sales':
                    endpoint = '/api/reports/sales';
                    break;
                case 'delivery':
                    endpoint = '/api/reports/delivery';
                    break;
                case 'inventory':
                    endpoint = '/api/inventory/reports/usage';
                    break;
                case 'popular':
                    endpoint = '/api/reports/popular-items';
                    break;
                default:
                    endpoint = '/api/reports/sales';
            }

            const response = await fetch(`${endpoint}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate report: ' + response.statusText);
            }

            const reportData = await response.json();
            this.displayReport(reportData, reportType, startDate, endDate);
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Error generating report: ' + error.message, 'error');
        }
    },

    displayReport(reportData, reportType, startDate, endDate) {
        const reportResults = document.querySelector('.report-results');
        const reportTitle = document.getElementById('reportTitle');
        const reportPeriod = document.getElementById('reportPeriod');

        if (reportResults) reportResults.style.display = 'block';
        if (reportTitle) reportTitle.textContent = this.getReportTitle(reportType);
        if (reportPeriod) reportPeriod.textContent = `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

        // Update summary cards
        document.getElementById('reportTotalOrders').textContent = reportData.totalOrders || 0;
        document.getElementById('reportTotalRevenue').textContent = '$' + (reportData.totalRevenue || 0).toFixed(2);
        document.getElementById('avgOrderValue').textContent = '$' + (reportData.avgOrderValue || 0).toFixed(2);
        document.getElementById('itemsSold').textContent = reportData.itemsSold || 0;

        this.showNotification('Report generated successfully', 'success');
    },

    getReportTitle(reportType) {
        switch (reportType) {
            case 'sales': return 'Sales Summary Report';
            case 'delivery': return 'Delivery Schedule Report';
            case 'inventory': return 'Inventory Usage Report';
            case 'popular': return 'Popular Items Report';
            default: return 'Report';
        }
    },

    async loadSettings() {
        // Set up event listeners for settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        // Load current settings
        this.loadCurrentSettings();
        this.showNotification('Settings section loaded', 'info');
    },

    async loadCurrentSettings() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            // For now, just show default values since we don't have a settings API
            const storeName = document.getElementById('storeName');
            const storeEmail = document.getElementById('storeEmail');
            const currency = document.getElementById('currency');

            if (storeName) storeName.value = process.env.BAKERY_NAME || "Sarah's Short Cakes";
            if (storeEmail) storeEmail.value = process.env.EMAIL_FROM || "contact@sarahsshortcakes.com";
            if (currency) currency.value = "USD";

        } catch (error) {
            console.error('Error loading settings:', error);
            this.showNotification('Error loading settings: ' + error.message, 'error');
        }
    },

    async saveSettings() {
        try {
            const storeName = document.getElementById('storeName').value;
            const storeEmail = document.getElementById('storeEmail').value;
            const currency = document.getElementById('currency').value;

            // For now, just show a success message since we don't have a settings API
            this.showNotification('Settings saved successfully! (Note: This is a demo - settings are not actually saved)', 'success');

            console.log('Settings to save:', {
                storeName,
                storeEmail,
                currency
            });

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings: ' + error.message, 'error');
        }
    },

    // Customer Management Functions
    async saveCustomer() {
        try {
            const form = document.getElementById('customerForm');
            const customerId = form.getAttribute('data-customer-id');

            const customerData = {
                firstName: document.getElementById('customerFirstName').value,
                lastName: document.getElementById('customerLastName').value,
                email: document.getElementById('customerEmail').value,
                phone: document.getElementById('customerPhone').value,
                address: document.getElementById('customerAddress').value,
                birthday: document.getElementById('customerBirthday').value
            };

            const token = localStorage.getItem('token');
            const url = customerId ? `/api/customers/${customerId}` : '/api/customers';
            const method = customerId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData)
            });

            if (!response.ok) {
                throw new Error('Failed to save customer');
            }

            this.showNotification(`Customer ${customerId ? 'updated' : 'created'} successfully`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
            this.loadCustomers(); // Refresh customer list
        } catch (error) {
            console.error('Error saving customer:', error);
            this.showNotification('Error saving customer: ' + error.message, 'error');
        }
    },

    // Export customers function removed as requested

    filterCustomers() {
        const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
        const typeFilter = document.getElementById('customerTypeFilter').value;

        const tbody = document.querySelector('#customersTable tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));

        // Filter rows
        rows.forEach(row => {
            if (row.children.length < 9) return; // Skip header or empty rows

            const name = row.children[1].textContent.toLowerCase();
            const email = row.children[2].textContent.toLowerCase();
            const phone = row.children[3].textContent.toLowerCase();
            const type = row.children[5].textContent.toLowerCase();

            let show = true;

            // Search filter
            if (searchTerm && !name.includes(searchTerm) && !email.includes(searchTerm) && !phone.includes(searchTerm)) {
                show = false;
            }

            // Type filter
            if (typeFilter !== 'all' && !type.includes(typeFilter)) {
                show = false;
            }

            row.style.display = show ? '' : 'none';
        });
    },

    // Inventory Management Functions
    async saveInventoryItem() {
        try {
            const form = document.getElementById('inventoryForm');
            const itemId = form.getAttribute('data-item-id');

            const itemData = {
                name: document.getElementById('inventoryName').value,
                category: document.getElementById('inventoryCategory').value,
                description: document.getElementById('inventoryDescription').value,
                quantity: parseFloat(document.getElementById('inventoryQuantity').value),
                unit: document.getElementById('inventoryUnit').value,
                threshold: parseFloat(document.getElementById('inventoryThreshold').value),
                costPerUnit: parseFloat(document.getElementById('inventoryCostPerUnit').value) || 0,
                location: document.getElementById('inventoryLocation').value,
                supplier: document.getElementById('inventorySupplier').value
            };

            const token = localStorage.getItem('token');
            const url = itemId ? `/api/inventory/${itemId}` : '/api/inventory';
            const method = itemId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            });

            if (!response.ok) {
                throw new Error('Failed to save inventory item');
            }

            this.showNotification(`Inventory item ${itemId ? 'updated' : 'created'} successfully`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('inventoryModal')).hide();
            this.loadInventory(); // Refresh inventory list
        } catch (error) {
            console.error('Error saving inventory item:', error);
            this.showNotification('Error saving inventory item: ' + error.message, 'error');
        }
    },

    showLowStockItems() {
        const tbody = document.querySelector('#inventoryTable tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.forEach(row => {
            const isLowStock = row.classList.contains('table-warning') || row.classList.contains('table-danger');
            row.style.display = isLowStock ? '' : 'none';
        });

        this.showNotification('Showing only low stock and out of stock items', 'info');
    },

    // Export inventory function removed as requested

    filterInventory() {
        const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
        const categoryFilter = document.getElementById('inventoryCategoryFilter').value;
        const stockFilter = document.getElementById('inventoryStockFilter').value;

        const tbody = document.querySelector('#inventoryTable tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));

        rows.forEach(row => {
            if (row.children.length < 11) return; // Skip header or empty rows

            const name = row.children[1].textContent.toLowerCase();
            const category = row.children[2].textContent.toLowerCase();
            const isLowStock = row.classList.contains('table-warning');
            const isOutOfStock = row.classList.contains('table-danger');
            const isInStock = !isLowStock && !isOutOfStock;

            let show = true;

            // Search filter
            if (searchTerm && !name.includes(searchTerm)) {
                show = false;
            }

            // Category filter
            if (categoryFilter !== 'all' && !category.includes(categoryFilter.toLowerCase())) {
                show = false;
            }

            // Stock filter
            if (stockFilter === 'in-stock' && !isInStock) {
                show = false;
            } else if (stockFilter === 'low-stock' && !isLowStock) {
                show = false;
            } else if (stockFilter === 'out-of-stock' && !isOutOfStock) {
                show = false;
            }

            row.style.display = show ? '' : 'none';
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminManager.init();
});
