// Main Admin Manager - Coordinates all modules
// Updated with report summary cards - v2.1
class AdminManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.modules = {};
        this.isInitialized = false;
        this.connectionStatus = 'unknown';
        this.retryCount = 0;
        this.maxRetries = 3;

        // Start connection monitoring
        this.startConnectionMonitoring();
    }

    async init() {
        if (this.isInitialized) return;

        console.log('🚀 Initializing Admin Manager...');

        try {
            // Wait for auth client to be available
            if (typeof authClient === 'undefined') {
                console.log('⏳ Waiting for auth client to load...');
                await new Promise(resolve => {
                    const checkAuthClient = () => {
                        if (typeof authClient !== 'undefined') {
                            resolve();
                        } else {
                            setTimeout(checkAuthClient, 100);
                        }
                    };
                    checkAuthClient();
                });
            }

            // Check authentication using unified auth client
            await this.checkAuthentication();

            // Initialize modules with error checking
            console.log('🔧 Initializing modules...');

            try {
                console.log('📊 Initializing DashboardStats...');
                this.modules.dashboardStats = new DashboardStats();
                console.log('✅ DashboardStats initialized');
            } catch (error) {
                console.error('❌ Error initializing DashboardStats:', error);
                throw error;
            }

            try {
                console.log('📈 Initializing DashboardCharts...');
                this.modules.dashboardCharts = new DashboardCharts();
                console.log('✅ DashboardCharts initialized');
            } catch (error) {
                console.error('❌ Error initializing DashboardCharts:', error);
                throw error;
            }

            try {
                console.log('📦 Initializing OrderManagement...');
                this.modules.orderManagement = new OrderManagement();
                console.log('✅ OrderManagement initialized');
            } catch (error) {
                console.error('❌ Error initializing OrderManagement:', error);
                throw error;
            }

            try {
                console.log('👥 Initializing CustomerManagement...');
                this.modules.customerManagement = new CustomerManagement();
                console.log('✅ CustomerManagement initialized');
            } catch (error) {
                console.error('❌ Error initializing CustomerManagement:', error);
                throw error;
            }

            try {
                console.log('📋 Initializing InventoryManagement...');
                this.modules.inventoryManagement = new InventoryManagement();
                console.log('✅ InventoryManagement initialized');
            } catch (error) {
                console.error('❌ Error initializing InventoryManagement:', error);
                throw error;
            }

            try {
                console.log('📊 Initializing ReportsManagement...');
                this.modules.reportsManagement = new ReportsManagement();
                console.log('✅ ReportsManagement initialized');
            } catch (error) {
                console.error('❌ Error initializing ReportsManagement:', error);
                throw error;
            }

            try {
                console.log('📧 Initializing ContactManagement...');
                this.modules.contactManagement = new ContactManagement();
                console.log('✅ ContactManagement initialized');
            } catch (error) {
                console.error('❌ Error initializing ContactManagement:', error);
                throw error;
            }

            try {
                console.log('⚙️ Initializing AdminSettings...');
                this.modules.adminSettings = new AdminSettings();
                console.log('✅ AdminSettings initialized');
            } catch (error) {
                console.error('❌ Error initializing AdminSettings:', error);
                throw error;
            }



            console.log('✅ All modules initialized successfully');

            // Set up navigation
            this.setupNavigation();
            this.setupEventListeners();

            // Perform system health check
            await this.performSystemHealthCheck();

            // Show dashboard section by default
            await this.showSection('dashboard');

            // Load initial data with force refresh
            await this.loadDashboard('all', true);

            this.isInitialized = true;
            console.log('✅ Admin Manager initialized successfully');

        } catch (error) {
            console.error('❌ Error initializing Admin Manager:', error);
            this.showNotification('Error initializing dashboard: ' + error.message, 'error');

            // If authentication fails, redirect to login
            if (error.message.includes('Authentication') || error.message.includes('401')) {
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            }
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('[data-section]');
        console.log(`🔗 Setting up navigation for ${navLinks.length} links`);

        navLinks.forEach((link, index) => {
            const section = link.getAttribute('data-section');
            console.log(`🔗 Navigation link ${index + 1}: ${section}`);

            // Remove any existing event listeners by cloning the element
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);

            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`🔗 Navigation clicked: ${section}`);
                console.log(`🔄 Calling showSection('${section}')...`);
                this.showSection(section);
            });
        });

        console.log('✅ Navigation setup complete');
    }

    setupEventListeners() {
        // Time period selector for dashboard
        const timePeriodSelector = document.getElementById('timePeriod');
        if (timePeriodSelector) {
            timePeriodSelector.addEventListener('change', (e) => {
                this.handleTimePeriodChange(e.target.value);
            });
        }

        // Refresh dashboard button
        const refreshButton = document.getElementById('refreshDashboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                const currentPeriod = timePeriodSelector ? timePeriodSelector.value : 'all';
                this.loadDashboard(currentPeriod, true); // Force refresh
            });
        }

        // Order search and filters
        const orderSearch = document.getElementById('orderSearch');
        const orderStatusFilter = document.getElementById('orderStatusFilter');
        const orderDateFilter = document.getElementById('orderDateFilter');

        if (orderSearch) {
            orderSearch.addEventListener('input', () => this.filterOrders());
        }
        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', () => this.filterOrders());
        }
        if (orderDateFilter) {
            orderDateFilter.addEventListener('change', () => this.filterOrders());
        }

        // Customer search and filters
        const customerSearch = document.getElementById('customerSearch');
        const customerTypeFilter = document.getElementById('customerTypeFilter');
        const customerSortBy = document.getElementById('customerSortBy');

        if (customerSearch) {
            customerSearch.addEventListener('input', () => this.filterCustomers());
        }
        if (customerTypeFilter) {
            customerTypeFilter.addEventListener('change', () => this.filterCustomers());
        }
        if (customerSortBy) {
            customerSortBy.addEventListener('change', () => this.filterCustomers());
        }

        // Inventory search and filters
        const inventorySearch = document.getElementById('inventorySearch');
        const inventoryCategoryFilter = document.getElementById('inventoryCategoryFilter');
        const inventoryStockFilter = document.getElementById('inventoryStockFilter');
        const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
        const lowStockBtn = document.getElementById('lowStockBtn');

        if (inventorySearch) {
            inventorySearch.addEventListener('input', () => this.filterInventory());
        }
        if (inventoryCategoryFilter) {
            inventoryCategoryFilter.addEventListener('change', () => this.filterInventory());
        }
        if (inventoryStockFilter) {
            inventoryStockFilter.addEventListener('change', () => this.filterInventory());
        }
        if (refreshInventoryBtn) {
            refreshInventoryBtn.addEventListener('click', () => this.modules.inventoryManagement.loadInventory());
        }
        if (lowStockBtn) {
            lowStockBtn.addEventListener('click', () => this.modules.inventoryManagement.showLowStockItems());
        }

        // Reports export buttons - removed as requested

        // Contact messages search and filters
        const messageSearch = document.getElementById('messageSearch');
        const messageStatusFilter = document.getElementById('messageStatusFilter');
        const messageDateFilter = document.getElementById('messageDateFilter');

        if (messageSearch) {
            messageSearch.addEventListener('input', () => this.filterMessages());
        }
        if (messageStatusFilter) {
            messageStatusFilter.addEventListener('change', () => this.filterMessages());
        }
        if (messageDateFilter) {
            messageDateFilter.addEventListener('change', () => this.filterMessages());
        }

        // Settings save button
        const saveSettingsBtn = document.getElementById('saveSettings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async showSection(sectionName) {
        console.log(`🔄 Switching to section: ${sectionName}`);
        console.log(`🔄 Current section: ${this.currentSection}`);

        // Add loading state
        this.showLoadingState();

        try {
            // Hide all sections with fade out effect
            const sections = document.querySelectorAll('section[id$="Section"]');
            sections.forEach(section => {
                if (!section.classList.contains('d-none')) {
                    section.style.opacity = '0';
                    section.style.transform = 'translateY(-10px)';
                }
            });

            // Wait for fade out animation
            await new Promise(resolve => setTimeout(resolve, 150));

            // Hide all sections
            sections.forEach(section => {
                section.classList.add('d-none');
                section.style.opacity = '';
                section.style.transform = '';
            });

            // Show target section
            const targetSection = document.getElementById(sectionName + 'Section');
            if (targetSection) {
                targetSection.classList.remove('d-none');
                this.currentSection = sectionName;

                // Update navigation
                this.updateNavigation(sectionName);

                // Load section-specific data
                await this.loadSectionData(sectionName);

                // Trigger fade in animation
                targetSection.style.opacity = '0';
                targetSection.style.transform = 'translateY(20px)';

                // Force reflow
                targetSection.offsetHeight;

                // Animate in
                targetSection.style.transition = 'all 0.3s ease-out';
                targetSection.style.opacity = '1';
                targetSection.style.transform = 'translateY(0)';

                // Clean up inline styles after animation
                setTimeout(() => {
                    targetSection.style.transition = '';
                    targetSection.style.opacity = '';
                    targetSection.style.transform = '';
                }, 300);
            }
        } catch (error) {
            console.error('Error switching sections:', error);
            this.showNotification('Error loading section', 'error');
        } finally {
            this.hideLoadingState();
        }
    }

    updateNavigation(activeSection) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === activeSection) {
                link.classList.add('active');
            }
        });
    }

    async loadSectionData(sectionName) {
        try {
            console.log(`Loading section data for: ${sectionName}`);

            switch (sectionName) {
                case 'dashboard':
                    await this.initializeDashboard();
                    break;
                case 'orders':
                    await this.initializeOrders();
                    break;
                case 'customers':
                    await this.initializeCustomers();
                    break;
                case 'inventory':
                    await this.initializeInventory();
                    break;
                case 'reports':
                    await this.initializeReports();
                    break;
                case 'contact-messages':
                    console.log('🔄 Loading contact-messages section...');
                    await this.initializeContactMessages();
                    console.log('✅ Contact messages section loaded');
                    break;
                case 'settings':
                    await this.initializeSettings();
                    break;

                default:
                    console.log(`No specific loader for section: ${sectionName}`);
            }
        } catch (error) {
            this.handleError(error, `Loading ${sectionName} data`);
        }
    }

    async loadDashboard(timePeriod = 'all', forceRefresh = false) {
        try {
            // Prevent duplicate loads
            if (this.dashboardLoading && !forceRefresh) {
                console.log('Dashboard already loading, skipping...');
                return;
            }

            this.dashboardLoading = true;
            console.log(`Loading dashboard for period: ${timePeriod}, forceRefresh: ${forceRefresh}`);

            // Load dashboard stats from backend (includes orders data)
            const dashboardData = await this.modules.dashboardStats.loadDashboardStats(timePeriod);

            if (!dashboardData || !dashboardData.orders) {
                console.warn('No dashboard data received from backend');
                this.showNotification('No dashboard data available', 'warning');
                return;
            }

            console.log(`Processing ${dashboardData.orders.length} orders for dashboard`);

            // Load recent orders for the dashboard table
            await this.modules.orderManagement.loadRecentOrders();

            // Update charts with order data from backend
            this.modules.dashboardCharts.updateCharts(dashboardData.orders, timePeriod);

            console.log('Dashboard loaded successfully');

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showNotification('Error loading dashboard data', 'error');
        } finally {
            this.dashboardLoading = false;
        }
    }

    async handleTimePeriodChange(timePeriod) {
        try {
            console.log('Time period changed to:', timePeriod);

            // Show loading indicator
            this.showNotification(`Loading ${timePeriod} data...`, 'info');

            // Reload dashboard with new time period
            await this.loadDashboard(timePeriod);

            // Update the chart title to reflect the time period
            this.updateChartTitle(timePeriod);

        } catch (error) {
            console.error('Error handling time period change:', error);
            this.showNotification('Error updating dashboard for selected time period', 'error');
        }
    }

    updateChartTitle(timePeriod) {
        const chartTitle = document.querySelector('.card-title');
        if (chartTitle && chartTitle.textContent.includes('Sales & Revenue')) {
            const periodText = this.getPeriodDisplayText(timePeriod);
            chartTitle.textContent = `Sales & Revenue Overview - ${periodText}`;
        }
    }

    getPeriodDisplayText(timePeriod) {
        switch (timePeriod) {
            case 'today': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'year': return 'This Year';
            case 'all': return 'All Time';
            default: return 'This Week';
        }
    }

    // Filter methods
    filterOrders() {
        const searchTerm = document.getElementById('orderSearch')?.value || '';
        const statusFilter = document.getElementById('orderStatusFilter')?.value || 'all';
        const dateFilter = document.getElementById('orderDateFilter')?.value || 'all';

        this.modules.orderManagement.filterOrders(searchTerm, statusFilter, dateFilter);
    }

    filterCustomers() {
        const searchTerm = document.getElementById('customerSearch')?.value || '';
        const typeFilter = document.getElementById('customerTypeFilter')?.value || 'all';
        const sortBy = document.getElementById('customerSortBy')?.value || 'newest';

        this.modules.customerManagement.filterCustomers(searchTerm, typeFilter, sortBy);
    }

    filterInventory() {
        const searchTerm = document.getElementById('inventorySearch')?.value || '';
        const categoryFilter = document.getElementById('inventoryCategoryFilter')?.value || 'all';
        const stockFilter = document.getElementById('inventoryStockFilter')?.value || 'all';

        this.modules.inventoryManagement.filterInventory(searchTerm, categoryFilter, stockFilter);
    }

    filterMessages() {
        const searchTerm = document.getElementById('messageSearch')?.value || '';
        const statusFilter = document.getElementById('messageStatusFilter')?.value || 'all';
        const dateFilter = document.getElementById('messageDateFilter')?.value || 'all';

        this.modules.contactManagement.filterMessages(searchTerm, statusFilter, dateFilter);
    }

    saveSettings() {
        // Collect form data
        const settingsData = {
            businessName: document.getElementById('businessName')?.value || '',
            businessEmail: document.getElementById('businessEmail')?.value || '',
            businessPhone: document.getElementById('businessPhone')?.value || '',
            businessAddress: document.getElementById('businessAddress')?.value || '',
            businessDescription: document.getElementById('businessDescription')?.value || '',
            emailNotifications: document.getElementById('emailNotifications')?.checked || false,
            smsNotifications: document.getElementById('smsNotifications')?.checked || false,
            lowStockAlerts: document.getElementById('lowStockAlerts')?.checked || false,
            newOrderAlerts: document.getElementById('newOrderAlerts')?.checked || false
        };

        // Save settings (this would typically call an API endpoint)
        console.log('Saving settings:', settingsData);
        this.showNotification('Settings saved successfully', 'success');
    }

    // Notification system
    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${this.getBootstrapAlertClass(type)} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    getBootstrapAlertClass(type) {
        const typeMap = {
            'success': 'success',
            'error': 'danger',
            'warning': 'warning',
            'info': 'info'
        };
        return typeMap[type] || 'info';
    }

    // Loading state management
    showLoadingState() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent && !document.getElementById('loadingOverlay')) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loadingOverlay';
            loadingOverlay.className = 'position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
            loadingOverlay.style.cssText = `
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(2px);
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            loadingOverlay.innerHTML = `
                <div class="text-center">
                    <div class="spinner-border text-primary mb-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="text-muted">Loading section...</div>
                </div>
            `;
            mainContent.style.position = 'relative';
            mainContent.appendChild(loadingOverlay);
        }
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay.parentNode) {
                    loadingOverlay.remove();
                }
            }, 300);
        }
    }

    // Authentication check using unified auth client
    async checkAuthentication() {
        try {
            console.log('🔐 Admin Manager: Checking authentication...');

            // Check authentication using unified auth client
            const isAuthenticated = await authClient.checkAuth();

            if (!isAuthenticated) {
                throw new Error('Authentication failed');
            }

            // Ensure user is admin
            if (!authClient.isAdmin()) {
                throw new Error('Admin access required');
            }

            const user = authClient.user;
            console.log('✅ Admin authentication verified for:', user.email);

            // Update UI with user info
            this.updateUserInfo(user);

            return { authenticated: true, user };

        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            throw error;
        }
    }

    // Update user info in UI
    updateUserInfo(user) {
        const adminWelcome = document.getElementById('adminWelcome');
        if (adminWelcome) {
            adminWelcome.textContent = `Welcome, ${user.email}`;
        }
    }

    // Logout functionality using unified auth client
    async logout() {
        try {
            // Show confirmation
            if (!confirm('Are you sure you want to logout?')) {
                return;
            }

            console.log('🚪 Admin logout initiated');
            this.showNotification('Logging out...', 'info');

            // Use unified auth client for logout
            await authClient.logout();

        } catch (error) {
            console.error('❌ Error during logout:', error);
            this.showNotification('Error during logout', 'error');
        }
    }

    // Connection monitoring
    startConnectionMonitoring() {
        // Check connection every 30 seconds
        setInterval(() => {
            this.checkConnection();
        }, 30000);

        // Initial connection check
        setTimeout(() => {
            this.checkConnection();
        }, 1000);
    }

    async checkConnection() {
        try {
            const response = await fetch('/api/admin/auth/check', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.connectionStatus = 'connected';
                this.retryCount = 0;
                // Connection status indicator removed - using logout button instead
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            this.connectionStatus = 'disconnected';
            this.retryCount++;
            // Connection status indicator removed - using logout button instead

            if (this.retryCount >= this.maxRetries) {
                this.showNotification('Connection lost. Please refresh the page.', 'error');
            }
        }
    }

    updateConnectionStatus(isConnected) {
        // Remove any existing connection indicator
        const indicator = document.getElementById('connectionIndicator');
        if (indicator) {
            indicator.remove();
        }
        // Connection status indicator removed - using logout button instead
    }

    // Unified error handling
    handleError(error, context = 'Unknown') {
        console.error(`❌ Error in ${context}:`, error);

        // Determine error type and show appropriate message
        let message = 'An unexpected error occurred';
        let type = 'error';

        if (error.message.includes('Authentication') || error.message.includes('401')) {
            message = 'Authentication required. Redirecting to login...';
            type = 'warning';
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
            message = 'Network error. Please check your connection.';
            type = 'error';
        } else if (error.message.includes('500')) {
            message = 'Server error. Please try again later.';
            type = 'error';
        } else {
            message = error.message || message;
        }

        this.showNotification(`${context}: ${message}`, type);
    }

    // Section initialization methods
    async initializeDashboard() {
        console.log('Initializing Dashboard UI...');
        const section = document.getElementById('dashboardSection');
        if (!section) return;

        // Prevent duplicate initialization
        if (this.dashboardInitialized) {
            console.log('Dashboard already initialized, skipping...');
            return;
        }

        this.dashboardInitialized = true;

        // Render dashboard structure first
        this.modules.dashboardStats.renderDashboardStructure();

        // Setup enhanced controls after rendering
        setTimeout(() => {
            this.modules.dashboardStats.setupEnhancedControls();
        }, 100);

        // Load dashboard data only if not already loaded during init
        if (!this.isInitialized) {
            await this.loadDashboard('all', true);
        }
    }

    async initializeOrders() {
        console.log('Initializing Orders UI...');
        const section = document.getElementById('ordersSection');
        if (!section) return;

        // Create orders UI structure
        section.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h2 mb-1">📦 Orders Management</h1>
                    <p class="text-muted mb-0">Manage and track all customer orders</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" id="refreshOrders">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Search Orders</label>
                            <input type="text" class="form-control" id="orderSearch" placeholder="Search by ID or customer...">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="orderStatusFilter">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date Range</label>
                            <select class="form-select" id="orderDateFilter">
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button class="btn btn-outline-secondary w-100" onclick="document.getElementById('orderSearch').value=''; document.getElementById('orderStatusFilter').value='all'; document.getElementById('orderDateFilter').value='all'; window.AdminManager.filterOrders();">
                                <i class="fas fa-times"></i> Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Orders Table -->
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">All Orders</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="ordersTable">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="7" class="text-center">Loading orders...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for filters
        setTimeout(() => {
            const orderSearch = document.getElementById('orderSearch');
            const orderStatusFilter = document.getElementById('orderStatusFilter');
            const orderDateFilter = document.getElementById('orderDateFilter');
            const refreshOrders = document.getElementById('refreshOrders');

            if (orderSearch) {
                orderSearch.addEventListener('input', () => this.filterOrders());
            }
            if (orderStatusFilter) {
                orderStatusFilter.addEventListener('change', () => this.filterOrders());
            }
            if (orderDateFilter) {
                orderDateFilter.addEventListener('change', () => this.filterOrders());
            }
            if (refreshOrders) {
                refreshOrders.addEventListener('click', () => this.modules.orderManagement.loadAllOrders(true));
            }
        }, 100);

        // Load orders data
        await this.modules.orderManagement.loadAllOrders(true);
    }

    async initializeCustomers() {
        console.log('Initializing Customers UI...');
        const section = document.getElementById('customersSection');
        if (!section) return;

        section.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h2 mb-1">👥 Customer Management</h1>
                    <p class="text-muted mb-0">Manage customer accounts and information</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary" id="refreshCustomers">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Search Customers</label>
                            <input type="text" class="form-control" id="customerSearch" placeholder="Search by name or email...">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Customer Type</label>
                            <select class="form-select" id="customerTypeFilter">
                                <option value="all">All Types</option>
                                <option value="registered">Registered</option>
                                <option value="guest">Guest</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Sort By</label>
                            <select class="form-select" id="customerSortBy">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name">Name A-Z</option>
                                <option value="orders">Most Orders</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customers Table -->
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">All Customers</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="customersTable">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Type</th>
                                    <th>Orders</th>
                                    <th>Total Spent</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="7" class="text-center">Loading customers...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for filters
        setTimeout(() => {
            const customerSearch = document.getElementById('customerSearch');
            const customerTypeFilter = document.getElementById('customerTypeFilter');
            const customerSortBy = document.getElementById('customerSortBy');
            const refreshCustomers = document.getElementById('refreshCustomers');

            if (customerSearch) {
                customerSearch.addEventListener('input', () => this.filterCustomers());
            }
            if (customerTypeFilter) {
                customerTypeFilter.addEventListener('change', () => this.filterCustomers());
            }
            if (customerSortBy) {
                customerSortBy.addEventListener('change', () => this.filterCustomers());
            }
            if (refreshCustomers) {
                refreshCustomers.addEventListener('click', () => this.modules.customerManagement.loadCustomers());
            }
        }, 100);

        await this.modules.customerManagement.loadCustomers();
    }

    async initializeInventory() {
        console.log('Initializing Enhanced Inventory UI...');
        const section = document.getElementById('inventorySection');
        if (!section) return;

        section.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h2 mb-0">📦 Inventory Management</h1>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-success" onclick="inventoryManager.showAddItemModal()" id="addInventoryBtn">
                        <i class="fas fa-plus"></i> Add Item
                    </button>
                    <button class="btn btn-primary" onclick="inventoryManager.loadInventory()" id="refreshInventoryBtn">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            <!-- Inventory Filters -->
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label">
                                <i class="fas fa-search text-primary me-1"></i>Search Items
                            </label>
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Search by name or description..." id="inventorySearch">
                                <button class="btn btn-outline-secondary" type="button" onclick="inventoryManager.filterInventory()">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">
                                <i class="fas fa-tags text-secondary me-1"></i>Category
                            </label>
                            <select class="form-select" id="categoryFilter">
                                <option value="all">All Categories</option>
                                <option value="Flour">Flour</option>
                                <option value="Sugar">Sugar</option>
                                <option value="Dairy">Dairy</option>
                                <option value="Eggs">Eggs</option>
                                <option value="Flavoring">Flavoring</option>
                                <option value="Decoration">Decoration</option>
                                <option value="Packaging">Packaging</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">
                                <i class="fas fa-exclamation-triangle text-warning me-1"></i>Stock Status
                            </label>
                            <select class="form-select" id="stockFilter">
                                <option value="all">All Items</option>
                                <option value="in-stock">In Stock</option>
                                <option value="low-stock">Low Stock</option>
                                <option value="out-of-stock">Out of Stock</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <div class="d-flex gap-2 justify-content-end">
                                <!-- Export button removed as requested -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Inventory Table -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">
                        <i class="fas fa-boxes text-primary me-2"></i>Inventory Items
                        <span class="badge bg-primary ms-2" id="inventoryCount">0</span>
                    </h5>
                    <div class="d-flex gap-2">
                        <small class="text-muted align-self-center" id="inventoryLastUpdated">Last updated: Never</small>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle" id="inventoryTable">
                            <thead class="table-light sticky-top">
                                <tr>
                                    <th style="width: 50px;" class="text-center">
                                        <input type="checkbox" class="form-check-input" id="selectAllCheckbox" title="Select All">
                                    </th>
                                    <th style="width: 280px;">
                                        <i class="fas fa-cube text-primary me-2"></i>Item Details
                                    </th>
                                    <th style="width: 120px;" class="text-center">
                                        <i class="fas fa-tags text-secondary me-1"></i>Category
                                    </th>
                                    <th style="width: 140px;" class="text-center">
                                        <i class="fas fa-boxes text-success me-1"></i>Stock
                                    </th>
                                    <th style="width: 80px;" class="text-center">
                                        <i class="fas fa-ruler text-info me-1"></i>Unit
                                    </th>
                                    <th style="width: 120px;" class="text-center">
                                        <i class="fas fa-exclamation-triangle text-warning me-1"></i>Threshold
                                    </th>
                                    <th style="width: 140px;" class="text-center">
                                        <i class="fas fa-truck text-secondary me-1"></i>Supplier
                                    </th>
                                    <th style="width: 100px;" class="text-end">
                                        <i class="fas fa-dollar-sign text-success me-1"></i>Cost/Unit
                                    </th>
                                    <th style="width: 110px;" class="text-end">
                                        <i class="fas fa-calculator text-primary me-1"></i>Total Value
                                    </th>
                                    <th style="width: 100px;" class="text-center">
                                        <i class="fas fa-clock text-muted me-1"></i>Updated
                                    </th>
                                    <th style="width: 200px;" class="text-center">
                                        <i class="fas fa-cogs text-dark me-1"></i>Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="inventoryTableBody">
                                <tr><td colspan="11" class="text-center py-4">
                                    <div class="spinner-border text-primary mb-2" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <br>Loading inventory...
                                </td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for filters
        setTimeout(() => {
            const inventorySearch = document.getElementById('inventorySearch');
            const categoryFilter = document.getElementById('categoryFilter');
            const stockFilter = document.getElementById('stockFilter');

            if (inventorySearch) {
                inventorySearch.addEventListener('input', () => {
                    if (window.inventoryManager) {
                        window.inventoryManager.filterInventory();
                    }
                });
            }
            if (categoryFilter) {
                categoryFilter.addEventListener('change', () => {
                    if (window.inventoryManager) {
                        window.inventoryManager.filterInventory();
                    }
                });
            }
            if (stockFilter) {
                stockFilter.addEventListener('change', () => {
                    if (window.inventoryManager) {
                        window.inventoryManager.filterInventory();
                    }
                });
            }
        }, 100);

        // Use enhanced inventory management module if available
        if (window.inventoryManager) {
            console.log('✅ Using enhanced inventory management module');
            await window.inventoryManager.loadInventory();
        } else {
            console.log('⚠️ Enhanced inventory module not found, using fallback');
            await this.modules.inventoryManagement.loadInventory();
        }
    }

    async initializeReports() {
        console.log('Initializing Reports UI...');
        const section = document.getElementById('reportsSection');
        if (!section) return;

        section.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h2 mb-1">📊 Reports & Analytics</h1>
                    <p class="text-muted mb-0">Generate comprehensive business reports with live data</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-info" id="refreshReportBtn">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>

            <!-- Report Controls -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Time Period</label>
                            <select class="form-select" id="reportPeriodFilter">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month" selected>This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Report Type</label>
                            <select class="form-select" id="reportType">
                                <option value="sales" selected>Sales Report</option>
                                <option value="inventory">Inventory Report</option>
                                <option value="customers">Customer Report</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Start Date</label>
                            <input type="date" class="form-control" id="reportStartDate">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">End Date</label>
                            <input type="date" class="form-control" id="reportEndDate">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="row g-4 mb-4" id="reportSummaryCards">
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="text-primary mb-2">
                                <i class="fas fa-dollar-sign fa-2x"></i>
                            </div>
                            <h3 class="mb-1" id="reportTotalRevenue">$0.00</h3>
                            <p class="text-muted mb-0">Total Revenue</p>
                            <small class="text-muted" id="reportRevenueChange"></small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="text-success mb-2">
                                <i class="fas fa-shopping-bag fa-2x"></i>
                            </div>
                            <h3 class="mb-1" id="reportTotalOrders">0</h3>
                            <p class="text-muted mb-0">Total Orders</p>
                            <small class="text-muted" id="reportOrdersChange"></small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <div class="text-info mb-2">
                                <i class="fas fa-users fa-2x"></i>
                            </div>
                            <h3 class="mb-1" id="reportTotalCustomers">0</h3>
                            <p class="text-muted mb-0">Total Customers</p>
                            <small class="text-muted" id="reportCustomersChange"></small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="row g-4 mb-4" id="reportChartsRow">
                <div class="col-md-8">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-transparent border-0">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-chart-line text-primary me-2"></i>
                                Sales Trend
                            </h5>
                        </div>
                        <div class="card-body">
                            <div style="height: 300px;">
                                <canvas id="reportSalesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-transparent border-0">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-chart-pie text-success me-2"></i>
                                Top Products
                            </h5>
                        </div>
                        <div class="card-body">
                            <div style="height: 300px;">
                                <canvas id="reportCategoryChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Additional Summary Cards for Tax and Delivery -->
            <div class="row g-4 mb-4">
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm bg-light">
                        <div class="card-body text-center">
                            <div class="text-info mb-2">
                                <i class="fas fa-receipt fa-2x"></i>
                            </div>
                            <h4 class="mb-1 text-info" id="reportTotalTax">$0.00</h4>
                            <p class="text-muted mb-0">Total Tax Collected</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm bg-light">
                        <div class="card-body text-center">
                            <div class="text-warning mb-2">
                                <i class="fas fa-truck fa-2x"></i>
                            </div>
                            <h4 class="mb-1 text-warning" id="reportTotalDeliveryFee">$0.00</h4>
                            <p class="text-muted mb-0">Total Delivery Fees</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Report Table -->
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-transparent border-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-table text-info me-2"></i>
                            Detailed Report
                        </h5>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" id="exportTablePdf">
                                <i class="fas fa-file-pdf"></i> PDF
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Enhanced Table Controls -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="input-group input-group-sm">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                                <input type="text" class="form-control" id="tableSearchInput" placeholder="Search orders, customers, products...">
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-secondary" id="showAllRows">
                                    <i class="fas fa-eye"></i> Show All
                                </button>
                                <button class="btn btn-outline-secondary" id="showTop50">
                                    <i class="fas fa-list"></i> Top 50
                                </button>
                                <button class="btn btn-outline-secondary" id="showTop100">
                                    <i class="fas fa-list-ol"></i> Top 100
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive" style="max-height: 700px; overflow-y: auto;">
                        <table class="table table-hover align-middle table-striped" id="detailedReportTable">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th class="sortable" data-sort="orderId">
                                        <i class="fas fa-hashtag me-1"></i>Order ID
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable" data-sort="customerName">
                                        <i class="fas fa-user me-1"></i>Customer Name
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable text-center" data-sort="customerType">
                                        <i class="fas fa-user-tag me-1"></i>Type
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable" data-sort="date">
                                        <i class="fas fa-calendar me-1"></i>Order Date
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable" data-sort="productName">
                                        <i class="fas fa-birthday-cake me-1"></i>Product
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable text-center" data-sort="quantity">
                                        <i class="fas fa-boxes me-1"></i>Qty
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable text-end" data-sort="itemPrice">
                                        <i class="fas fa-tag me-1"></i>Unit Price
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable text-end" data-sort="itemSubtotal">
                                        <i class="fas fa-calculator me-1"></i>Item Total
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable text-center" data-sort="paymentMethod">
                                        <i class="fas fa-credit-card me-1"></i>Payment
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                    <th class="sortable text-center" data-sort="status">
                                        <i class="fas fa-info-circle me-1"></i>Status
                                        <i class="fas fa-sort ms-1"></i>
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="detailedReportTableBody">
                                <tr>
                                    <td colspan="10" class="text-center text-muted py-5">
                                        <div class="spinner-border text-primary mb-3" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                        <br>
                                        <h5>Loading detailed report data...</h5>
                                        <p>Please wait while we fetch the latest order information</p>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot class="table-dark sticky-bottom">
                                <tr>
                                    <th colspan="6" class="text-end fw-bold">
                                        <i class="fas fa-calculator me-2"></i>TOTALS:
                                    </th>
                                    <th class="text-end fw-bold" id="totalItemPrice">$0.00</th>
                                    <th class="text-end fw-bold text-success" id="totalItemSubtotal">$0.00</th>
                                    <th colspan="2" class="text-center">
                                        <span class="badge bg-info" id="totalOrderCount">0 Orders</span>
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for reports
        setTimeout(() => {
            const reportType = document.getElementById('reportType');
            const reportPeriodFilter = document.getElementById('reportPeriodFilter');
            const reportStartDate = document.getElementById('reportStartDate');
            const reportEndDate = document.getElementById('reportEndDate');
            const refreshReportBtn = document.getElementById('refreshReportBtn');

            const exportTablePdf = document.getElementById('exportTablePdf');

            // Set default dates
            if (reportStartDate && reportEndDate) {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                reportStartDate.value = lastMonth.toISOString().split('T')[0];
                reportEndDate.value = today.toISOString().split('T')[0];
            }

            // Period filter change
            if (reportPeriodFilter) {
                reportPeriodFilter.addEventListener('change', () => {
                    const period = reportPeriodFilter.value;
                    this.modules.reportsManagement.loadReports(period);
                });
            }

            // Report type change - auto-load reports
            if (reportType) {
                reportType.addEventListener('change', () => {
                    const period = reportPeriodFilter?.value || 'month';
                    this.modules.reportsManagement.loadReports(period);
                });
            }

            // Refresh button
            if (refreshReportBtn) {
                refreshReportBtn.addEventListener('click', () => {
                    const period = reportPeriodFilter?.value || 'month';
                    this.modules.reportsManagement.loadReports(period);
                });
            }

            // Export buttons (table only)
            if (exportTablePdf) {
                exportTablePdf.addEventListener('click', () => this.modules.reportsManagement.exportPDF());
            }
        }, 100);

        // Load reports data when the section is initialized (user navigated to reports)
        setTimeout(async () => {
            console.log('🔄 Loading reports data for active reports section...');
            await this.modules.reportsManagement.loadReports('month');
            console.log('✅ Reports data loaded for active section');
        }, 200);
    }

    async initializeContactMessages() {
        console.log('🚀 INITIALIZING CONTACT MESSAGES UI...');
        console.log('📧 Contact Messages section navigation triggered!');
        console.log('🔍 Looking for contact-messagesSection...');

        const section = document.getElementById('contact-messagesSection');
        if (!section) {
            console.error('❌ Contact Messages section not found!');
            console.error('❌ Available sections:', document.querySelectorAll('section[id$="Section"]'));
            return;
        }
        console.log('✅ Contact Messages section found:', section);
        console.log('📄 Section current content:', section.innerHTML.substring(0, 100) + '...');

        try {
            // Load contact messages content from partial
            console.log('📄 Loading contact messages content from partial...');
            const response = await fetch('/partials/admin-contact-messages-content.html');
            if (!response.ok) {
                throw new Error(`Failed to load content: ${response.status}`);
            }

            const content = await response.text();
            section.innerHTML = content;
            console.log('✅ Contact messages content loaded successfully');

            // Load the message detail modal into the main document if it doesn't exist
            if (!document.getElementById('messageModal')) {
                const modalHtml = content.match(/<div class="modal fade" id="messageModal"[\s\S]*?<\/div>\s*$/);
                if (modalHtml) {
                    document.body.insertAdjacentHTML('beforeend', modalHtml[0]);
                }
            }

        } catch (error) {
            console.error('❌ Error loading contact messages content:', error);
            // Fallback to inline content
            section.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 class="h2 mb-1">💬 Contact Messages</h1>
                        <p class="text-muted mb-0">Manage customer inquiries and messages</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" id="refreshMessages">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                </div>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Contact messages interface is loading. Please wait...
                </div>
            `;
        }

        // Add event listeners for filters after content is loaded
        setTimeout(() => {
            console.log('🔗 Setting up contact messages event listeners...');

            const messageSearch = document.getElementById('messageSearch');
            const messageStatusFilter = document.getElementById('messageStatusFilter');
            const messageDateFilter = document.getElementById('messageDateFilter');
            const refreshMessages = document.getElementById('refreshMessages');
            const clearFilters = document.getElementById('clearFilters');
            const markAllRead = document.getElementById('markAllRead');
            const deleteSelected = document.getElementById('deleteSelected');
            const selectAllMessages = document.getElementById('selectAllMessages');

            if (messageSearch) {
                console.log('✅ Message search input found');
                messageSearch.addEventListener('input', (e) => {
                    this.modules.contactManagement.filterMessages(
                        e.target.value,
                        messageStatusFilter?.value || 'all',
                        messageDateFilter?.value || 'all'
                    );
                });
            }
            if (messageStatusFilter) {
                console.log('✅ Message status filter found');
                messageStatusFilter.addEventListener('change', (e) => {
                    this.modules.contactManagement.filterMessages(
                        messageSearch?.value || '',
                        e.target.value,
                        messageDateFilter?.value || 'all'
                    );
                });
            }
            if (messageDateFilter) {
                console.log('✅ Message date filter found');
                messageDateFilter.addEventListener('change', (e) => {
                    this.modules.contactManagement.filterMessages(
                        messageSearch?.value || '',
                        messageStatusFilter?.value || 'all',
                        e.target.value
                    );
                });
            }
            if (clearFilters) {
                console.log('✅ Clear filters button found');
                clearFilters.addEventListener('click', () => {
                    if (messageSearch) messageSearch.value = '';
                    if (messageStatusFilter) messageStatusFilter.value = 'all';
                    if (messageDateFilter) messageDateFilter.value = 'all';
                    this.modules.contactManagement.filterMessages('', 'all', 'all');
                });
            }
            if (refreshMessages) {
                console.log('✅ Refresh messages button found');
                refreshMessages.addEventListener('click', () => this.modules.contactManagement.loadMessages());
            }
            if (markAllRead) {
                console.log('✅ Mark all read button found');
                markAllRead.addEventListener('click', () => this.modules.contactManagement.markAllAsRead());
            }
            if (deleteSelected) {
                console.log('✅ Delete selected button found');
                deleteSelected.addEventListener('click', () => this.modules.contactManagement.deleteSelectedMessages());
            }
            if (selectAllMessages) {
                console.log('✅ Select all messages checkbox found');
                selectAllMessages.addEventListener('change', (e) => {
                    const checkboxes = document.querySelectorAll('.message-checkbox');
                    checkboxes.forEach(cb => cb.checked = e.target.checked);
                });
            }

            console.log('🔗 Contact messages event listeners setup complete');
        }, 100);

        // Initialize contact management module if not already done
        console.log('🔧 Initializing contact management module...');
        if (!this.modules.contactManagement) {
            this.modules.contactManagement = new ContactManagement();
            console.log('✅ Contact management module created');
        }

        // Load messages data
        console.log('📊 Loading contact messages data...');
        const messages = await this.modules.contactManagement.loadMessages();
        console.log('✅ Contact messages data loaded successfully');
        console.log('📊 Total messages loaded:', messages.length);

        // If no messages found, show helpful message
        if (messages.length === 0) {
            console.log('ℹ️ No contact messages found in database');
            const tbody = document.querySelector('#messagesTable tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i><br>
                            <h5 class="text-muted">No Contact Messages</h5>
                            <p class="text-muted">No contact messages have been received yet.</p>
                            <small class="text-muted">Messages from the contact form will appear here.</small>
                        </td>
                    </tr>
                `;
            }
        }
    }

    async initializeSettings() {
        console.log('Initializing Integrated Settings UI...');
        const section = document.getElementById('settingsSection');
        if (!section) {
            console.error('Settings section not found');
            return;
        }

        // The settings content is already in the HTML, so we just need to set up event listeners
        console.log('✅ Settings section found, setting up event listeners...');

        // Add event listeners for settings functionality
        setTimeout(() => {
            // Save settings button
            const saveSettingsBtn = document.getElementById('saveSettingsBtn');
            if (saveSettingsBtn) {
                saveSettingsBtn.addEventListener('click', () => this.saveAllSettings());
            }

            // Test email button
            const testEmailBtn = document.getElementById('testEmailBtn');
            if (testEmailBtn) {
                testEmailBtn.addEventListener('click', () => this.testEmailConfiguration());
            }

            // Test SMS button
            const testSmsBtn = document.getElementById('testSmsBtn');
            if (testSmsBtn) {
                testSmsBtn.addEventListener('click', () => this.testSmsConfiguration());
            }

            // View customer credentials button
            const viewCustomerCredentialsBtn = document.getElementById('viewCustomerCredentialsBtn');
            if (viewCustomerCredentialsBtn) {
                viewCustomerCredentialsBtn.addEventListener('click', () => this.viewCustomerCredentials());
            }

            // Reset all passwords button
            const resetAllPasswordsBtn = document.getElementById('resetAllPasswordsBtn');
            if (resetAllPasswordsBtn) {
                resetAllPasswordsBtn.addEventListener('click', () => this.resetAllCustomerPasswords());
            }

            console.log('✅ Settings event listeners setup complete');
        }, 100);

        // Load current settings from backend
        await this.loadCurrentSettings();
    }

    // Settings management methods
    async loadCurrentSettings() {
        try {
            console.log('Loading current settings from backend...');

            // Load settings from the AdminSettings module
            if (this.modules.adminSettings) {
                await this.modules.adminSettings.loadSettings();
            }

            console.log('✅ Current settings loaded');
        } catch (error) {
            console.error('Error loading current settings:', error);
            this.showNotification('Error loading settings', 'error');
        }
    }

    async saveAllSettings() {
        try {
            console.log('Saving all settings...');

            // Collect all form data from the settings tabs
            const settingsData = {
                // General settings
                businessName: document.getElementById('businessName')?.value || '',
                businessEmail: document.getElementById('businessEmail')?.value || '',
                businessPhone: document.getElementById('businessPhone')?.value || '',
                businessWebsite: document.getElementById('businessWebsite')?.value || '',
                businessAddress: document.getElementById('businessAddress')?.value || '',
                deliveryFee: parseFloat(document.getElementById('deliveryFee')?.value || 0),
                deliveryRadius: parseInt(document.getElementById('deliveryRadius')?.value || 0),
                enableDelivery: document.getElementById('enableDelivery')?.checked || false,
                enablePickup: document.getElementById('enablePickup')?.checked || false,

                // Email settings
                smtpHost: document.getElementById('smtpHost')?.value || '',
                smtpPort: parseInt(document.getElementById('smtpPort')?.value || 587),
                smtpUser: document.getElementById('smtpUser')?.value || '',
                smtpPassword: document.getElementById('smtpPassword')?.value || '',
                fromEmail: document.getElementById('fromEmail')?.value || '',
                fromName: document.getElementById('fromName')?.value || '',

                // SMS settings
                smsProvider: document.getElementById('smsProvider')?.value || '',
                afroMessageApiKey: document.getElementById('afroMessageApiKey')?.value || '',
                afroMessageSender: document.getElementById('afroMessageSender')?.value || '',
                afroMessageIdentifierId: document.getElementById('afroMessageIdentifierId')?.value || '',

                // Notification settings
                emailOrderConfirmation: document.getElementById('emailOrderConfirmation')?.checked || false,
                emailOrderReady: document.getElementById('emailOrderReady')?.checked || false,
                emailPasswordReset: document.getElementById('emailPasswordReset')?.checked || false,
                smsOrderConfirmation: document.getElementById('smsOrderConfirmation')?.checked || false,
                smsOrderReady: document.getElementById('smsOrderReady')?.checked || false,

                // Security settings
                otpExpiryMinutes: parseInt(document.getElementById('otpExpiryMinutes')?.value || 10),
                maxOtpAttempts: parseInt(document.getElementById('maxOtpAttempts')?.value || 3)
            };

            // Save settings using the AdminSettings module
            if (this.modules.adminSettings) {
                await this.modules.adminSettings.saveSettings(settingsData);
            }

            console.log('✅ Settings saved successfully!');

            // Update save button to show success
            const saveBtn = document.getElementById('saveSettingsBtn');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-check me-1"></i> Settings Saved!';
                saveBtn.classList.add('btn-success');
                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.classList.remove('btn-success');
                }, 3000);
            }

        } catch (error) {
            console.error('❌ Error saving settings:', error);

            // Update save button to show error
            const saveBtn = document.getElementById('saveSettingsBtn');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-times me-1"></i> Save Failed';
                saveBtn.classList.add('btn-danger');
                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.classList.remove('btn-danger');
                }, 3000);
            }
        }
    }

    async testEmailConfiguration() {
        const testBtn = document.getElementById('testEmailBtn');
        const originalText = '<i class="fas fa-paper-plane me-1"></i>Send Test Email';

        // Reset button function
        const resetButton = () => {
            if (testBtn) {
                testBtn.innerHTML = originalText;
                testBtn.disabled = false;
                testBtn.className = 'btn btn-outline-primary w-100';
            }
        };

        try {
            const testEmail = document.getElementById('testEmailAddress')?.value;
            if (!testEmail) {
                console.log('⚠️ Please enter a test email address');
                // Update button to show validation message
                if (testBtn) {
                    testBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Enter Email Address';
                    testBtn.className = 'btn btn-warning w-100';
                    setTimeout(resetButton, 2000);
                }
                return;
            }

            console.log('🧪 Testing email configuration...');

            // Update button to show loading state
            if (testBtn) {
                testBtn.disabled = true;
                testBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Sending Test Email...';
                testBtn.className = 'btn btn-primary w-100';

                // Safety timeout to reset button if something goes wrong
                setTimeout(() => {
                    if (testBtn.disabled) {
                        console.log('⚠️ Button reset due to timeout');
                        resetButton();
                    }
                }, 15000); // 15 second timeout
            }

            // Collect current email settings from the form
            const emailSettings = {
                smtpHost: document.getElementById('smtpHost')?.value || '',
                smtpPort: parseInt(document.getElementById('smtpPort')?.value || 587),
                smtpUser: document.getElementById('smtpUser')?.value || '',
                smtpPassword: document.getElementById('smtpPassword')?.value || '',
                fromEmail: document.getElementById('fromEmail')?.value || '',
                fromName: document.getElementById('fromName')?.value || ''
            };

            // Call the test email endpoint with current settings
            const response = await fetch('/api/settings/test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    testEmail,
                    emailSettings
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ Test email sent successfully to ${testEmail}!`);
                console.log('📧 Email test details:', result.details);

                // Update button to show success
                if (testBtn) {
                    testBtn.innerHTML = '<i class="fas fa-check me-1"></i> Email Sent Successfully!';
                    testBtn.className = 'btn btn-success w-100';
                    setTimeout(resetButton, 3000);
                }
            } else {
                console.error('❌ Failed to send test email:', result.message);

                // Update button to show error
                if (testBtn) {
                    testBtn.innerHTML = '<i class="fas fa-times me-1"></i> Failed to Send';
                    testBtn.className = 'btn btn-danger w-100';
                    setTimeout(resetButton, 3000);
                }
            }

        } catch (error) {
            console.error('❌ Error testing email configuration:', error);

            // Update button to show error
            if (testBtn) {
                testBtn.innerHTML = '<i class="fas fa-times me-1"></i> Error Occurred';
                testBtn.className = 'btn btn-danger w-100';
                setTimeout(resetButton, 3000);
            }
        }
    }

    // Manual button reset function for emergency use
    resetEmailTestButton() {
        const testBtn = document.getElementById('testEmailBtn');
        if (testBtn) {
            testBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i>Send Test Email';
            testBtn.disabled = false;
            testBtn.className = 'btn btn-outline-primary w-100';
            console.log('🔄 Email test button manually reset');
        }
    }

    resetSmsTestButton() {
        const testBtn = document.getElementById('testSmsBtn');
        if (testBtn) {
            testBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i>Send Test SMS';
            testBtn.disabled = false;
            testBtn.className = 'btn btn-outline-primary w-100';
            console.log('🔄 SMS test button manually reset');
        }
    }

    async testSmsConfiguration() {
        try {
            const testNumber = document.getElementById('testSmsNumber')?.value;
            if (!testNumber) {
                console.log('⚠️ Please enter a test phone number');
                // Update button to show validation message
                const testBtn = document.getElementById('testSmsBtn');
                if (testBtn) {
                    const originalText = testBtn.innerHTML;
                    testBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Enter Phone Number';
                    testBtn.classList.add('btn-warning');
                    setTimeout(() => {
                        testBtn.innerHTML = originalText;
                        testBtn.classList.remove('btn-warning');
                    }, 2000);
                }
                return;
            }

            console.log('📱 Testing SMS configuration...');

            // Update button to show loading state
            const testBtn = document.getElementById('testSmsBtn');
            const originalText = testBtn?.innerHTML;
            if (testBtn) {
                testBtn.disabled = true;
                testBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Sending Test SMS...';
            }

            // Collect current SMS settings from the form
            const smsSettings = {
                provider: document.getElementById('smsProvider')?.value || 'afromessage',
                afroMessageApiKey: document.getElementById('afroMessageApiKey')?.value || '',
                afroMessageSender: document.getElementById('afroMessageSender')?.value || '',
                afroMessageIdentifierId: document.getElementById('afroMessageIdentifierId')?.value || '',
                // Twilio settings (if needed)
                accountSid: document.getElementById('twilioAccountSid')?.value || '',
                authToken: document.getElementById('twilioAuthToken')?.value || '',
                fromNumber: document.getElementById('twilioFromNumber')?.value || ''
            };

            // Call the test SMS endpoint with current settings
            const response = await fetch('/api/settings/test-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    testPhone: testNumber,
                    smsSettings
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ Test SMS sent successfully to ${testNumber}!`);
                console.log('📱 SMS test details:', result.details);

                // Update button to show success
                if (testBtn) {
                    testBtn.innerHTML = '<i class="fas fa-check me-1"></i> SMS Sent Successfully!';
                    testBtn.classList.add('btn-success');
                    setTimeout(() => {
                        testBtn.innerHTML = originalText;
                        testBtn.classList.remove('btn-success');
                        testBtn.disabled = false;
                    }, 3000);
                }
            } else {
                console.error('❌ Failed to send test SMS:', result.message);

                // Handle special cases with helpful messages
                if (result.solution && result.solution.success) {
                    console.log('✅ SMS Configuration Working! ' + result.message);
                    this.showSmsTestResultModal(result);
                } else {
                    if (result.solution) {
                        this.showSmsTestResultModal(result);
                    }
                }

                // Update button to show error
                if (testBtn) {
                    testBtn.innerHTML = '<i class="fas fa-times me-1"></i> Failed to Send';
                    testBtn.classList.add('btn-danger');
                    setTimeout(() => {
                        testBtn.innerHTML = originalText;
                        testBtn.classList.remove('btn-danger');
                        testBtn.disabled = false;
                    }, 3000);
                }
            }

        } catch (error) {
            console.error('❌ Error testing SMS configuration:', error);

            // Update button to show error
            const testBtn = document.getElementById('testSmsBtn');
            if (testBtn) {
                const originalText = testBtn.innerHTML;
                testBtn.innerHTML = '<i class="fas fa-times me-1"></i> Error Occurred';
                testBtn.classList.add('btn-danger');
                setTimeout(() => {
                    testBtn.innerHTML = originalText;
                    testBtn.classList.remove('btn-danger');
                    testBtn.disabled = false;
                }, 3000);
            }
        }
    }

    showSmsTestResultModal(result) {
        const modalHtml = `
            <div class="modal fade" id="smsTestResultModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                ${result.success ? '✅ SMS Test Result' : '❌ SMS Test Result'}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert ${result.success ? 'alert-success' : 'alert-warning'}">
                                <h6><strong>Status:</strong> ${result.message}</h6>
                            </div>

                            ${result.solution ? `
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">📋 Solution Details</h6>
                                    </div>
                                    <div class="card-body">
                                        <p><strong>Issue:</strong> ${result.solution.issue || 'SMS configuration issue'}</p>
                                        ${result.solution.steps ? `
                                            <h6>Steps to resolve:</h6>
                                            <ol>
                                                ${result.solution.steps.map(step => `<li>${step}</li>`).join('')}
                                            </ol>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}

                            ${result.details ? `
                                <div class="card mt-3">
                                    <div class="card-header">
                                        <h6 class="mb-0">📊 Test Details</h6>
                                    </div>
                                    <div class="card-body">
                                        <ul class="list-unstyled">
                                            <li><strong>Provider:</strong> ${result.details.provider}</li>
                                            <li><strong>Recipient:</strong> ${result.details.recipient || 'N/A'}</li>
                                            <li><strong>Message ID:</strong> ${result.details.messageId || 'N/A'}</li>
                                            <li><strong>Sent At:</strong> ${result.details.sentAt || 'N/A'}</li>
                                        </ul>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('smsTestResultModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('smsTestResultModal'));
        modal.show();
    }

    async viewCustomerCredentials() {
        try {
            console.log('Fetching customer credentials...');

            const response = await fetch('/api/customers/admin/credentials/all', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (result.success) {
                // Create a modal to display the credentials
                this.showCustomerCredentialsModal(result.data);
            } else {
                this.showNotification('Failed to fetch customer credentials: ' + result.message, 'error');
            }

        } catch (error) {
            console.error('Error fetching customer credentials:', error);
            this.showNotification('Error fetching customer credentials', 'error');
        }
    }

    async resetAllCustomerPasswords() {
        const confirmed = confirm('⚠️ WARNING: This will reset ALL customer passwords to a temporary password. Are you sure you want to continue?');
        if (!confirmed) return;

        const tempPassword = prompt('Enter the temporary password to set for all customers:', 'TempPass123!');
        if (!tempPassword) return;

        try {
            console.log('Resetting all customer passwords...');
            this.showNotification('Resetting all customer passwords...', 'info');

            const response = await fetch('/api/customers/admin/reset-passwords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ tempPassword })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`Password reset completed! ${result.data.successCount} customers updated.`, 'success');
                this.showPasswordResetResultsModal(result.data);
            } else {
                this.showNotification('Failed to reset passwords: ' + result.message, 'error');
            }

        } catch (error) {
            console.error('Error resetting passwords:', error);
            this.showNotification('Error resetting customer passwords', 'error');
        }
    }

    showCustomerCredentialsModal(customers) {
        const modalHtml = `
            <div class="modal fade" id="customerCredentialsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Customer Credentials</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Has Password</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${customers.map(customer => `
                                            <tr>
                                                <td>${customer.name}</td>
                                                <td>${customer.email}</td>
                                                <td>
                                                    <span class="badge ${customer.hasPassword ? 'bg-success' : 'bg-warning'}">
                                                        ${customer.hasPassword ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('customerCredentialsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('customerCredentialsModal'));
        modal.show();
    }

    showPasswordResetResultsModal(results) {
        const modalHtml = `
            <div class="modal fade" id="passwordResetResultsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Password Reset Results</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <strong>Temporary Password:</strong> <code>${results.tempPassword}</code>
                            </div>
                            <p><strong>Summary:</strong> ${results.successCount} successful, ${results.failedCount} failed out of ${results.totalCustomers} customers.</p>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${results.results.map(result => `
                                            <tr>
                                                <td>${result.name}</td>
                                                <td>${result.email}</td>
                                                <td>
                                                    <span class="badge ${result.status === 'success' ? 'bg-success' : 'bg-danger'}">
                                                        ${result.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('passwordResetResultsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('passwordResetResultsModal'));
        modal.show();
    }

    // System health check
    async performSystemHealthCheck() {
        console.log('🔍 Performing system health check...');

        const healthChecks = [
            { name: 'Orders API', endpoint: '/api/orders?limit=1' },
            { name: 'Customers API', endpoint: '/api/customers' },
            { name: 'Inventory API', endpoint: '/api/inventory' },
            { name: 'Reports API', endpoint: '/api/reports/sales?startDate=2025-01-01&endDate=2025-01-02' },
            { name: 'Settings API', endpoint: '/api/settings' }
        ];

        const results = [];

        for (const check of healthChecks) {
            try {
                const response = await fetch(check.endpoint, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                results.push({
                    name: check.name,
                    status: response.ok ? 'healthy' : 'unhealthy',
                    responseTime: Date.now()
                });

                if (response.ok) {
                    console.log(`✅ ${check.name}: Healthy`);
                } else {
                    console.warn(`⚠️ ${check.name}: Unhealthy (${response.status})`);
                }
            } catch (error) {
                console.error(`❌ ${check.name}: Error -`, error.message);
                results.push({
                    name: check.name,
                    status: 'error',
                    error: error.message
                });
            }
        }

        const healthyCount = results.filter(r => r.status === 'healthy').length;
        const totalCount = results.length;

        console.log(`🏥 System Health: ${healthyCount}/${totalCount} services healthy`);

        if (healthyCount === totalCount) {
            console.log('✅ All systems operational');
        } else if (healthyCount > totalCount / 2) {
            console.warn('⚠️ Some services experiencing issues');
            this.showNotification(`${healthyCount}/${totalCount} services healthy`, 'warning');
        } else {
            console.error('❌ Multiple system failures detected');
            this.showNotification('Multiple system failures detected', 'error');
        }

        return results;
    }

    // Public methods for global access
    editOrder(orderId) {
        return this.modules.orderManagement.editOrder(orderId);
    }

    acceptOrder(orderId) {
        return this.modules.orderManagement.acceptOrder(orderId);
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Failed to update order status');
            }

            this.showNotification(`Order status updated to ${newStatus}`, 'success');

            // Close any open modals
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) modalInstance.hide();
            });

            // Refresh orders
            this.modules.orderManagement.loadAllOrders(true);
            this.modules.orderManagement.loadRecentOrders();

        } catch (error) {
            console.error('Error updating order status:', error);
            this.showNotification('Error updating order status: ' + error.message, 'error');
        }
    }

    showCancelOrderModal(orderId) {
        const reason = prompt('Please enter the reason for cancelling this order:');
        if (reason && reason.trim()) {
            this.cancelOrder(orderId, reason.trim());
        }
    }

    async cancelOrder(orderId, reason) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: reason })
            });

            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }

            this.showNotification('Order cancelled successfully', 'success');

            // Close any open modals
            const modals = document.querySelectorAll('.modal.show');
            modals.forEach(modal => {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) modalInstance.hide();
            });

            // Refresh orders
            this.modules.orderManagement.loadAllOrders(true);
            this.modules.orderManagement.loadRecentOrders();

        } catch (error) {
            console.error('Error cancelling order:', error);
            this.showNotification('Error cancelling order: ' + error.message, 'error');
        }
    }

    printOrder(orderId) {
        // Open order details in a new window for printing
        const printWindow = window.open(`/admin/orders/${orderId}/print`, '_blank');
        if (printWindow) {
            printWindow.focus();
        } else {
            this.showNotification('Please allow popups to print orders', 'warning');
        }
    }

    showPaymentProofModal(imageUrl, imageName) {
        return this.modules.orderManagement.showPaymentProofModal(imageUrl, imageName);
    }

    viewCustomer(customerId) {
        return this.modules.customerManagement.viewCustomer(customerId);
    }

    editCustomer(customerId) {
        return this.modules.customerManagement.editCustomer(customerId);
    }

    emailCustomer(customerId) {
        return this.modules.customerManagement.emailCustomer(customerId);
    }

    restockItem(itemId) {
        return this.modules.inventoryManagement.restockItem(itemId);
    }

    editItem(itemId) {
        return this.modules.inventoryManagement.editItem(itemId);
    }

    deleteItem(itemId) {
        return this.modules.inventoryManagement.deleteItem(itemId);
    }

    // Filter methods for UI
    filterOrders() {
        const searchTerm = document.getElementById('orderSearch')?.value || '';
        const statusFilter = document.getElementById('orderStatusFilter')?.value || 'all';
        const dateFilter = document.getElementById('orderDateFilter')?.value || 'all';

        this.modules.orderManagement.filterOrders(searchTerm, statusFilter, dateFilter);
    }

    filterCustomers() {
        const searchTerm = document.getElementById('customerSearch')?.value || '';
        const typeFilter = document.getElementById('customerTypeFilter')?.value || 'all';
        const sortBy = document.getElementById('customerSortBy')?.value || 'newest';

        this.modules.customerManagement.filterCustomers(searchTerm, typeFilter, sortBy);
    }

    filterInventory() {
        const searchTerm = document.getElementById('inventorySearch')?.value || '';
        const categoryFilter = document.getElementById('inventoryCategoryFilter')?.value || 'all';
        const stockFilter = document.getElementById('inventoryStockFilter')?.value || 'all';

        this.modules.inventoryManagement.filterInventory(searchTerm, categoryFilter, stockFilter);
    }

    filterMessages() {
        const searchTerm = document.getElementById('messageSearch')?.value || '';
        const statusFilter = document.getElementById('messageStatusFilter')?.value || 'all';
        const dateFilter = document.getElementById('messageDateFilter')?.value || 'all';

        this.modules.contactManagement.filterMessages(searchTerm, statusFilter, dateFilter);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.AdminManager = new AdminManager();

    // Create global references for backward compatibility
    window.OrderManager = window.AdminManager;
    window.CustomerManager = window.AdminManager;
    window.InventoryManager = window.AdminManager;
    window.ReportsManager = window.AdminManager;
    window.ContactManager = window.AdminManager;

    await window.AdminManager.init();
});
