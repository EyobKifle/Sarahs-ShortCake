// Enhanced Cart Manager for Sarah's Short Cakes
const CartManager = {
    cart: [],
    notificationTimeout: null,

    // Initialize cart
    init() {
        this.loadCart();
        this.updateCartCount();
        this.setupEventListeners();
        this.loadUserInfo();
        
        if (document.getElementById('cart-items-container')) {
            this.renderCart();
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Storage event for cross-tab sync
        window.addEventListener('storage', (e) => {
            if (e.key === 'cart') {
                this.loadCart();
                this.updateCartCount();
                if (document.getElementById('cart-items-container')) {
                    this.renderCart();
                }
            }
        });

        // Checkout button
        const checkoutBtn = document.getElementById('checkout-button');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                if (this.cart.length === 0) {
                    e.preventDefault();
                    this.showNotification('Your cart is empty!', 'error');
                    return;
                }
                this.proceedToCheckout();
            });
        }

        // Delivery method selection
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.delivery-option').forEach(opt => 
                    opt.classList.remove('selected'));
                option.classList.add('selected');
                document.getElementById('delivery-method').value = option.dataset.value;
                this.updateTotals();
            });
        });

        // Payment method selection
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.payment-option').forEach(opt => 
                    opt.classList.remove('selected'));
                option.classList.add('selected');
                document.getElementById('payment-method').value = option.dataset.value;
            });
        });
    },

    // Proceed to checkout
    async proceedToCheckout() {
        try {
            // Validate user info
            const userName = document.getElementById('user-name').value;
            const userEmail = document.getElementById('user-email').value;
            const userPhone = document.getElementById('user-phone').value;
            
            if (!userName || !userEmail || !userPhone) {
                this.showNotification('Please fill in all required contact information', 'error');
                return;
            }

            // Prepare order data
            const subtotal = this.getSubtotal();
            const deliveryMethod = document.getElementById('delivery-method').value;
            const deliveryFee = deliveryMethod === 'delivery' ? 5.00 : 0.00;
            const tax = subtotal * 0.08;
            const total = subtotal + deliveryFee + tax;
            const paymentMethod = document.getElementById('payment-method').value;
            const deliveryInstructions = document.getElementById('delivery-instructions').value;

            const orderPayload = {
                items: this.cart,
                customerInfo: {
                    name: userName,
                    email: userEmail,
                    phone: userPhone,
                    address: document.getElementById('user-address').value
                },
                date: new Date().toISOString(),
                status: 'Processing',
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                tax: tax,
                total: total,
                deliveryMethod: deliveryMethod,
                paymentMethod: paymentMethod,
                deliveryInstructions: deliveryInstructions
            };

            // Send order to backend API
            const token = localStorage.getItem('token');
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                this.showNotification(data.message || 'Failed to place order. Please try again.', 'error');
                return;
            }

            // Clear cart and redirect
            this.clearCart();
            window.location.href = `order-confirmation.html?orderId=${data.data._id}`;
        } catch (error) {
            console.error('Error during checkout:', error);
            this.showNotification('Error processing your order', 'error');
        }
    },

    // Load user information
    async loadUserInfo() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/customers/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch user info');
            
            const data = await response.json();
            if (data.success && data.user) {
                const user = data.user;
                document.getElementById('user-name').value = (user.firstName || '') + ' ' + (user.lastName || '');
                document.getElementById('user-email').value = user.email || '';
                document.getElementById('user-phone').value = user.phone || '';
                document.getElementById('user-address').value = user.address || '';
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    },

    // Add item to cart
    addItem(itemData) {
        const item = {
            id: itemData.id || Date.now().toString(),
            name: itemData.name,
            price: parseFloat(itemData.price),
            quantity: parseInt(itemData.quantity) || 1,
            image: itemData.image || 'images/default-preview.jpg',
            description: itemData.description || '',
            customizations: itemData.customizations || []
        };

        try {
            // Check for existing item with same ID and customizations
            const existingItem = this.cart.find(cartItem => 
                cartItem.id === item.id && 
                JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
            );

            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                this.cart.push(item);
            }

            this.saveCart();
            this.updateCartCount();
            this.showNotification('Item added to cart!', 'success');
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add item', 'error');
            return false;
        }
    },

    // Remove item from cart
    removeItem(itemId) {
        try {
            this.cart = this.cart.filter(item => item.id !== itemId);
            this.saveCart();
            this.updateCartCount();
            this.showNotification('Item removed from cart', 'success');
            
            if (document.getElementById('cart-items-container')) {
                this.renderCart();
            }
            return true;
        } catch (error) {
            console.error('Error removing from cart:', error);
            this.showNotification('Failed to remove item', 'error');
            return false;
        }
    },

    // Update item quantity
    updateQuantity(itemId, change) {
        try {
            const item = this.cart.find(item => item.id === itemId);
            if (item) {
                const newQuantity = Math.max(1, Math.min(12, (item.quantity || 1) + change));
                if (newQuantity !== item.quantity) {
                    item.quantity = newQuantity;
                    this.saveCart();
                    this.updateCartCount();
                    
                    if (document.getElementById('cart-items-container')) {
                        this.renderCart();
                    }
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating quantity:', error);
            return false;
        }
    },

    // Clear entire cart
    clearCart() {
        try {
            this.cart = [];
            this.saveCart();
            this.updateCartCount();
            
            if (document.getElementById('cart-items-container')) {
                this.renderCart();
            }
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return false;
        }
    },

    // Calculate cart subtotal
    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    },

    // Calculate total number of items in cart
    getItemCount() {
        return this.cart.reduce((count, item) => count + (item.quantity || 1), 0);
    },

    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.cart));
            // Notify other tabs
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'cart',
                newValue: JSON.stringify(this.cart)
            }));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    },

    // Load cart from localStorage
    loadCart() {
        try {
            const savedCart = localStorage.getItem('cart');
            this.cart = savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    },

    // Update cart count in header
    updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        if (cartCountElements) {
            const count = this.getItemCount();
            cartCountElements.forEach(element => {
                element.textContent = count;
                element.style.display = count > 0 ? 'inline' : 'none';
            });
        }
    },

    // Show notification message
    showNotification(message, type = 'success') {
        // Clear existing notification
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.className = `notification ${type}`;
        document.getElementById('notification-message').textContent = message;
        const icon = document.getElementById('notification-icon');
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        
        notification.style.display = 'flex';
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove after 3 seconds
        this.notificationTimeout = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.style.display = 'none', 300);
        }, 3000);
    },

    // Render cart page
    renderCart() {
        const cartContainer = document.getElementById('cart-items-container');
        const emptyMessage = document.getElementById('empty-cart-message');
        const checkoutSection = document.querySelector('.checkout-section');
        
        if (!cartContainer) return;

        if (this.cart.length === 0) {
            if (emptyMessage) emptyMessage.style.display = 'block';
            cartContainer.innerHTML = '';
            if (checkoutSection) {
                document.getElementById('checkout-button').disabled = true;
            }
            return;
        }

        if (emptyMessage) emptyMessage.style.display = 'none';

        // Render cart items
        cartContainer.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-image-container">
                    <img src="${item.image}" alt="${item.name}" class="item-image" 
                         onerror="this.src='images/default-preview.jpg'">
                </div>
                <div class="item-details">
                    <h3 class="item-name">${item.name}</h3>
                    <p class="item-price">$${item.price.toFixed(2)} each</p>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                    ${item.customizations && item.customizations.length > 0 ? `
                        <div class="item-customization">
                            ${item.customizations.map(c => `<p><small>${c.name}: ${c.value}</small></p>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity-value">${item.quantity || 1}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <div class="item-total">$${(item.price * (item.quantity || 1)).toFixed(2)}</div>
                    <button class="remove-item" data-id="${item.id}">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');

        // Update totals
        this.updateTotals();
        
        // Setup event listeners for cart controls
        this.setupCartEventListeners();
    },

    // Update order summary totals
    updateTotals() {
        const subtotal = this.getSubtotal();
        const deliveryMethodInput = document.getElementById('delivery-method');
        const deliveryMethod = deliveryMethodInput ? deliveryMethodInput.value : 'pickup';
        const deliveryFee = deliveryMethod === 'delivery' ? 5.00 : 0.00;
        const tax = subtotal * 0.08;
        const total = subtotal + deliveryFee + tax;

        if (document.getElementById('subtotal')) {
            document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        }
        if (document.getElementById('delivery-fee')) {
            document.getElementById('delivery-fee').textContent = `$${deliveryFee.toFixed(2)}`;
        }
        if (document.getElementById('tax')) {
            document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        }
        if (document.getElementById('total')) {
            document.getElementById('total').textContent = `$${total.toFixed(2)}`;
        }
        
        // Enable/disable checkout button
        const checkoutBtn = document.getElementById('checkout-button');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0;
        }
    },

    // Setup cart page event listeners
    setupCartEventListeners() {
        // Quantity controls
        document.querySelectorAll('.quantity-btn.minus').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.id;
                const item = this.cart.find(item => item.id === itemId);
                if (!item) return;

                if (item.quantity > 1) {
                    this.updateQuantity(itemId, -1);
                } else {
                    this.removeItem(itemId);
                }
            });
        });

        document.querySelectorAll('.quantity-btn.plus').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.id;
                const item = this.cart.find(item => item.id === itemId);
                if (item && item.quantity < 12) {
                    this.updateQuantity(itemId, 1);
                }
            });
        });

        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.id;
                const itemElement = button.closest('.cart-item');
                if (itemElement) {
                    itemElement.style.animation = 'fadeOut 0.3s ease forwards';
                    setTimeout(() => {
                        this.removeItem(itemId);
                    }, 300);
                }
            });
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    CartManager.init();
});

// Add notification styles if they don't exist
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 5px;
            color: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.success {
            background-color: #4CAF50;
        }
        
        .notification.error {
            background-color: #f44336;
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
}