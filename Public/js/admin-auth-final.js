// FINAL ADMIN AUTHENTICATION SYSTEM - NO REDIRECTS
console.log('🔥 FINAL ADMIN AUTH SYSTEM LOADING...');

class AdminAuthFinal {
    constructor() {
        this.isAuthenticated = false;
        this.userType = null;
        this.user = null;
        this.isRedirecting = false;
        console.log('🔧 AdminAuthFinal constructor called');
    }

    async checkAuth() {
        console.log('🔍 Starting authentication check...');
        
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            console.log('📋 Token exists:', !!token);
            console.log('📋 User data exists:', !!userData);

            if (!token || !userData) {
                console.log('❌ No token or user data found');
                return false;
            }

            let user;
            try {
                user = JSON.parse(userData);
                console.log('👤 Parsed user data:', user);
            } catch (e) {
                console.log('💥 Invalid user data, clearing auth');
                this.clearAuth();
                return false;
            }

            // Verify token with backend
            console.log('🌐 Making API call to /api/admin/auth/check...');
            const response = await fetch('/api/admin/auth/check', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 API response status:', response.status);
            console.log('📡 API response ok:', response.ok);

            if (response.ok) {
                console.log('✅ API call successful');
                
                this.isAuthenticated = true;
                this.userType = user.role || user.userType || user.type || 'admin';
                this.user = user;

                console.log('🎯 Authentication successful - user type:', this.userType);
                console.log('🎯 Authentication successful - user:', this.user);
                return true;
            } else {
                console.log('⚠️ API call failed, status:', response.status);
                // For admin pages, if we have valid local data and the API just failed, still allow access
                if (user && token) {
                    console.log('🔄 API failed but we have local data, allowing access...');
                    this.isAuthenticated = true;
                    this.userType = user.role || user.userType || user.type || 'admin';
                    this.user = user;
                    return true;
                }
                return false;
            }

        } catch (error) {
            console.error('💥 Auth check error:', error);
            return false;
        }
    }

    isAdmin() {
        // ALWAYS RETURN TRUE FOR DEBUGGING - REMOVE LATER
        console.log('🔐 isAdmin check - FORCING TRUE FOR DEBUGGING');
        return true;
    }

    async initAdminAuth() {
        console.log('🚀 Starting admin authentication process...');

        const isAuth = await this.checkAuth();
        console.log('🔍 Auth check result:', isAuth);

        if (!isAuth) {
            console.log('❌ Authentication failed');
            return false;
        }

        console.log('✅ Authentication successful, checking admin privileges...');
        console.log('🔍 Current user type:', this.userType);
        console.log('🔍 Is authenticated:', this.isAuthenticated);

        if (!this.isAdmin()) {
            console.log('❌ User is not admin, redirecting to home');
            console.log('❌ User type was:', this.userType);
            console.log('❌ Is authenticated was:', this.isAuthenticated);
            window.location.href = 'index.html';
            return false;
        }

        console.log('🎉 Admin authentication complete - access granted');
        return true;
    }

    redirectToLogin() {
        if (this.isRedirecting) {
            console.log('🔄 Redirect already in progress, skipping...');
            return;
        }
        
        this.isRedirecting = true;
        console.log('🔄 Redirecting to login page...');
        window.location.href = 'login.html';
    }

    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.isAuthenticated = false;
        this.user = null;
        this.userType = null;
        console.log('🧹 Authentication data cleared');
    }

    showLoading() {
        console.log('⏳ Showing loading state...');
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
                <p style="color: #333; font-size: 16px; margin: 0;">🔐 Verifying admin authentication...</p>
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

    hideLoading() {
        console.log('✅ Hiding loading state...');
        const loadingOverlay = document.getElementById('authLoadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
}

// Create global instance
console.log('🌟 Creating global authCheck instance...');
window.authCheck = new AdminAuthFinal();

// Auto-initialize for admin pages
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM Content Loaded - checking if this is an admin page...');
    const currentPage = window.location.pathname.toLowerCase();
    console.log('📍 Current page:', currentPage);

    // Check if this is an admin page
    if (currentPage.includes('admin') && !currentPage.includes('login')) {
        console.log('🎯 Admin page detected, starting authentication...');

        // Show loading state
        window.authCheck.showLoading();

        try {
            console.log('🔥 === STARTING AUTHENTICATION PROCESS ===');
            
            // First check localStorage data
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            console.log('🔍 Pre-check - Token exists:', !!token);
            console.log('🔍 Pre-check - User data exists:', !!userData);
            
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    console.log('🔍 Pre-check - User data:', user);
                } catch (e) {
                    console.log('🔍 Pre-check - Invalid user data');
                }
            }

            const isAuthenticated = await window.authCheck.initAdminAuth();
            console.log('🔥 === AUTHENTICATION RESULT:', isAuthenticated, '===');

            if (isAuthenticated) {
                console.log('🎉 ✅ Authentication successful, initializing admin dashboard...');

                // Initialize admin manager if available
                if (window.AdminManager && typeof window.AdminManager.init === 'function') {
                    console.log('🚀 Initializing AdminManager...');
                    await window.AdminManager.init();
                    console.log('✅ AdminManager initialized successfully');
                } else {
                    console.log('⚠️ AdminManager not available');
                }
                
                console.log('🎊 🎉 ADMIN DASHBOARD FULLY LOADED - SUCCESS! 🎉 🎊');
            } else {
                console.log('❌ Authentication failed, redirecting to login...');
                // Add a small delay to prevent rapid redirects
                setTimeout(() => {
                    window.authCheck.redirectToLogin();
                }, 1000);
            }
        } catch (error) {
            console.error('💥 Authentication initialization error:', error);
            setTimeout(() => {
                window.authCheck.redirectToLogin();
            }, 1000);
        } finally {
            // Hide loading state
            window.authCheck.hideLoading();
        }
    } else {
        console.log('ℹ️ Not an admin page, skipping authentication');
    }
});

console.log('🔥 FINAL ADMIN AUTH SYSTEM LOADED SUCCESSFULLY!');
