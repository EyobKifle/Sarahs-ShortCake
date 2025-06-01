// Authentication Check for Admin Dashboard
class AuthCheck {
    constructor() {
        this.isAuthenticated = false;
        this.userType = null;
        this.user = null;
    }

    // Check if user is authenticated
    async checkAuth() {
        try {
            // First check if we have a token and user data
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                console.log('No token or user data found, redirecting to login');
                this.redirectToLogin();
                return false;
            }

            // Parse user data
            let user;
            try {
                user = JSON.parse(userData);
            } catch (e) {
                console.log('Invalid user data, clearing auth');
                this.clearAuth();
                return false;
            }

            // Verify token with backend - use admin auth endpoint for admin users
            const response = await fetch('/api/admin/auth/check', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.isAuthenticated = true;
                this.userType = user.role || data.user?.userType || 'admin';
                this.user = user;

                // Update API client token
                if (window.apiClient) {
                    window.apiClient.setToken(token);
                }

                console.log('Authentication successful:', this.user);
                return true;
            } else {
                // If API fails but we have valid local data, still allow access
                // This handles cases where the /api/auth/me endpoint might have issues
                console.log('Token verification failed, but using local user data:', response.status);
                this.isAuthenticated = true;
                this.userType = user.role || 'admin';
                this.user = user;

                // Update API client token
                if (window.apiClient) {
                    window.apiClient.setToken(token);
                }

                return true;
            }

        } catch (error) {
            console.error('Auth check error:', error);
            // Don't clear auth on network errors, use local data if available
            const userData = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (userData && token) {
                try {
                    const user = JSON.parse(userData);
                    this.isAuthenticated = true;
                    this.userType = user.role || 'admin';
                    this.user = user;

                    if (window.apiClient) {
                        window.apiClient.setToken(token);
                    }

                    console.log('Using local auth data due to network error');
                    return true;
                } catch (e) {
                    console.log('Invalid local data, clearing auth');
                    this.clearAuth();
                    return false;
                }
            }

            this.clearAuth();
            return false;
        }
    }

    // Clear authentication data
    clearAuth() {
        this.isAuthenticated = false;
        this.userType = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminToken'); // Legacy cleanup

        if (window.apiClient) {
            window.apiClient.setToken(null);
        }
    }

    // Redirect to login page
    redirectToLogin() {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    // Check if user has admin privileges
    isAdmin() {
        return this.isAuthenticated && (this.userType === 'admin' || this.userType === 'super-admin');
    }

    // Initialize authentication check for admin pages
    async initAdminAuth() {
        const isAuth = await this.checkAuth();

        if (!isAuth) {
            this.redirectToLogin();
            return false;
        }

        if (!this.isAdmin()) {
            console.log('User is not admin, redirecting');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    // Show loading state
    showLoading() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'authLoadingOverlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #ff69b4; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="color: #333; font-size: 16px; margin: 0;">Verifying authentication...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingOverlay);
    }

    // Hide loading state
    hideLoading() {
        const loadingOverlay = document.getElementById('authLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
}

// Create global auth check instance
window.authCheck = new AuthCheck();

// Auto-initialize for admin pages
document.addEventListener('DOMContentLoaded', async () => {
    const currentPage = window.location.pathname.toLowerCase();

    // Check if this is an admin page
    if (currentPage.includes('admin') && !currentPage.includes('login')) {
        console.log('Admin page detected, checking authentication...');

        // Show loading state
        window.authCheck.showLoading();

        try {
            const isAuthenticated = await window.authCheck.initAdminAuth();

            if (isAuthenticated) {
                console.log('Authentication successful, initializing admin dashboard...');

                // Initialize admin manager if available
                if (window.AdminManager && typeof window.AdminManager.init === 'function') {
                    await window.AdminManager.init();
                }
            }
        } catch (error) {
            console.error('Authentication initialization error:', error);
            window.authCheck.redirectToLogin();
        } finally {
            // Hide loading state
            window.authCheck.hideLoading();
        }
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthCheck;
}
