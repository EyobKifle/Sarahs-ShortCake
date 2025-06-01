// 🚀 Enhanced Dashboard Statistics Module
class DashboardStats {
    constructor() {
        this.statsData = {};
        this.currentTimePeriod = 'all';
        this.refreshInterval = null;
        this.isLoading = false;
        this.animationDelay = 100;

        // Bind methods
        this.handleTimePeriodChange = this.handleTimePeriodChange.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);
    }

    /**
     * 📊 Load and render enhanced dashboard
     */
    async load() {
        try {
            console.log('🚀 Loading enhanced dashboard...');

            // Render dashboard structure
            this.renderDashboardStructure();

            // Load initial stats
            await this.loadDashboardStats(this.currentTimePeriod);

            // Setup enhanced controls
            this.setupEnhancedControls();

            // Start auto-refresh
            this.startAutoRefresh();

            console.log('✅ Enhanced dashboard loaded successfully');
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            this.showErrorState();
        }
    }

    /**
     * 🔄 Refresh dashboard data
     */
    async refresh() {
        if (this.isLoading) return;

        try {
            await this.loadDashboardStats(this.currentTimePeriod);
        } catch (error) {
            console.error('❌ Error refreshing dashboard:', error);
        }
    }

    async loadDashboardStats(timePeriod = 'all') {
        try {
            this.currentTimePeriod = timePeriod;
            console.log('📊 Loading dashboard stats for period:', timePeriod);

            // Use the admin dashboard stats endpoint directly
            const data = await window.apiClient.getAdminDashboardStats(timePeriod);
            console.log('📊 Raw backend response:', data);

            // Validate that we received proper data
            if (!data) {
                throw new Error('No data received from backend');
            }

            console.log('📊 Real database data received:');
            console.log('- Total Orders:', data.totalOrders);
            console.log('- Total Revenue:', data.totalRevenue);
            console.log('- New Customers:', data.newCustomers);
            console.log('- Orders Change:', data.ordersChange);
            console.log('- Revenue Change:', data.revenueChange);
            console.log('- Customer Change:', data.customersChange);
            console.log('- Orders Array Length:', data.orders?.length);

            if (data.orders && data.orders.length > 0) {
                console.log('- Sample Order:', data.orders[0]);
                console.log('- Sample Order Total:', data.orders[0].total || data.orders[0].totalAmount);
                console.log('- Sample Order Status:', data.orders[0].status);
                console.log('- Sample Order Customer:', data.orders[0].customerId?.name || data.orders[0].guestInfo?.name);
            }

            // Also get inventory stats for low stock count
            try {
                const inventoryReport = await window.apiClient.getInventoryReport();
                if (inventoryReport?.data?.summary?.lowStockItems) {
                    data.lowStockItems = inventoryReport.data.summary.lowStockItems;
                }
            } catch (inventoryError) {
                console.warn('Could not load inventory stats:', inventoryError);
                data.lowStockItems = 0;
            }

            // Store the data and update display directly with backend data
            this.statsData = data;
            this.updateStatsDisplay(data, timePeriod);

            console.log('✅ Dashboard stats loaded and displayed successfully');
            return data;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.showNotification('Error loading dashboard statistics: ' + error.message, 'error');
            return null;
        }
    }



    async updateStatsDisplay(data, timePeriod = 'all') {
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };

        const updateChangeElement = (id, change, suffix = '%') => {
            const element = document.getElementById(id);
            if (element) {
                const isPositive = change >= 0;
                const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
                const colorClass = isPositive ? 'text-success' : 'text-danger';

                const periodText = this.getPeriodComparisonText(timePeriod);
                element.className = `small ${colorClass}`;
                element.innerHTML = `<i class="fas ${icon}"></i> ${Math.abs(change)}${suffix} ${periodText}`;
            }
        };

        // Update main dashboard stats with real backend data
        console.log('📊 Updating dashboard display with backend data:');
        console.log('- Total Orders:', data.totalOrders);
        console.log('- Total Revenue:', data.totalRevenue);
        console.log('- New Customers:', data.newCustomers);

        updateElement('totalOrders', data.totalOrders || 0);
        updateChangeElement('ordersChange', data.ordersChange || 0);

        updateElement('totalRevenue', '$' + ((data.totalRevenue || 0).toFixed(2)));
        updateChangeElement('revenueChange', data.revenueChange || 0);

        updateElement('totalCustomers', data.newCustomers || 0);
        updateChangeElement('customersChange', data.customersChange || 0);

        // Calculate order status counts from orders array
        const orders = data.orders || [];
        updateElement('pendingOrders', this.countOrdersByStatus(orders, 'pending'));
        updateElement('completedOrders', this.countOrdersByStatus(orders, 'completed'));
        updateElement('processingOrders', this.countOrdersByStatus(orders, 'processing'));

        // Update low stock items
        updateElement('lowStockItems', data.lowStockItems || 0);

        // Update recent orders table - ALWAYS use recentOrders (latest 10 from database)
        // Recent orders should NEVER be affected by time period selection
        const recentOrdersData = data.recentOrders || [];

        // DEBUGGING: Log the actual data structure
        console.log('🔍 DEBUGGING RECENT ORDERS:');
        console.log('📋 Recent orders data received:', recentOrdersData.length, 'orders');
        console.log('📋 Full dashboard data keys:', Object.keys(data));
        console.log('📋 Recent orders array:', recentOrdersData);
        console.log('📋 Recent orders sample (first order):', recentOrdersData[0]);

        // Force display even if empty for debugging
        this.updateRecentOrdersTable(recentOrdersData);

        console.log('✅ Dashboard display updated with real backend data');
    }



    countOrdersByStatus(orders, status) {
        if (!orders || !Array.isArray(orders)) return 0;
        return orders.filter(order => order.status === status).length;
    }

    filterOrdersByPeriod(orders, timePeriod, referenceDate, isPrevious = false) {
        const now = new Date(referenceDate);
        let startDate, endDate;

        switch (timePeriod) {
            case 'today':
                if (isPrevious) {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                } else {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                }
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                const startOfWeek = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
                if (isPrevious) {
                    startDate = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
                    endDate = new Date(startOfWeek.getTime());
                } else {
                    startDate = startOfWeek;
                    endDate = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
                }
                break;
            case 'month':
                if (isPrevious) {
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 1);
                } else {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                }
                break;
            case 'year':
                if (isPrevious) {
                    startDate = new Date(now.getFullYear() - 1, 0, 1);
                    endDate = new Date(now.getFullYear(), 0, 1);
                } else {
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear() + 1, 0, 1);
                }
                break;
            default: // 'all'
                return orders;
        }

        return orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startDate && orderDate < endDate;
        });
    }

    calculateStats(orders) {
        const completedOrders = orders.filter(order => order.status === 'completed');
        const confirmedOrders = orders.filter(order => order.status === 'confirmed' || order.status === 'processing');

        // Calculate total revenue from completed and confirmed orders (orders that have been paid)
        const revenueOrders = [...completedOrders, ...confirmedOrders];
        const totalRevenue = revenueOrders.reduce((sum, order) => {
            // Try different fields for order total
            let orderTotal = 0;

            if (order.totalAmount) {
                orderTotal = parseFloat(order.totalAmount);
            } else if (order.total) {
                orderTotal = parseFloat(order.total);
            } else if (order.payment && order.payment.amount) {
                orderTotal = parseFloat(order.payment.amount);
            } else if (order.items && Array.isArray(order.items)) {
                // Calculate from items if totalAmount is not available
                orderTotal = order.items.reduce((itemSum, item) => {
                    const price = parseFloat(item.price) || parseFloat(item.unitPrice) || 0;
                    const quantity = parseInt(item.quantity) || 1;
                    return itemSum + (price * quantity);
                }, 0);
            }

            return sum + orderTotal;
        }, 0);

        // Get unique customers
        const customerEmails = new Set();
        orders.forEach(order => {
            if (order.customerId?.email) {
                customerEmails.add(order.customerId.email);
            } else if (order.guestInfo?.email) {
                customerEmails.add(order.guestInfo.email);
            } else if (order.customerEmail) {
                customerEmails.add(order.customerEmail);
            }
        });

        return {
            totalOrders: orders.length,
            totalRevenue: totalRevenue,
            totalCustomers: customerEmails.size,
            completedOrders: completedOrders.length
        };
    }

    calculatePercentageChange(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    getPeriodComparisonText(timePeriod) {
        switch (timePeriod) {
            case 'today': return 'from yesterday';
            case 'week': return 'from last week';
            case 'month': return 'from last month';
            case 'year': return 'from last year';
            default: return 'from previous period';
        }
    }

    showNotification(message, type = 'info') {
        // Use the main notification system
        if (window.AdminManager && window.AdminManager.showNotification) {
            window.AdminManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    getStatsData() {
        return this.statsData;
    }

    /**
     * 📊 Calculate today's specific stats
     */
    calculateTodayStats(orders) {
        if (!orders || !Array.isArray(orders)) {
            return { orders: 0, revenue: 0, newCustomers: 0, pending: 0 };
        }

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startOfDay && orderDate < endOfDay;
        });

        const revenue = todayOrders.reduce((sum, order) => {
            if (order.status === 'completed') {
                return sum + (order.totalAmount || order.total || 0);
            }
            return sum;
        }, 0);

        const pending = todayOrders.filter(order => order.status === 'pending').length;

        // Count unique customers today (simplified)
        const customerEmails = new Set();
        todayOrders.forEach(order => {
            if (order.customerId?.email) {
                customerEmails.add(order.customerId.email);
            } else if (order.guestInfo?.email) {
                customerEmails.add(order.guestInfo.email);
            }
        });

        return {
            orders: todayOrders.length,
            revenue: revenue,
            newCustomers: customerEmails.size,
            pending: pending
        };
    }

    /**
     * 🚨 Update system alerts
     */
    updateSystemAlerts(data) {
        const alertsContainer = document.getElementById('systemAlerts');
        if (!alertsContainer) return;

        const alerts = [];

        // Check for pending orders
        const pendingCount = this.countOrdersByStatus(data.orders, 'pending');
        if (pendingCount > 0) {
            alerts.push({
                type: 'warning',
                icon: 'fas fa-clock',
                message: `${pendingCount} pending order${pendingCount > 1 ? 's' : ''} need${pendingCount === 1 ? 's' : ''} attention`
            });
        }

        // Check for low stock (placeholder)
        const lowStock = data.lowStockItems || 0;
        if (lowStock > 0) {
            alerts.push({
                type: 'danger',
                icon: 'fas fa-box-open',
                message: `${lowStock} item${lowStock > 1 ? 's' : ''} running low on stock`
            });
        }

        // Check for processing orders
        const processingCount = this.countOrdersByStatus(data.orders, 'processing');
        if (processingCount > 5) {
            alerts.push({
                type: 'info',
                icon: 'fas fa-cog',
                message: `${processingCount} orders currently being processed`
            });
        }

        // If no alerts, show success message
        if (alerts.length === 0) {
            alerts.push({
                type: 'success',
                icon: 'fas fa-check-circle',
                message: 'All systems running smoothly!'
            });
        }

        // Render alerts
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type} alert-sm mb-2 py-2">
                <i class="${alert.icon} me-2"></i>
                <small>${alert.message}</small>
            </div>
        `).join('');
    }

    /**
     * 📋 Update recent orders table with enhanced display
     */
    updateRecentOrdersTable(orders) {
        console.log('🔍 updateRecentOrdersTable called with:', orders?.length || 0, 'orders');
        console.log('🔍 Orders data:', orders);

        const tableBody = document.querySelector('#recentOrdersTable tbody');
        if (!tableBody) {
            console.error('❌ Recent orders table body not found');
            return;
        }

        if (!orders || orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2 d-block opacity-50"></i>
                        <div class="fw-semibold">No recent orders found</div>
                        <small class="text-muted">Orders will appear here once customers start placing them</small>
                    </td>
                </tr>
            `;
            return;
        }

        // Recent orders are already sorted and limited to 10 by the backend
        // These are ALWAYS the 10 most recent orders regardless of time period selection
        const recentOrders = orders.slice(0, 10); // Ensure we only show 10 max

        console.log(`📋 Displaying ${recentOrders.length} most recent orders from database (ALWAYS latest 10, independent of time period)`);
        console.log('📋 Recent orders raw data sample:', recentOrders[0]); // Show full structure for debugging

        tableBody.innerHTML = recentOrders.map(order => {
            // Extract customer name from various possible sources
            let customerName = 'Unknown Customer';
            let customerEmail = '';

            // Try populated customerId first
            if (order.customerId && typeof order.customerId === 'object') {
                if (order.customerId.firstName && order.customerId.lastName) {
                    customerName = `${order.customerId.firstName} ${order.customerId.lastName}`;
                } else if (order.customerId.name) {
                    customerName = order.customerId.name;
                }
                customerEmail = order.customerId.email || '';
            }
            // Try guestInfo for guest customers
            else if (order.guestInfo && order.guestInfo.name) {
                customerName = order.guestInfo.name;
                customerEmail = order.guestInfo.email || '';
            }
            // Try deliveryInfo as fallback
            else if (order.deliveryInfo && order.deliveryInfo.name) {
                customerName = order.deliveryInfo.name;
                customerEmail = order.deliveryInfo.email || '';
            }
            // Try customerName field directly
            else if (order.customerName) {
                customerName = order.customerName;
            }

            // Debug logging for customer name extraction
            if (customerName === 'Unknown Customer') {
                console.log('⚠️ Could not extract customer name for order:', order._id, {
                    customerId: order.customerId,
                    guestInfo: order.guestInfo,
                    deliveryInfo: order.deliveryInfo,
                    customerName: order.customerName
                });
            }

            const orderDate = new Date(order.createdAt);
            const formattedDate = orderDate.toLocaleDateString();
            const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Extract total from various possible sources
            // Priority: calculatedTotal (from backend) > totalAmount > total > payment.amount > calculate from items
            let total = 0;
            if (order.calculatedTotal !== undefined) {
                total = parseFloat(order.calculatedTotal);
            } else if (order.totalAmount) {
                total = parseFloat(order.totalAmount);
            } else if (order.total) {
                total = parseFloat(order.total);
            } else if (order.payment && order.payment.amount) {
                total = parseFloat(order.payment.amount);
            } else if (order.items && Array.isArray(order.items)) {
                // Calculate from items if no total is available
                total = order.items.reduce((sum, item) => {
                    const price = parseFloat(item.price) || parseFloat(item.unitPrice) || 0;
                    const quantity = parseInt(item.quantity) || 1;
                    return sum + (price * quantity);
                }, 0);
            }
            const status = order.status || 'pending';
            const orderId = order._id;

            const statusBadge = this.getStatusBadge(status);
            const itemsCount = order.items?.length || 0;
            const itemsText = itemsCount === 1 ? '1 item' : `${itemsCount} items`;

            return `
                <tr class="order-row" data-order-id="${orderId}" style="cursor: pointer;">
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="order-id-badge me-2">
                                <small class="text-muted">#</small><strong>${orderId.slice(-8).toUpperCase()}</strong>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="customer-info">
                            <div class="fw-semibold text-dark">${customerName}</div>
                            ${customerEmail ? `<small class="text-muted">${customerEmail}</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark border">
                            <i class="fas fa-shopping-bag me-1"></i>${itemsText}
                        </span>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="fw-bold text-success">$${total.toFixed(2)}</div>
                    </td>
                    <td>
                        <div class="date-info">
                            <div class="fw-semibold">${formattedDate}</div>
                            <small class="text-muted">${formattedTime}</small>
                        </div>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-primary btn-sm" onclick="event.stopPropagation(); window.AdminManager?.modules?.orderManagement?.editOrder('${orderId}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${status === 'pending' ? `
                                <button class="btn btn-outline-success btn-sm" onclick="event.stopPropagation(); window.AdminManager?.modules?.orderManagement?.acceptOrder('${orderId}')" title="Accept Order">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Add hover effects and click handlers
        setTimeout(() => {
            document.querySelectorAll('.order-row').forEach(row => {
                row.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        const orderId = row.dataset.orderId;
                        if (window.AdminManager?.modules?.orderManagement?.editOrder) {
                            window.AdminManager.modules.orderManagement.editOrder(orderId);
                        }
                    }
                });
            });
        }, 100);

        // Always show "Recent Orders" title since we always display the most recent 10 regardless of time period
        const tableTitle = document.querySelector('#recentOrdersTable').closest('.card').querySelector('.card-title');
        if (tableTitle) {
            tableTitle.innerHTML = `<i class="fas fa-list-alt text-primary me-2"></i>Recent Orders (Latest 10 - All Time)`;
        }

        console.log('Enhanced recent orders table updated with', recentOrders.length, 'orders');
        console.log('Sample order data:', recentOrders[0]); // Debug first order structure

        // Verify we're using real database data
        this.verifyRealDatabaseData(recentOrders);
    }

    /**
     * ✅ Verify we're using real database data
     */
    verifyRealDatabaseData(orders) {
        if (!orders || orders.length === 0) {
            console.warn('⚠️ No orders data - may be empty database');
            return;
        }

        const sampleOrder = orders[0];
        const hasRealData = sampleOrder._id &&
                           sampleOrder.createdAt &&
                           (sampleOrder.totalAmount || sampleOrder.total) &&
                           sampleOrder.status;

        if (hasRealData) {
            console.log('✅ VERIFIED: Using real database data');
            console.log('- Order ID:', sampleOrder._id);
            console.log('- Created:', new Date(sampleOrder.createdAt).toLocaleString());
            console.log('- Total:', sampleOrder.totalAmount || sampleOrder.total);
            console.log('- Status:', sampleOrder.status);
            console.log('- Customer:', sampleOrder.customerId?.name || sampleOrder.guestInfo?.name || 'Guest');
        } else {
            console.error('❌ WARNING: Data appears to be placeholder/mock data');
            console.log('Sample order structure:', sampleOrder);
        }
    }

    /**
     * 🎨 Render enhanced dashboard structure
     */
    renderDashboardStructure() {
        const dashboardSection = document.getElementById('dashboardSection');
        if (!dashboardSection) return;

        dashboardSection.innerHTML = `
            <!-- 🎯 Enhanced Dashboard Header -->
            <div class="dashboard-header">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 class="h2 mb-1">
                            <i class="fas fa-tachometer-alt text-primary me-2"></i>
                            Dashboard Overview
                        </h1>
                    </div>
                    <div class="dashboard-controls d-flex align-items-center gap-3">
                        <div class="btn-group" role="group" id="timePeriodSelector">
                            <input type="radio" class="btn-check" name="timePeriod" id="period-today" value="today">
                            <label class="btn btn-outline-primary btn-sm" for="period-today">
                                <i class="fas fa-calendar-day me-1"></i>Today
                            </label>

                            <input type="radio" class="btn-check" name="timePeriod" id="period-week" value="week">
                            <label class="btn btn-outline-primary btn-sm" for="period-week">
                                <i class="fas fa-calendar-week me-1"></i>Week
                            </label>

                            <input type="radio" class="btn-check" name="timePeriod" id="period-month" value="month">
                            <label class="btn btn-outline-primary btn-sm" for="period-month">
                                <i class="fas fa-calendar-alt me-1"></i>Month
                            </label>

                            <input type="radio" class="btn-check" name="timePeriod" id="period-all" value="all" checked>
                            <label class="btn btn-outline-primary btn-sm" for="period-all">
                                <i class="fas fa-infinity me-1"></i>All Time
                            </label>
                        </div>
                        <button class="btn btn-primary btn-sm" id="refreshDashboard">
                            <i class="fas fa-sync-alt me-1"></i>Refresh
                        </button>

                    </div>
                </div>
            </div>

            <!-- 📊 Enhanced Stats Cards -->
            <div class="row g-4 mb-4">
                <!-- Revenue Card -->
                <div class="col-xl-3 col-lg-6 col-md-6">
                    <div class="card stat-card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-center">
                                <div class="stat-icon bg-success bg-gradient rounded-circle p-3 me-3">
                                    <i class="fas fa-dollar-sign text-white fa-lg"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="stat-label text-muted small fw-semibold">TOTAL REVENUE</div>
                                    <div class="stat-value h3 mb-1 fw-bold text-dark" id="totalRevenue">$0.00</div>
                                    <div class="stat-change small" id="revenueChange">
                                        <i class="fas fa-arrow-up"></i> 0% from previous period
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Orders Card -->
                <div class="col-xl-3 col-lg-6 col-md-6">
                    <div class="card stat-card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-center">
                                <div class="stat-icon bg-primary bg-gradient rounded-circle p-3 me-3">
                                    <i class="fas fa-shopping-cart text-white fa-lg"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="stat-label text-muted small fw-semibold">TOTAL ORDERS</div>
                                    <div class="stat-value h3 mb-1 fw-bold text-dark" id="totalOrders">0</div>
                                    <div class="stat-change small" id="ordersChange">
                                        <i class="fas fa-arrow-up"></i> 0% from previous period
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Customers Card -->
                <div class="col-xl-3 col-lg-6 col-md-6">
                    <div class="card stat-card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-center">
                                <div class="stat-icon bg-info bg-gradient rounded-circle p-3 me-3">
                                    <i class="fas fa-users text-white fa-lg"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="stat-label text-muted small fw-semibold">TOTAL CUSTOMERS</div>
                                    <div class="stat-value h3 mb-1 fw-bold text-dark" id="totalCustomers">0</div>
                                    <div class="stat-change small" id="customersChange">
                                        <i class="fas fa-arrow-up"></i> 0% from previous period
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pending Orders Card -->
                <div class="col-xl-3 col-lg-6 col-md-6">
                    <div class="card stat-card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-center">
                                <div class="stat-icon bg-warning bg-gradient rounded-circle p-3 me-3">
                                    <i class="fas fa-clock text-white fa-lg"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="stat-label text-muted small fw-semibold">PENDING ORDERS</div>
                                    <div class="stat-value h3 mb-1 fw-bold text-dark" id="pendingOrders">0</div>
                                    <div class="stat-change small text-warning">
                                        <i class="fas fa-exclamation-triangle"></i> Needs attention
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 📈 Secondary Stats Row -->
            <div class="row g-4 mb-4">
                <!-- Completed Orders -->
                <div class="col-xl-4 col-lg-6 col-md-6">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-center">
                                <div class="stat-icon bg-success bg-gradient rounded-circle p-3 me-3">
                                    <i class="fas fa-check-circle text-white fa-lg"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="stat-label text-muted small fw-semibold">COMPLETED ORDERS</div>
                                    <div class="stat-value h4 mb-1 fw-bold text-dark" id="completedOrders">0</div>
                                    <div class="stat-change small text-success">
                                        <i class="fas fa-thumbs-up"></i> Successfully delivered
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Processing Orders -->
                <div class="col-xl-4 col-lg-6 col-md-6">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-center">
                                <div class="stat-icon bg-info bg-gradient rounded-circle p-3 me-3">
                                    <i class="fas fa-cog text-white fa-lg fa-spin"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="stat-label text-muted small fw-semibold">PROCESSING ORDERS</div>
                                    <div class="stat-value h4 mb-1 fw-bold text-dark" id="processingOrders">0</div>
                                    <div class="stat-change small text-info">
                                        <i class="fas fa-hourglass-half"></i> In progress
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Low Stock Alert -->
                <div class="col-xl-4 col-lg-6 col-md-6">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <div class="d-flex align-items-center">
                                <div class="stat-icon bg-danger bg-gradient rounded-circle p-3 me-3">
                                    <i class="fas fa-exclamation-triangle text-white fa-lg"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="stat-label text-muted small fw-semibold">LOW STOCK ITEMS</div>
                                    <div class="stat-value h4 mb-1 fw-bold text-dark" id="lowStockItems">0</div>
                                    <div class="stat-change small text-danger">
                                        <i class="fas fa-box-open"></i> Need restocking
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 📈 Enhanced Revenue Chart -->
            <div class="row g-4 mb-4">
                <!-- Main Revenue Chart -->
                <div class="col-12">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title mb-1">
                                        <i class="fas fa-chart-line text-primary me-2"></i>
                                        Revenue & Orders Trend
                                    </h5>
                                    <p class="text-muted small mb-0">Track your business performance over time</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pt-2">
                            <div style="height: 400px;">
                                <canvas id="revenueChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 📋 Enhanced Recent Orders -->
            <div class="row g-4 mb-4">
                <!-- Recent Orders Table -->
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title mb-1">
                                        <i class="fas fa-list-alt text-primary me-2"></i>
                                        Recent Orders (Latest 10 - All Time)
                                    </h5>
                                    <p class="text-muted small mb-0">Always shows the 10 most recent orders regardless of time period selection</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-body pt-2">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle" id="recentOrdersTable">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="border-0">Order ID</th>
                                            <th class="border-0">Customer</th>
                                            <th class="border-0">Items</th>
                                            <th class="border-0">Status</th>
                                            <th class="border-0">Total</th>
                                            <th class="border-0">Date</th>
                                            <th class="border-0">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Recent orders will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 🎛️ Setup enhanced controls
     */
    setupEnhancedControls() {
        // Time period selector
        const timePeriodInputs = document.querySelectorAll('input[name="timePeriod"]');
        timePeriodInputs.forEach(input => {
            input.addEventListener('change', this.handleTimePeriodChange.bind(this));
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.handleRefresh.bind(this));
        }




    }

    /**
     * 🔄 Handle time period change
     */
    async handleTimePeriodChange(event) {
        const newPeriod = event.target.value;
        if (newPeriod !== this.currentTimePeriod) {
            this.currentTimePeriod = newPeriod;

            // Show loading indicator
            this.showNotification(`Loading ${newPeriod} data...`, 'info');

            // Load new stats
            await this.loadDashboardStats(newPeriod);

            // Update charts with new period using all orders from backend
            if (window.AdminManager?.modules?.dashboardCharts && this.statsData?.orders) {
                // Use all orders from backend, not just filtered ones
                const allOrders = this.statsData.orders || [];
                window.AdminManager.modules.dashboardCharts.updateCharts(allOrders, newPeriod);
            }

            console.log(`Dashboard updated for period: ${newPeriod}`);
        }
    }



    /**
     * 🔄 Handle refresh button click
     */
    async handleRefresh() {
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');

            await this.refresh();

            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 1000);
        }
    }

    /**
     * 🏷️ Get status badge HTML
     */
    getStatusBadge(status) {
        const statusClasses = {
            'pending': 'bg-warning text-dark',
            'confirmed': 'bg-info',
            'processing': 'bg-primary',
            'completed': 'bg-success',
            'cancelled': 'bg-danger',
            'ready': 'bg-success'
        };

        const className = statusClasses[status] || 'bg-secondary';
        return `<span class="badge ${className}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    }

    /**
     * ⏱️ Start auto-refresh
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, 60000); // Refresh every minute
    }

    /**
     * ⏹️ Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * ❌ Show error state
     */
    showErrorState() {
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.innerHTML = `
                <div class="error-state text-center py-5">
                    <div class="error-icon mb-3">
                        <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    </div>
                    <h3>Unable to Load Dashboard</h3>
                    <p class="text-muted">There was an error loading the dashboard data. Please try refreshing the page.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-sync-alt"></i> Refresh Page
                    </button>
                </div>
            `;
        }
    }
}

// Export for use in other modules
window.DashboardStats = DashboardStats;
