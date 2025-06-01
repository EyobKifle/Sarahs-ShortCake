/**
 * Unified Header Manager - Handles header functionality across all pages
 */
class UnifiedHeader {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        console.log('🎯 Initializing Unified Header...');

        try {
            // Wait for auth client if available
            await this.waitForAuthClient();
            
            // Load header HTML
            await this.loadHeader();
            
            // Set active navigation
            this.setActiveNavigation();
            
            // Update cart count
            this.updateCartCount();
            
            // Update authentication state
            await this.updateAuthState();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Unified Header initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing unified header:', error);
        }
    }

    async waitForAuthClient() {
        if (typeof authClient === 'undefined') {
            console.log('⏳ Waiting for auth client...');
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
    }

    async loadHeader() {
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) {
            console.warn('⚠️ Header container not found');
            return;
        }

        try {
            const response = await fetch('/components/unified-header.html');
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;
        } catch (error) {
            console.error('❌ Error loading header:', error);
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '');
    }

    setActiveNavigation() {
        // Remove all active classes
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });

        // Set active class based on current page
        const navMap = {
            'index': 'nav-home',
            '': 'nav-home', // Root path
            'menu': 'nav-menu',
            'order': 'nav-order',
            'cart': 'nav-cart',
            'track': 'nav-track',
            'contact': 'nav-contact'
        };

        const activeNavId = navMap[this.currentPage];
        if (activeNavId) {
            const activeNav = document.getElementById(activeNavId);
            if (activeNav) {
                activeNav.classList.add('active');
            }
        }
    }

    updateCartCount() {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement && typeof CartManager !== 'undefined') {
            const count = CartManager.getItemCount();
            cartCountElement.textContent = count;
            
            // Add badge animation if count > 0
            if (count > 0) {
                cartCountElement.classList.add('has-items');
            } else {
                cartCountElement.classList.remove('has-items');
            }
        }
    }

    async updateAuthState() {
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        try {
            if (typeof authClient !== 'undefined' && authClient.isAuthenticated) {
                const isValid = await authClient.checkAuth();
                
                if (isValid) {
                    const user = authClient.user;
                    const userType = authClient.userType;
                    
                    authContainer.innerHTML = `
                        <div class="user-menu">
                            <div class="user-info">
                                <span class="user-avatar">${user.firstName.charAt(0).toUpperCase()}</span>
                                <span class="user-name">${user.firstName}</span>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="user-dropdown">
                                <a href="${userType === 'admin' ? '/admin.html' : '/customer-dashboard.html'}" class="dropdown-item">
                                    <i class="fas fa-tachometer-alt"></i> Dashboard
                                </a>
                                <a href="#" class="dropdown-item" id="header-logout">
                                    <i class="fas fa-sign-out-alt"></i> Logout
                                </a>
                            </div>
                        </div>
                    `;
                    
                    // Setup logout handler
                    document.getElementById('header-logout').addEventListener('click', async (e) => {
                        e.preventDefault();
                        await this.handleLogout();
                    });
                    
                } else {
                    this.showLoginButton();
                }
            } else {
                this.showLoginButton();
            }
        } catch (error) {
            console.error('❌ Error updating auth state:', error);
            this.showLoginButton();
        }
    }

    showLoginButton() {
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.innerHTML = `
                <a href="login.html" class="login-signup-button" id="login-link">
                    <i class="fas fa-user"></i> Login / Sign Up
                </a>
            `;
        }
    }

    async handleLogout() {
        try {
            console.log('🚪 Header logout initiated');
            if (typeof authClient !== 'undefined') {
                await authClient.logout();
            } else {
                // Fallback
                localStorage.clear();
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.error('❌ Error during logout:', error);
            // Fallback
            localStorage.clear();
            window.location.href = '/index.html';
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                const navLinks = document.querySelector('.nav-links');
                navLinks.classList.toggle('mobile-active');
            });
        }

        // User menu dropdown
        document.addEventListener('click', (e) => {
            const userMenu = document.querySelector('.user-menu');
            if (userMenu) {
                if (userMenu.contains(e.target)) {
                    userMenu.classList.toggle('active');
                } else {
                    userMenu.classList.remove('active');
                }
            }
        });

        // Cart count updates
        document.addEventListener('cartUpdated', () => {
            this.updateCartCount();
        });
    }

    // Public method to refresh auth state
    async refreshAuthState() {
        await this.updateAuthState();
    }

    // Public method to update cart count
    refreshCartCount() {
        this.updateCartCount();
    }
}

// Create global instance
window.unifiedHeader = new UnifiedHeader();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.unifiedHeader.init();
});
