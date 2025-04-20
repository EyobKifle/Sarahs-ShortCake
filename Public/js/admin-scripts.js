// Admin Manager - Main controller for the admin dashboard
        const AdminManager = {
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
            document.getElementById('logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/api/logout', {
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
                
                // Time period filter
                document.getElementById('timePeriod').addEventListener('change', () => {
                    this.loadDashboardData();
                });
                
                // Order search
                document.getElementById('orderSearch').addEventListener('input', (e) => {
                    this.filterOrders();
                });
                
                // Order status filter
                document.getElementById('orderStatusFilter').addEventListener('change', () => {
                    this.filterOrders();
                });
                
                // Order date filter
                document.getElementById('orderDateFilter').addEventListener('change', () => {
                    this.filterOrders();
                });
                
                // Save order button
                document.getElementById('saveOrderBtn').addEventListener('click', () => {
                    this.saveOrderChanges();
                });
            },
            
            // Show a specific section
            showSection(section) {
                // Hide all sections
                document.querySelectorAll('#mainContent > section').forEach(sec => {
                    sec.classList.add('d-none');
                });
                
                // Show the selected section
                document.getElementById(`${section}Section`).classList.remove('d-none');
                
                // Update active nav link
                document.querySelectorAll('.sidebar .nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                document.querySelector(`.sidebar .nav-link[data-section="${section}"]`).classList.add('active');
                
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
                const period = document.getElementById('timePeriod').value;
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
                    document.getElementById('totalOrders').textContent = data.totalOrders;
                    document.getElementById('ordersChange').innerHTML = \`
                        <i class="fas \${data.ordersChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger'}"></i> 
                        \${Math.abs(data.ordersChange)}% from yesterday
                    \`;
                    document.getElementById('totalRevenue').textContent = \`$\${data.totalRevenue.toFixed(2)}\`;
                    document.getElementById('revenueChange').innerHTML = \`
                        <i class="fas \${data.revenueChange >= 0 ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger'}"></i> 
                        \${Math.abs(data.revenueChange)}% from yesterday
                    \`;
                    document.getElementById('newCustomers').textContent = data.newCustomers;
                    document.getElementById('customersChange').innerHTML = \`
                        <i class="fas fa-arrow-up text-success"></i> 
                        \${data.customersChange} from yesterday
                    \`;
                    document.getElementById('avgRating').textContent = data.avgRating.toFixed(1);
                    document.getElementById('ratingChange').innerHTML = \`
                        <i class="fas fa-arrow-up text-success"></i> 
                        \${data.ratingChange} from last week
                    \`;
                    this.updateCharts(data.orders);
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                    this.showNotification('Error loading dashboard data', 'error');
                }
            },
            
            // Update charts with order data
            updateCharts(orders) {
                // Sales Chart
                const salesCtx = document.getElementById('salesChart').getContext('2d');
                
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
                const productsCtx = document.getElementById('productsChart').getContext('2d');
                
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
                    
                    row.innerHTML = \`
                        <td class="order-id">#\${order.orderId}</td>
                        <td>\${order.customer.firstName} \${order.customer.lastName}</td>
                        <td>\${orderDate.toLocaleDateString()}</td>
                        <td>$\${this.calculateOrderTotal(order.order.items).toFixed(2)}</td>
                        <td><span class="badge badge-\${order.order.status}">\${order.order.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-order" data-id="\${order.orderId}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    \`;
                    
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
                    
                    row.innerHTML = \`
