// Public Cart Manager for Sarah's Short Cakes
// This cart manager is specifically for public pages (cart.html, menu.html)
const CartManager = {
    cart: [],
    notificationTimeout: null,
    checkoutInProgress: false,

    // Initialize cart manager
    init() {
        console.log('🛒 Public CartManager.init() called');

        this.loadCart();
        console.log('🛒 Cart loaded in init:', this.cart);

        this.updateCartCount();
        this.setupEventListeners();
        this.setupPaymentMethodSelection();

        // Only load user info if we're on the cart page and have user fields
        if (document.getElementById('user-name')) {
            this.loadUserInfo();
        }

        // Render cart if on cart page
        const cartContainer = document.getElementById('cart-items-container');
        if (cartContainer) {
            console.log('🛒 Cart container found, rendering cart...');
            this.renderCart();
        } else {
            console.log('🛒 No cart container found, skipping render');
        }

        console.log('✅ Public CartManager.init() complete');
    },

    // Event listener setup
    setupEventListeners() {
        // Storage event for cross-tab sync (public cart only)
        window.addEventListener('storage', (e) => {
            if (e.key === 'publicCart') {
                this.loadCart();
                this.updateCartCount();
                if (document.getElementById('cart-items-container')) {
                    this.renderCart();
                }
            }
        });

        // Payment method selection
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.payment-option').forEach(opt =>
                    opt.classList.remove('selected'));
                option.classList.add('selected');
                document.getElementById('payment-method').value = option.dataset.value;

                // Show or hide payment confirmation upload based on payment method
                const uploadDiv = document.getElementById('payment-confirmation-upload');
                if (option.dataset.value === 'telebirr' || option.dataset.value === 'cbe') {
                    uploadDiv.style.display = 'block';
                } else {
                    uploadDiv.style.display = 'none';
                }
            });
        });

        // Note: Checkout button event listener is handled in cart.html to prevent duplication
        // The cart.html page has its own setupCheckoutButton() function that handles the checkout process
    },
    // Payment method selection
    setupPaymentMethodSelection() {
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.payment-option').forEach(opt =>
                    opt.classList.remove('selected'));
                option.classList.add('selected');
                document.getElementById('payment-method').value = option.dataset.value;

                // Show or hide payment confirmation upload based on payment method
                const uploadDiv = document.getElementById('payment-confirmation-upload');
                if (option.dataset.value === 'telebirr' || option.dataset.value === 'cbe') {
                    uploadDiv.style.display = 'block';
                } else {
                    uploadDiv.style.display = 'none';
                }
            });
        });
    },

    // Proceed to checkout: generate order, save, and redirect
    async proceedToCheckout() {
        // Prevent multiple simultaneous checkout processes
        if (this.checkoutInProgress) {
            console.log('⚠️ Checkout already in progress, ignoring duplicate request');
            this.showNotification('Checkout already in progress...', 'warning');
            return;
        }

        this.checkoutInProgress = true;
        console.log('🔒 Checkout lock acquired');

        try {
            // Check if user is logged in
            const token = localStorage.getItem('token');
            const isLoggedIn = !!token;

            // Prepare order data
            const subtotal = this.getSubtotal();
            const deliveryMethodInput = document.getElementById('delivery-method');
            const deliveryMethod = deliveryMethodInput ? deliveryMethodInput.value : 'pickup';
            const deliveryFee = deliveryMethod === 'delivery' ? 5.00 : 0.00;
            const tax = subtotal * 0.08;
            const total = subtotal + deliveryFee + tax;

            // Get payment method and payment confirmation file
            let paymentMethod;
            let paymentConfirmationFile = null;

            if (isLoggedIn) {
                // Registered customer - use integrated payment method
                const registeredPaymentMethodInput = document.getElementById('registered-payment-method');
                paymentMethod = registeredPaymentMethodInput ? registeredPaymentMethodInput.value : 'stripe';
            } else {
                // Guest customer - use proof upload payment method
                const paymentMethodInput = document.getElementById('payment-method');
                paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'telebirr';

                const paymentConfirmationFileInput = document.getElementById('paymentConfirmationFile');
                if (paymentConfirmationFileInput && paymentConfirmationFileInput.files.length > 0) {
                    paymentConfirmationFile = paymentConfirmationFileInput.files[0];
                }
            }

            const orderPayload = {
                items: this.cart,
                date: new Date().toISOString(),
                status: 'pending',
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                tax: tax,
                total: total,
                totalAmount: total,
                deliveryMethod: deliveryMethod,
                paymentMethod: paymentMethod,
                customerType: isLoggedIn ? 'registered' : 'guest',
                payment: {
                    method: isLoggedIn ? 'integrated' : 'proof_upload',
                    amount: total,
                    status: 'pending',
                    paymentProvider: isLoggedIn ? paymentMethod : null
                }
            };

            // Add guest information if not logged in
            if (!isLoggedIn) {
                const firstName = document.getElementById('firstName')?.value || '';
                const lastName = document.getElementById('lastName')?.value || '';
                const email = document.getElementById('email')?.value || '';
                const phone = document.getElementById('phone')?.value || '';
                const address = document.getElementById('address')?.value || '';
                const city = document.getElementById('city')?.value || '';
                const state = document.getElementById('state')?.value || '';
                const zipCode = document.getElementById('zipCode')?.value || '';

                orderPayload.guestInfo = {
                    name: `${firstName} ${lastName}`.trim(),
                    email: email,
                    phone: phone,
                    address: {
                        street: address,
                        city: city,
                        state: state,
                        zipCode: zipCode
                    }
                };

                // Validate guest information
                if (!firstName || !lastName || !email || !phone) {
                    this.showNotification('Please fill in all required contact information', 'error');
                    return;
                }
            }

            // Handle payment proof upload for guest customers
            if (!isLoggedIn && paymentConfirmationFile) {
                console.log('📁 Starting payment confirmation file upload...');
                console.log('📁 File details:', {
                    name: paymentConfirmationFile.name,
                    size: paymentConfirmationFile.size,
                    type: paymentConfirmationFile.type
                });

                // Create FormData for file upload
                const formData = new FormData();
                formData.append('file', paymentConfirmationFile);

                console.log('📁 FormData created, sending to /api/uploads/payment-confirmation');

                try {
                    // Upload file to backend API
                    const uploadResponse = await fetch('/api/uploads/payment-confirmation', {
                        method: 'POST',
                        headers: {
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: formData
                    });

                    console.log('📁 Upload response status:', uploadResponse.status);
                    console.log('📁 Upload response ok:', uploadResponse.ok);

                    if (!uploadResponse.ok) {
                        const errorText = await uploadResponse.text();
                        console.error('❌ Upload failed with response:', errorText);
                        this.showNotification(`Failed to upload payment confirmation file: ${uploadResponse.status}`, 'error');
                        return;
                    }

                    const uploadResult = await uploadResponse.json();
                    console.log('✅ Upload successful:', uploadResult);

                    // Store the uploaded file path
                    if (uploadResult.success && uploadResult.path) {
                        orderPayload.payment.proofImage = uploadResult.path;
                        console.log('📁 Payment proof image path stored:', uploadResult.path);
                    } else {
                        console.error('❌ Upload response missing file path');
                        this.showNotification('Upload successful but file path missing', 'error');
                        return;
                    }
                } catch (uploadError) {
                    console.error('❌ Upload error:', uploadError);
                    this.showNotification('Error uploading payment confirmation file', 'error');
                    return;
                }

                // Store original filename for reference
                orderPayload.payment.proofImageOriginalName = paymentConfirmationFile.name;
            } else if (!isLoggedIn && !paymentConfirmationFile) {
                // Guest customer must upload payment proof
                this.showNotification('Please upload payment confirmation for your order', 'error');
                return;
            }

            // Send order to backend API using appropriate endpoint
            const authToken = localStorage.getItem('token');
            const orderEndpoint = isLoggedIn ? '/api/orders' : '/api/orders/guest';

            console.log('🛒 Creating order with payload:', orderPayload);
            console.log('🛒 Using endpoint:', orderEndpoint);
            console.log('🛒 Is logged in:', isLoggedIn);

            const response = await fetch(orderEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();

            if (!response.ok) {
                this.showNotification(data.message || 'Failed to place order. Please try again.', 'error');
                return;
            }

            console.log('✅ Order created successfully:', data);
            this.showNotification('Order placed successfully!', 'success');

            // Store order data for confirmation page
            const orderDataForConfirmation = {
                orderNumber: data.data.orderNumber || data.orderNumber,
                orderId: data.data._id || data.orderId,
                customerType: data.data.customerType || 'guest',
                status: data.data.status || 'pending',
                createdAt: data.data.createdAt || new Date().toISOString(),
                guestInfo: data.data.guestInfo || orderPayload.guestInfo,
                items: data.data.items || orderPayload.items,
                subtotal: data.data.subtotal || orderPayload.subtotal,
                tax: data.data.tax || orderPayload.tax,
                deliveryFee: data.data.deliveryFee || orderPayload.deliveryFee,
                totalAmount: data.data.totalAmount || orderPayload.totalAmount,
                deliveryInfo: data.data.deliveryInfo || orderPayload.deliveryInfo,
                payment: data.data.payment || orderPayload.payment
            };

            // Store in localStorage for confirmation page
            localStorage.setItem('guestOrderData', JSON.stringify(orderDataForConfirmation));

            // Clear cart
            this.clearCart();

            // Redirect to appropriate confirmation page
            const confirmationPage = isLoggedIn ? 'order-confirmation.html' : 'guest-confirmation.html';
            setTimeout(() => {
                window.location.href = confirmationPage;
            }, 1500);
        } catch (error) {
            console.error('Error during checkout:', error);
            this.showNotification('Error processing your order', 'error');
        } finally {
            // Always release the checkout lock
            this.checkoutInProgress = false;
            console.log('🔓 Checkout lock released');
        }
    },

    // Load user information from backend API (for public pages)
    async loadUserInfo() {
        try {
            const userToken = localStorage.getItem('token');

            const headers = {
                'Content-Type': 'application/json'
            };

            if (userToken) {
                headers['Authorization'] = `Bearer ${userToken}`;
            }

            const response = await fetch('/api/customers/me', { headers });

            if (!response.ok) {
                return; // For public pages, just return silently if no user info
            }

            const data = await response.json();
            if (data.success && data.user) {
                const user = data.user;

                // Populate user fields for public cart page
                const userNameField = document.getElementById('user-name');
                const userEmailField = document.getElementById('user-email');
                const userPhoneField = document.getElementById('user-phone');
                const userAddressField = document.getElementById('user-address');

                if (userNameField) userNameField.value = (user.firstName || '') + ' ' + (user.lastName || '');
                if (userEmailField) userEmailField.value = user.email || '';
                if (userPhoneField) userPhoneField.value = user.phone || '';
                if (userAddressField) userAddressField.value = user.address || '';

                console.log('✅ User info loaded successfully');
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            // For public pages, don't show error notifications for user info loading
        }
    },

    // Add item to cart (compatible with menu page)
    addItem(itemData) {
        const item = {
            id: itemData.id || `menu-${itemData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: itemData.name,
            price: parseFloat(itemData.price),
            quantity: parseInt(itemData.quantity) || 1,
            image: itemData.image || 'images/default-preview.jpg',
            description: itemData.description || '',
            customizations: itemData.customizations || []
        };

        console.log('🛒 Processing cart item:', item);

        try {
            // Check for existing item with same ID and customizations
            const existingItem = this.cart.find(cartItem =>
                cartItem.id === item.id &&
                JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
            );

            if (existingItem) {
                // Add to existing quantity instead of replacing
                existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
            } else {
                this.cart.push(item);
            }

            this.saveCart();
            this.updateCartCount();

            // Don't show notification here - let the calling code handle it
            console.log('✅ Item added to cart successfully');
            return true;
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
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

            // Re-render if on cart page
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

                    // Re-render if on cart page
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

            // Re-render if on cart page
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

    // Get cart items (for compatibility)
    getItems() {
        return this.cart;
    },

    // Save cart to localStorage (public cart uses 'publicCart' key)
    saveCart() {
        try {
            localStorage.setItem('publicCart', JSON.stringify(this.cart));
            // Notify other tabs
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'publicCart',
                newValue: JSON.stringify(this.cart)
            }));
            console.log('🛒 Public cart saved to localStorage');
        } catch (error) {
            console.error('Error saving public cart:', error);
        }
    },

    // Load cart from localStorage (public cart uses 'publicCart' key)
    loadCart() {
        try {
            const savedCart = localStorage.getItem('publicCart');
            console.log('🛒 Raw localStorage public cart:', savedCart);

            this.cart = savedCart ? JSON.parse(savedCart) : [];
            console.log('🛒 Parsed public cart:', this.cart);
            console.log('🛒 Public cart length:', this.cart.length);

            // Force re-render if on cart page
            if (document.getElementById('cart-items-container')) {
                console.log('🛒 Public cart page detected, scheduling render...');
                setTimeout(() => {
                    console.log('🛒 Force rendering public cart after load...');
                    this.renderCart();
                }, 100);
            }
        } catch (error) {
            console.error('❌ Error loading public cart:', error);
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

    // Render cart page (for public pages)
    renderCart() {
        console.log('🛒 Public renderCart() called with items:', this.cart);
        console.log('🛒 Cart length:', this.cart?.length || 0);

        const cartContainer = document.getElementById('cart-items-container');
        const emptyMessage = document.getElementById('empty-cart-message');
        const checkoutSection = document.querySelector('.checkout-section');

        console.log('🛒 DOM elements found:', {
            cartContainer: !!cartContainer,
            emptyMessage: !!emptyMessage,
            checkoutSection: !!checkoutSection
        });

        if (!cartContainer) {
            console.error('❌ Cart container (#cart-items-container) not found in DOM');
            return;
        }

        // Ensure cart is an array
        if (!Array.isArray(this.cart)) {
            console.error('❌ Cart is not an array:', this.cart);
            this.cart = [];
        }

        if (this.cart.length === 0) {
            console.log('📭 Cart is empty, showing empty message');
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
                console.log('✅ Empty message shown');
            }
            cartContainer.innerHTML = '';
            if (checkoutSection) {
                const checkoutBtn = document.querySelector('.checkout-btn');
                if (checkoutBtn) {
                    checkoutBtn.disabled = true;
                    console.log('✅ Checkout button disabled');
                }
            }
            return;
        }

        console.log(`🛒 Rendering ${this.cart.length} cart items`);

        if (emptyMessage) {
            emptyMessage.style.display = 'none';
            console.log('✅ Empty message hidden');
        }

        // Render cart items
        try {
            const cartHTML = this.cart.map((item, index) => {
                // Validate item data
                if (!item || typeof item !== 'object') {
                    console.warn('⚠️ Invalid item at index', index, ':', item);
                    return '';
                }

                const itemId = item.id || `item-${index}`;
                const itemName = item.name || 'Unknown Item';
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = parseInt(item.quantity) || 1;
                const itemImage = item.image || 'images/default-preview.jpg';
                const itemTotal = itemPrice * itemQuantity;

                return `
                    <div class="cart-item" data-id="${itemId}">
                        <div class="item-image-container">
                            <img src="${itemImage}" alt="${itemName}" class="item-image"
                                 onerror="this.src='images/default-preview.jpg'">
                        </div>
                        <div class="item-details">
                            <h3 class="item-name">${itemName}</h3>
                            <p class="item-price">$${itemPrice.toFixed(2)} each</p>
                            ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                            ${item.customizations && item.customizations.length > 0 ? `
                                <div class="item-customization">
                                    ${item.customizations.map(c => `<p><small>${c.name}: ${c.value}</small></p>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="item-controls">
                            <div class="quantity-controls">
                                <button class="quantity-btn minus" data-index="${index}" data-id="${itemId}">-</button>
                                <span class="quantity-value">${itemQuantity}</span>
                                <button class="quantity-btn plus" data-index="${index}" data-id="${itemId}">+</button>
                            </div>
                            <div class="item-total">$${itemTotal.toFixed(2)}</div>
                            <button class="remove-item" data-id="${itemId}" title="Remove item">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).filter(html => html !== '').join('');

            cartContainer.innerHTML = cartHTML;
            console.log('✅ Cart items rendered successfully');
        } catch (error) {
            console.error('❌ Error rendering cart items:', error);
            cartContainer.innerHTML = '<p>Error loading cart items</p>';
        }

        // Update totals
        this.updateTotals();

        // Setup event listeners for cart controls
        this.setupCartEventListeners();
    },

    // Update order summary totals
    updateTotals() {
        console.log('💰 Updating totals...');

        const subtotal = this.getSubtotal();
        console.log('💰 Subtotal:', subtotal);

        // Get delivery method
        const deliveryMethodInput = document.getElementById('delivery-method');
        const deliveryMethod = deliveryMethodInput ? deliveryMethodInput.value : 'pickup';
        const deliveryFee = deliveryMethod === 'delivery' ? 5.00 : 0.00;
        console.log('🚚 Delivery method:', deliveryMethod, 'Fee:', deliveryFee);

        // Calculate tax (8%)
        const taxRate = 0.08;
        const tax = subtotal * taxRate;
        console.log('💸 Tax (8%):', tax);

        // Calculate total
        const total = subtotal + deliveryFee + tax;
        console.log('💰 Total:', total);

        // Update DOM elements
        const subtotalEl = document.getElementById('subtotal');
        const deliveryFeeEl = document.getElementById('delivery-fee');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');

        if (subtotalEl) {
            subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            console.log('✅ Subtotal updated in DOM');
        } else {
            console.warn('⚠️ Subtotal element not found');
        }

        if (deliveryFeeEl) {
            deliveryFeeEl.textContent = `$${deliveryFee.toFixed(2)}`;
            console.log('✅ Delivery fee updated in DOM');
        } else {
            console.warn('⚠️ Delivery fee element not found');
        }

        if (taxEl) {
            taxEl.textContent = `$${tax.toFixed(2)}`;
            console.log('✅ Tax updated in DOM');
        } else {
            console.warn('⚠️ Tax element not found');
        }

        if (totalEl) {
            totalEl.textContent = `$${total.toFixed(2)}`;
            console.log('✅ Total updated in DOM');
        } else {
            console.warn('⚠️ Total element not found');
        }

        // Enable/disable checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            const shouldDisable = this.cart.length === 0;
            checkoutBtn.disabled = shouldDisable;
            console.log('🛒 Checkout button', shouldDisable ? 'disabled' : 'enabled');
        } else {
            console.warn('⚠️ Checkout button not found');
        }

        console.log('✅ Totals update complete');
    },

    // Setup cart page event listeners
    setupCartEventListeners() {
        // Quantity controls
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = button.dataset.index;
                const item = this.cart[index];
                if (!item) return;

                if (button.classList.contains('minus')) {
                    if (item.quantity > 1) {
                        this.updateQuantity(item.id, -1);
                    } else {
                        this.removeItem(item.id);
                    }
                } else if (button.classList.contains('plus')) {
                    if (item.quantity < 12) {
                        this.updateQuantity(item.id, 1);
                    }
                }
            });
        });

        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.id;
                const itemElement = button.closest('.cart-item');
                itemElement.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => {
                    this.removeItem(itemId);
                }, 300);
            });
        });

        // Delivery method selection
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.addEventListener('click', () => {
                console.log('🚚 Delivery option clicked:', option.dataset.value);

                document.querySelectorAll('.delivery-option').forEach(opt =>
                    opt.classList.remove('selected'));
                option.classList.add('selected');

                const deliveryMethodInput = document.getElementById('delivery-method');
                if (deliveryMethodInput) {
                    deliveryMethodInput.value = option.dataset.value;
                    console.log('🚚 Delivery method set to:', option.dataset.value);
                }

                // Update totals when delivery method changes
                this.updateTotals();
            });
        });

        console.log('✅ Cart event listeners setup complete');
    }
};

// Note: Initialization is handled by individual pages to avoid conflicts

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

// Global functions for backward compatibility
function addToCart(item) {
    return CartManager.addItem(item);
}

function updateCartCount() {
    return CartManager.updateCartCount();
}

function loadCart() {
    return CartManager.loadCart();
}

