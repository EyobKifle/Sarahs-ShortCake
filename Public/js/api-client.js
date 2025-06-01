// API Client for Admin Dashboard - Updated to work with unified auth
class ApiClient {
    constructor() {
        this.baseURL = '/api';
        this.isAuthenticated = false;

        // Initialize with unified auth client if available
        this.initializeWithAuthClient();
    }

    // Initialize with unified auth client
    initializeWithAuthClient() {
        if (typeof authClient !== 'undefined') {
            this.isAuthenticated = authClient.isAuthenticated;
            console.log('🔗 API Client initialized with unified auth client');
        } else {
            // Fallback to localStorage for backward compatibility
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            this.isAuthenticated = !!token;
            console.log('⚠️ API Client using fallback localStorage auth');
        }
    }

    // Get authentication headers using unified auth client
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Use unified auth client if available
        if (typeof authClient !== 'undefined' && authClient.isAuthenticated) {
            // Unified auth client uses cookies, so no Authorization header needed
            console.log('🔐 Using unified auth client (cookie-based)');
        } else {
            // Fallback to token-based auth
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('🔐 Using fallback token-based auth');
            }
        }

        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const authHeaders = this.getAuthHeaders();
        console.log(`🌐 Making request to: ${url}`);
        console.log(`🔑 Auth headers:`, authHeaders);

        const config = {
            credentials: 'include',
            headers: {
                ...authHeaders,
                ...options.headers
            },
            ...options,
        };

        // Add body if provided and not GET request
        if (options.body && typeof options.body === 'object' && options.method !== 'GET') {
            config.body = JSON.stringify(options.body);
        }

        try {
            console.log(`API Request: ${config.method || 'GET'} ${url}`);
            const response = await fetch(url, config);

            // Handle authentication errors
            if (response.status === 401) {
                this.handleAuthError();
                throw new Error('Authentication required');
            }

            // Handle other HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`API Response: ${url}`, data);
            return data;

        } catch (error) {
            console.error(`API Error: ${url}`, error);
            throw error;
        }
    }

    // Handle authentication errors using unified auth client
    handleAuthError() {
        console.log('❌ API Client: Authentication error detected');

        if (typeof authClient !== 'undefined') {
            // Use unified auth client for logout and redirect
            authClient.clearAuth();
        } else {
            // Fallback to manual cleanup
            this.isAuthenticated = false;
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');

            // Redirect to login if not already there
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = '/login.html';
            }
        }
    }

    // Authentication methods - now use unified auth client
    async login(email, password) {
        console.log('⚠️ API Client login method called - should use unified auth client instead');

        if (typeof authClient !== 'undefined') {
            return await authClient.login(email, password, 'admin');
        } else {
            // Fallback to direct API call
            const response = await this.request('/admin/login', {
                method: 'POST',
                body: { email, password }
            });
            return response;
        }
    }

    async logout() {
        console.log('🚪 API Client logout - delegating to unified auth client');

        if (typeof authClient !== 'undefined') {
            return await authClient.logout();
        } else {
            // Fallback logout
            try {
                await this.request('/auth/logout', {
                    method: 'POST'
                });
            } catch (error) {
                console.warn('Logout API call failed:', error);
            } finally {
                this.isAuthenticated = false;
                localStorage.removeItem('adminToken');
                localStorage.removeItem('token');
            }
        }
    }

    // Dashboard API methods
    async getAdminDashboardStats(period = 'week') {
        return await this.request(`/admin/dashboard-stats?period=${period}`);
    }

    async getRecentOrders() {
        return await this.request('/admin/recent-orders');
    }

    // Orders API methods
    async getAllOrders(limit = null) {
        const endpoint = limit ? `/orders?limit=${limit}` : '/orders';
        return await this.request(endpoint);
    }

    async getOrderById(orderId) {
        return await this.request(`/orders/${orderId}`);
    }

    async updateOrderStatus(orderId, status) {
        return await this.request(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: { status }
        });
    }

    async acceptOrder(orderId) {
        return await this.request(`/orders/${orderId}/accept`, {
            method: 'POST'
        });
    }

    async cancelOrder(orderId, reason) {
        return await this.request(`/orders/${orderId}/cancel`, {
            method: 'POST',
            body: { reason }
        });
    }

    // Customers API methods
    async getAllCustomers() {
        return await this.request('/customers');
    }

    async getCustomerById(customerId) {
        return await this.request(`/customers/admin/${customerId}`);
    }

    // Inventory API methods
    async getAllInventoryItems() {
        return await this.request('/inventory');
    }

    async createInventoryItem(itemData) {
        return await this.request('/inventory', {
            method: 'POST',
            body: itemData
        });
    }

    async updateInventoryItem(itemId, itemData) {
        return await this.request(`/inventory/${itemId}`, {
            method: 'PUT',
            body: itemData
        });
    }

    async deleteInventoryItem(itemId, options = {}) {
        return await this.request(`/inventory/${itemId}`, {
            method: 'DELETE',
            body: options
        });
    }

    async restockInventoryItem(itemId, restockData) {
        return await this.request(`/inventory/${itemId}/restock`, {
            method: 'POST',
            body: restockData
        });
    }

    async getInventoryItemHistory(itemId, options = {}) {
        const params = new URLSearchParams();
        if (options.page) params.append('page', options.page);
        if (options.limit) params.append('limit', options.limit);

        const queryString = params.toString();
        const url = `/inventory/${itemId}/history${queryString ? '?' + queryString : ''}`;

        return await this.request(url);
    }

    async getInventoryUsageReport() {
        return await this.request('/inventory/reports/usage');
    }

    async getMenuWithInventoryStatus() {
        return await this.request('/inventory/menu-status');
    }

    // Dashboard API methods
    async getDashboardStats(timePeriod = 'all') {
        try {
            // Get date range based on time period
            const dateRange = this.getDateRangeForPeriod(timePeriod);

            // Get sales report data
            const salesReport = await this.getSalesReport(
                dateRange.start.toISOString().split('T')[0],
                dateRange.end.toISOString().split('T')[0]
            );

            // Get inventory report
            const inventoryReport = await this.getInventoryReport();

            // Get customer report
            const customerReport = await this.getCustomerReport();

            // Combine data for dashboard
            const dashboardData = {
                totalOrders: salesReport.data?.summary?.totalOrders || 0,
                totalRevenue: salesReport.data?.summary?.totalRevenue || 0,
                newCustomers: customerReport.data?.summary?.totalCustomers || 0,
                ordersChange: 0, // Would need historical data to calculate
                revenueChange: 0, // Would need historical data to calculate
                customersChange: 0, // Would need historical data to calculate
                orders: salesReport.data?.detailedOrders || [],
                inventoryStats: {
                    totalItems: inventoryReport.data?.summary?.totalItems || 0,
                    lowStock: inventoryReport.data?.summary?.lowStockItems || 0,
                    outOfStock: 0, // Would need to calculate from inventory data
                    totalValue: inventoryReport.data?.summary?.totalValue || 0
                },
                customerStats: {
                    total: customerReport.data?.summary?.totalCustomers || 0,
                    registered: customerReport.data?.summary?.activeCustomers || 0,
                    guest: (customerReport.data?.summary?.totalCustomers || 0) - (customerReport.data?.summary?.activeCustomers || 0),
                    newThisMonth: 0 // Would need to calculate from customer data
                }
            };

            return dashboardData;
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }

    getDateRangeForPeriod(timePeriod) {
        const now = new Date();
        let start, end;

        switch (timePeriod) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                start = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
                start.setHours(0, 0, 0, 0);
                end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear() + 1, 0, 1);
                break;
            default: // 'all'
                start = new Date(2020, 0, 1); // Start from 2020
                end = new Date();
                break;
        }

        return { start, end };
    }

    // Reports API methods
    async getSalesReport(startDate, endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        // Add timestamp to force fresh API calls and bypass cache
        params.append('_t', Date.now());

        return await this.request(`/reports/sales?${params.toString()}`);
    }

    async getInventoryReport(params = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const baseUrl = `/reports/inventory?_t=${timestamp}&_r=${random}`;
        const url = params ? `${baseUrl}&${params}` : baseUrl;
        return await this.request(url, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    }

    async getCustomerReport(params = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const baseUrl = `/reports/customers?_t=${timestamp}&_r=${random}`;
        const url = params ? `${baseUrl}&${params}` : baseUrl;
        return await this.request(url, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    }

    async exportReportPDF(type, startDate, endDate) {
        const params = new URLSearchParams({ type });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${this.baseURL}/reports/export/pdf?${params.toString()}`, {
            credentials: 'include',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to export PDF');
        }

        return response.blob();
    }



    // Contact messages API methods
    async getContactMessages() {
        console.log('🔍 Making API call to get contact messages...');
        console.log('🔑 Current token:', this.token ? 'Token exists' : 'No token');
        console.log('🔑 Token from localStorage:', localStorage.getItem('token') ? 'Token exists' : 'No token');
        console.log('🔑 Auth headers:', this.getAuthHeaders());

        const result = await this.request('/contact');
        console.log('📨 Contact messages API response:', result);
        return result;
    }

    async markMessageAsRead(messageId) {
        return await this.request(`/contact/${messageId}/read`, {
            method: 'PATCH'
        });
    }

    async replyToMessage(messageId, reply) {
        return await this.request(`/contact/${messageId}/reply`, {
            method: 'POST',
            body: { reply }
        });
    }

    async deleteMessage(messageId) {
        return await this.request(`/contact/${messageId}`, {
            method: 'DELETE'
        });
    }

    // Admin management methods
    async getAllAdmins() {
        return await this.request('/admin');
    }

    async createAdmin(adminData) {
        return await this.request('/admin', {
            method: 'POST',
            body: adminData
        });
    }

    async updateAdmin(adminId, adminData) {
        return await this.request(`/admin/${adminId}`, {
            method: 'PUT',
            body: adminData
        });
    }

    async deleteAdmin(adminId) {
        return await this.request(`/admin/${adminId}`, {
            method: 'DELETE'
        });
    }

    // Settings Management
    async getSettings() {
        return await this.request('/settings');
    }

    async updateSettings(settingsData) {
        return await this.request('/settings', {
            method: 'PUT',
            body: settingsData
        });
    }

    async testEmailConfig(testData) {
        return await this.request('/settings/test-email', {
            method: 'POST',
            body: testData
        });
    }

    async testSmsConfig(testData) {
        return await this.request('/settings/test-sms', {
            method: 'POST',
            body: testData
        });
    }

    async getSystemInfo() {
        return await this.request('/settings/system-info');
    }

    async backupDatabase() {
        return await this.request('/settings/backup', {
            method: 'POST'
        });
    }

    // Change admin password
    async changePassword(passwordData) {
        return await this.request('/settings/change-password', {
            method: 'POST',
            body: passwordData
        });
    }

    // Get login history
    async getLoginHistory() {
        return await this.request('/settings/login-history');
    }

    // Get backup history
    async getBackupHistory() {
        return await this.request('/settings/backup-history');
    }

    // Upload branding file (logo/favicon)
    async uploadBrandingFile(file, fileType) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType);

        return await this.request('/settings/upload-branding', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set content-type for FormData
        });
    }

    // Reset settings to defaults
    async resetToDefaults() {
        return await this.request('/settings/reset-defaults', {
            method: 'POST'
        });
    }
}

// Create global API client instance
window.apiClient = new ApiClient();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
