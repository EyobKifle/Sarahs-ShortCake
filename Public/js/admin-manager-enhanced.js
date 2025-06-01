/**
 * 🚀 Enhanced Admin Manager - Modern Dashboard Controller
 * Handles all admin dashboard functionality with enhanced UX
 */
class EnhancedAdminManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.modules = {};
        this.notifications = [];
        this.realTimeUpdates = true;
        this.updateInterval = null;
        this.searchTimeout = null;

        // 🎯 Initialize module instances
        this.initializeModules();

        // 🎨 Bind methods
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleGlobalSearch = this.handleGlobalSearch.bind(this);
        this.handleNotifications = this.handleNotifications.bind(this);
        this.handleUserActions = this.handleUserActions.bind(this);
    }

    /**
     * 🎯 Initialize all dashboard modules
     */
    initializeModules() {
        try {
            // Core modules
            this.modules.dashboardStats = new DashboardStats();
            this.modules.dashboardCharts = new DashboardCharts();
            this.modules.orderManagement = new OrderManagement();
            this.modules.customerManagement = new CustomerManagement();
            this.modules.inventoryManagement = new InventoryManagement();
            this.modules.reportsManagement = new ReportsManagement();
            this.modules.contactManagement = new ContactManagement();
            this.modules.adminSettings = new AdminSettings();
            this.modules.systemHealth = new SystemHealth();
            this.modules.testingManagement = new TestingManagement();

            console.log('✅ All admin modules initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing modules:', error);
            this.showToast('Error initializing dashboard modules', 'error');
        }
    }

    /**
     * 🚀 Initialize the enhanced admin dashboard
     */
    async init() {
        try {
            console.log('🚀 Initializing Enhanced Admin Dashboard...');

            // Show loading screen
            this.showLoadingScreen();

            // Check authentication
            await this.checkAuthentication();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize UI components
            this.initializeUI();

            // Load initial data
            await this.loadInitialData();

            // Start real-time updates
            this.startRealTimeUpdates();

            // Hide loading screen
            this.hideLoadingScreen();

            // Show welcome message
            this.showWelcomeMessage();

            console.log('✅ Enhanced Admin Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing admin dashboard:', error);
            this.hideLoadingScreen();
            this.showToast('Failed to initialize dashboard', 'error');
        }
    }

    /**
     * 🔒 Check user authentication
     */
    async checkAuthentication() {
        try {
            const response = await fetch('/api/admin/auth/check', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();

            if (!data.authenticated) {
                window.location.href = '/admin-login.html';
                return;
            }

            // Update user info in UI
            this.updateUserInfo(data.user);

        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            window.location.href = '/admin-login.html';
        }
    }

    /**
     * 🎨 Setup all event listeners
     */
    setupEventListeners() {
        // Navigation
        document.addEventListener('click', this.handleNavigation);

        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', this.handleGlobalSearch);
            globalSearch.addEventListener('focus', () => {
                document.querySelector('.search-container').classList.add('focused');
            });
            globalSearch.addEventListener('blur', () => {
                setTimeout(() => {
                    document.querySelector('.search-container').classList.remove('focused');
                }, 200);
            });
        }

        // Notifications
        document.addEventListener('click', this.handleNotifications);

        // User actions
        document.addEventListener('click', this.handleUserActions);

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Window events
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    /**
     * 🎯 Handle navigation between sections
     */
    handleNavigation(event) {
        const target = event.target.closest('[data-section]');
        if (!target) return;

        event.preventDefault();

        const section = target.dataset.section;
        this.navigateToSection(section);
    }

    /**
     * 🔄 Navigate to a specific section
     */
    async navigateToSection(section) {
        if (section === this.currentSection) return;

        try {
            // Update navigation state
            this.updateNavigationState(section);

            // Hide current section
            this.hideCurrentSection();

            // Show loading for section
            this.showSectionLoading(section);

            // Load section content
            await this.loadSectionContent(section);

            // Show new section
            this.showSection(section);

            // Update current section
            this.currentSection = section;

            // Update URL without page reload
            this.updateURL(section);

            // Track navigation
            this.trackNavigation(section);

        } catch (error) {
            console.error(`❌ Error navigating to ${section}:`, error);
            this.showToast(`Failed to load ${section} section`, 'error');
        }
    }

    /**
     * 🔍 Handle global search
     */
    handleGlobalSearch(event) {
        const query = event.target.value.trim();

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performGlobalSearch(query);
        }, 300);
    }

    /**
     * 🔍 Perform global search across all data
     */
    async performGlobalSearch(query) {
        if (!query) {
            this.hideSearchResults();
            return;
        }

        try {
            const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();

            this.displaySearchResults(results);

        } catch (error) {
            console.error('❌ Search error:', error);
            this.showToast('Search failed', 'error');
        }
    }

    /**
     * 🎨 Initialize UI components
     */
    initializeUI() {
        // Initialize tooltips
        this.initializeTooltips();

        // Initialize modals
        this.initializeModals();

        // Initialize dropdowns
        this.initializeDropdowns();

        // Initialize theme
        this.initializeTheme();

        // Initialize responsive features
        this.initializeResponsive();
    }

    /**
     * 📊 Load initial dashboard data
     */
    async loadInitialData() {
        try {
            // Load dashboard section by default
            await this.loadSectionContent('dashboard');

            // Load notification count
            await this.loadNotificationCount();

            // Load pending orders count
            await this.loadPendingOrdersCount();

            // Load low stock count
            await this.loadLowStockCount();

            // Load unread messages count
            await this.loadUnreadMessagesCount();

        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.showToast('Failed to load initial data', 'error');
        }
    }

    /**
     * 📊 Load content for a specific section
     */
    async loadSectionContent(section) {
        const module = this.getModuleForSection(section);
        if (module && typeof module.load === 'function') {
            await module.load();
        }
    }

    /**
     * 🎯 Get module instance for section
     */
    getModuleForSection(section) {
        const moduleMap = {
            'dashboard': this.modules.dashboardStats,
            'orders': this.modules.orderManagement,
            'customers': this.modules.customerManagement,
            'products': this.modules.inventoryManagement,
            'inventory': this.modules.inventoryManagement,
            'reports': this.modules.reportsManagement,
            'analytics': this.modules.dashboardCharts,
            'contact-messages': this.modules.contactManagement,
            'notifications': this.modules.adminSettings,
            'settings': this.modules.adminSettings,
            'system-health': this.modules.systemHealth,
            'testing': this.modules.testingManagement
        };

        return moduleMap[section];
    }

    /**
     * ⏱️ Start real-time updates
     */
    startRealTimeUpdates() {
        if (!this.realTimeUpdates) return;

        this.updateInterval = setInterval(() => {
            this.performRealTimeUpdate();
        }, 30000); // Update every 30 seconds
    }

    /**
     * 🔄 Perform real-time update
     */
    async performRealTimeUpdate() {
        try {
            // Update notification count
            await this.loadNotificationCount();

            // Update pending orders count
            await this.loadPendingOrdersCount();

            // Update current section if needed
            const module = this.getModuleForSection(this.currentSection);
            if (module && typeof module.refresh === 'function') {
                await module.refresh();
            }

        } catch (error) {
            console.error('❌ Real-time update error:', error);
        }
    }

    /**
     * 🎨 Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';

            // Animate loading bar
            setTimeout(() => {
                const loadingBar = loadingScreen.querySelector('.loading-bar');
                if (loadingBar) {
                    loadingBar.style.width = '100%';
                }
            }, 100);
        }
    }

    /**
     * 🎨 Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }, 500);
        }
    }

    /**
     * 🎉 Show welcome message
     */
    showWelcomeMessage() {
        this.showToast('Welcome to the Enhanced Admin Dashboard! 🎉', 'success', 5000);
    }

    /**
     * 🍞 Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const toastHTML = `
            <div class="toast align-items-center text-bg-${type} border-0" role="alert" id="${toastId}">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center">
                        <i class="${iconMap[type]} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: duration });
        toast.show();

        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    /**
     * 🔄 Update user info in UI
     */
    updateUserInfo(user) {
        const adminWelcome = document.getElementById('adminWelcome');
        const userFullName = document.getElementById('userFullName');
        const userEmail = document.getElementById('userEmail');

        if (adminWelcome) adminWelcome.textContent = user.name || 'Admin';
        if (userFullName) userFullName.textContent = user.name || 'Admin User';
        if (userEmail) userEmail.textContent = user.email || 'admin@sarahsshortcakes.com';
    }

    /**
     * 🎯 Update navigation state
     */
    updateNavigationState(section) {
        // Remove active class from all nav links
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current section
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * 🔄 Update URL without page reload
     */
    updateURL(section) {
        const url = new URL(window.location);
        url.searchParams.set('section', section);
        window.history.pushState({ section }, '', url);
    }

    /**
     * 📊 Track navigation for analytics
     */
    trackNavigation(section) {
        // Track navigation event
        console.log(`📊 Navigation: ${section}`);

        // You can integrate with analytics services here
        // Example: gtag('event', 'page_view', { page_title: section });
    }

    /**
     * 🎨 Hide current section
     */
    hideCurrentSection() {
        const currentSectionElement = document.getElementById(`${this.currentSection}-section`);
        if (currentSectionElement) {
            currentSectionElement.classList.add('d-none');
        }
    }

    /**
     * 🎨 Show section
     */
    showSection(section) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.classList.remove('d-none');
        }
    }

    /**
     * 🎨 Show section loading
     */
    showSectionLoading(section) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) {
            sectionElement.innerHTML = `
                <div class="section-loading">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="loading-text">Loading ${section}...</div>
                </div>
            `;
        }
    }

    /**
     * 🔍 Display search results
     */
    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (!results || results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            searchResults.classList.add('show');
            return;
        }

        let html = '';
        results.forEach(result => {
            html += `
                <div class="search-result-item" data-type="${result.type}" data-id="${result.id}">
                    <div class="search-result-icon">
                        <i class="${this.getSearchResultIcon(result.type)}"></i>
                    </div>
                    <div class="search-result-content">
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-subtitle">${result.subtitle}</div>
                    </div>
                    <div class="search-result-type">${result.type}</div>
                </div>
            `;
        });

        searchResults.innerHTML = html;
        searchResults.classList.add('show');
    }

    /**
     * 🔍 Hide search results
     */
    hideSearchResults() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.classList.remove('show');
        }
    }

    /**
     * 🎯 Get search result icon
     */
    getSearchResultIcon(type) {
        const iconMap = {
            order: 'fas fa-shopping-bag',
            customer: 'fas fa-user',
            product: 'fas fa-birthday-cake',
            inventory: 'fas fa-boxes',
            message: 'fas fa-envelope'
        };
        return iconMap[type] || 'fas fa-search';
    }

    /**
     * 🔔 Handle notifications
     */
    handleNotifications(event) {
        if (event.target.closest('#viewAllNotifications')) {
            event.preventDefault();
            this.navigateToSection('notifications');
        }
    }

    /**
     * 👤 Handle user actions
     */
    handleUserActions(event) {
        if (event.target.closest('#logoutBtn')) {
            event.preventDefault();
            this.handleLogout();
        } else if (event.target.closest('#darkModeToggle')) {
            event.preventDefault();
            this.toggleDarkMode();
        }
    }

    /**
     * 🚪 Handle logout
     */
    async handleLogout() {
        try {
            const response = await fetch('/api/admin/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                this.showToast('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/admin-login.html';
                }, 1000);
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('❌ Logout error:', error);
            this.showToast('Logout failed', 'error');
        }
    }

    /**
     * 🌙 Toggle dark mode
     */
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);

        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            icon.className = isDark ? 'fas fa-sun me-2' : 'fas fa-moon me-2';
            toggleBtn.innerHTML = `${icon.outerHTML} ${isDark ? 'Light Mode' : 'Dark Mode'}`;
        }

        this.showToast(`${isDark ? 'Dark' : 'Light'} mode enabled`, 'info');
    }

    /**
     * ⌨️ Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K for search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Escape to close search
        if (event.key === 'Escape') {
            this.hideSearchResults();
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.blur();
            }
        }
    }

    /**
     * 🔄 Handle before unload
     */
    handleBeforeUnload(event) {
        // Save any pending changes
        this.savePendingChanges();
    }

    /**
     * 🌐 Handle online status
     */
    handleOnline() {
        this.showToast('Connection restored', 'success');
        this.startRealTimeUpdates();
    }

    /**
     * 📴 Handle offline status
     */
    handleOffline() {
        this.showToast('Connection lost - working offline', 'warning');
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    /**
     * 💾 Save pending changes
     */
    savePendingChanges() {
        // Implementation for saving any pending changes
        console.log('💾 Saving pending changes...');
    }

    /**
     * 🎨 Initialize tooltips
     */
    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    /**
     * 🎨 Initialize modals
     */
    initializeModals() {
        // Initialize any modals that need special handling
    }

    /**
     * 🎨 Initialize dropdowns
     */
    initializeDropdowns() {
        // Initialize any dropdowns that need special handling
    }

    /**
     * 🎨 Initialize theme
     */
    initializeTheme() {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme === 'true') {
            this.toggleDarkMode();
        }
    }

    /**
     * 📱 Initialize responsive features
     */
    initializeResponsive() {
        // Handle responsive behavior
        this.handleResponsiveNavigation();
    }

    /**
     * 📱 Handle responsive navigation
     */
    handleResponsiveNavigation() {
        // Implementation for mobile navigation
    }

    /**
     * 📊 Load notification count
     */
    async loadNotificationCount() {
        try {
            const response = await fetch('/api/admin/notifications/count');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const badge = document.getElementById('notificationCount');
            if (badge) {
                badge.textContent = data.count || 0;
                badge.style.display = data.count > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('❌ Error loading notification count:', error);
            // Set default value on error
            const badge = document.getElementById('notificationCount');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        }
    }

    /**
     * 📦 Load pending orders count
     */
    async loadPendingOrdersCount() {
        try {
            const response = await fetch('/api/admin/orders/pending/count');
            const data = await response.json();

            const badge = document.getElementById('pendingOrdersBadge');
            if (badge) {
                badge.textContent = data.count || 0;
                badge.style.display = data.count > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('❌ Error loading pending orders count:', error);
        }
    }

    /**
     * 📦 Load low stock count
     */
    async loadLowStockCount() {
        try {
            const response = await fetch('/api/admin/inventory/low-stock/count');
            const data = await response.json();

            const badge = document.getElementById('lowStockBadge');
            if (badge) {
                badge.textContent = data.count || 0;
                badge.style.display = data.count > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('❌ Error loading low stock count:', error);
        }
    }

    /**
     * 💬 Load unread messages count
     */
    async loadUnreadMessagesCount() {
        try {
            const response = await fetch('/api/admin/messages/unread/count');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const badge = document.getElementById('unreadMessagesBadge');
            if (badge) {
                badge.textContent = data.count || 0;
                badge.style.display = data.count > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('❌ Error loading unread messages count:', error);
            // Set default value on error
            const badge = document.getElementById('unreadMessagesBadge');
            if (badge) {
                badge.textContent = '0';
                badge.style.display = 'none';
            }
        }
    }
}

// 🎯 Export for global use
window.EnhancedAdminManager = EnhancedAdminManager;
