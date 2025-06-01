/**
 * Unified Authentication Client
 * Centralized authentication management for both admin and customer users
 */
class AuthClient {
    constructor() {
        this.baseURL = '/api';
        this.isAuthenticated = false;
        this.user = null;
        this.userType = null;
        this.token = null;
        
        // Initialize from existing auth data
        this.initializeFromStorage();
    }

    /**
     * Initialize authentication state from localStorage and cookies
     */
    initializeFromStorage() {
        try {
            // Check for existing token and user data
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                this.token = token;
                this.user = JSON.parse(userData);
                this.userType = this.user.role;
                this.isAuthenticated = true;
                
                console.log('🔐 Auth initialized from storage:', {
                    email: this.user.email,
                    userType: this.userType
                });
            }
        } catch (error) {
            console.error('Error initializing auth from storage:', error);
            this.clearAuth();
        }
    }

    /**
     * Login user with email and password
     */
    async login(email, password, userType = 'auto') {
        try {
            console.log('🔐 Attempting login for:', email, 'as', userType);

            // Determine endpoint based on userType
            let endpoint = '/api/auth/login';
            if (userType === 'admin') {
                endpoint = '/api/auth/admin/login';
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.success) {
                // Store authentication data
                this.setAuthData(data.token, data.user, data.userType);
                
                console.log('✅ Login successful:', {
                    email: data.user.email,
                    userType: data.userType
                });

                return {
                    success: true,
                    user: data.user,
                    userType: data.userType,
                    redirectUrl: data.userType === 'admin' ? '/admin.html' : '/customer-dashboard.html'
                };
            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            console.error('❌ Login error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Register new customer
     */
    async register(userData) {
        try {
            console.log('📝 Attempting registration for:', userData.email);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            if (data.success) {
                // Store authentication data
                this.setAuthData(data.token, data.user, 'customer');
                
                console.log('✅ Registration successful:', data.user.email);

                return {
                    success: true,
                    user: data.user,
                    userType: 'customer',
                    redirectUrl: '/customer-dashboard.html'
                };
            } else {
                throw new Error(data.message || 'Registration failed');
            }

        } catch (error) {
            console.error('❌ Registration error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            console.log('🚪 Logging out user:', this.user?.email);

            // Call logout API
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Clear authentication data
            this.clearAuth();
            
            console.log('✅ Logout successful');

            // Redirect to login
            window.location.href = '/login.html';

        } catch (error) {
            console.error('❌ Logout error:', error);
            // Still clear auth data even if API call fails
            this.clearAuth();
            window.location.href = '/login.html';
        }
    }

    /**
     * Get current user profile
     */
    async getProfile() {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.clearAuth();
                    window.location.href = '/login.html';
                    return null;
                }
                throw new Error(data.message || 'Failed to fetch profile');
            }

            if (data.success) {
                // Update stored user data
                this.user = data.user;
                this.userType = data.userType;
                localStorage.setItem('user', JSON.stringify(data.user));
                
                return data.user;
            } else {
                throw new Error(data.message || 'Failed to fetch profile');
            }

        } catch (error) {
            console.error('❌ Profile fetch error:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    async checkAuth() {
        try {
            if (!this.token) {
                return false;
            }

            const profile = await this.getProfile();
            return !!profile;

        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    /**
     * Set authentication data
     */
    setAuthData(token, user, userType) {
        this.token = token;
        this.user = user;
        this.userType = userType || user.role;
        this.isAuthenticated = true;

        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        this.userType = null;
        this.isAuthenticated = false;

        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminToken');
    }

    /**
     * Check if user has specific role
     */
    hasRole(role) {
        return this.userType === role;
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Check if user is customer
     */
    isCustomer() {
        return this.hasRole('customer');
    }

    /**
     * Get authentication headers for API requests
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
        
        const config = {
            credentials: 'include',
            headers: this.getAuthHeaders(),
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            
            // Handle authentication errors
            if (response.status === 401) {
                this.clearAuth();
                window.location.href = '/login.html';
                return null;
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
}

// Create global auth client instance
window.authClient = new AuthClient();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthClient;
}
