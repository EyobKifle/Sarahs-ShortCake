document.addEventListener('DOMContentLoaded', function() {
    const cartContainer = document.getElementById('cartContainer');
    const notification = document.getElementById('notification');
    const notificationIcon = document.getElementById('notification-icon');
    const notificationMessage = document.getElementById('notification-message');

    // Mock CartManager for demonstration; replace with real implementation
    const CartManager = {
        getItems: function() {
            // Return mock items for logged-in customer
            return [
                {
                    id: 'item1',
                    name: 'Red Velvet Cupcake',
                    description: 'Delicious red velvet cupcake with cream cheese frosting',
                    price: 3.99,
                    quantity: 2,
                    image: 'images/red-velvet-cupcake.jpg',
                    customizations: [
                        { name: 'Frosting', value: 'Cream Cheese' },
                        { name: 'Sprinkles', value: 'Rainbow' }
                    ]
                },
                {
                    id: 'item2',
                    name: 'Chocolate Chip Cookie',
                    description: 'Classic chocolate chip cookie',
                    price: 1.99,
                    quantity: 5,
                    image: 'images/chocolate-chip-cookie.jpg',
                    customizations: []
                }
            ];
        },
        updateItemQuantity: function(itemId, newQuantity) {
            // Update quantity logic here
            // For demo, return true
            return true;
        },
        removeItem: function(itemId) {
            // Remove item logic here
            // For demo, return true
            return true;
        }
    };

    function renderCart() {
        const cartItems = CartManager.getItems();

        if (cartItems.length === 0) {
            cartContainer.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-basket"></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added any items to your cart yet</p>
                    <a href="customer-menu.html" class="btn-primary">Browse Menu</a>
                </div>
            `;
            return;
        }

        let itemsHTML = '';
        let subtotal = 0;

        cartItems.forEach(item => {
            subtotal += item.price * item.quantity;

            let customizationsHTML = '';
            if (item.customizations && item.customizations.length > 0) {
                customizationsHTML = '<div class="cart-item-customizations">';
                item.customizations.forEach(custom => {
                    customizationsHTML += `<span class="cart-item-customization">${custom.name}: ${custom.value}</span>`;
                });
                customizationsHTML += '</div>';
            }

            itemsHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='images/default-preview.jpg'">
                    <div class="cart-item-details">
                        <h3 class="cart-item-title">${item.name}</h3>
                        <p class="cart-item-description">${item.description || ''}</p>
                        ${customizationsHTML}
                        <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                        <div class="cart-item-controls">
                            <div class="quantity-control">
                                <button class="quantity-btn quantity-minus">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="12">
                                <button class="quantity-btn quantity-plus">+</button>
                            </div>
                            <button class="remove-item">
                                <i class="fas fa-trash-alt"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        const tax = subtotal * 0.08; // Example 8% tax
        const total = subtotal + tax;

        cartContainer.innerHTML = `
            <div class="cart-items">
                ${itemsHTML}
            </div>
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax (8%):</span>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Total:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
                <button id="checkoutBtn" class="checkout-btn">
                    <i class="fas fa-credit-card"></i> Proceed to Checkout
                </button>
            </div>
        `;
    }

    function updateCartItem(itemId, newQuantity) {
        try {
            if (CartManager.updateItemQuantity(itemId, newQuantity)) {
                renderCart();
                showNotification('Cart updated!', 'success');
            } else {
                showNotification('Failed to update cart', 'error');
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            showNotification('Error updating cart', 'error');
        }
    }

    function removeCartItem(itemId) {
        try {
            if (CartManager.removeItem(itemId)) {
                renderCart();
                showNotification('Item removed from cart', 'success');
            } else {
                showNotification('Failed to remove item', 'error');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            showNotification('Error removing item', 'error');
        }
    }

    function showNotification(message, type = 'success') {
        if (!notification) return;

        notification.className = `notification ${type}`;
        notificationMessage.textContent = message;
        notificationIcon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';

        notification.style.display = 'flex';
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.style.display = 'none', 300);
        }, 3000);
    }

    renderCart();

    cartContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-minus')) {
            const input = e.target.nextElementSibling;
            if (input.value > 1) {
                input.value = parseInt(input.value) - 1;
                updateCartItem(e.target.closest('.cart-item').dataset.id, parseInt(input.value));
            }
        }

        if (e.target.classList.contains('quantity-plus')) {
            const input = e.target.previousElementSibling;
            input.value = parseInt(input.value) + 1;
            updateCartItem(e.target.closest('.cart-item').dataset.id, parseInt(input.value));
        }

        if (e.target.classList.contains('remove-item')) {
            removeCartItem(e.target.closest('.cart-item').dataset.id);
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target.id === 'checkoutBtn') {
            e.preventDefault();
            showNotification('Processing your order...', 'success');

            // Simulate order placement
            const cartItems = CartManager.getItems();
            if (cartItems.length === 0) {
                showNotification('Your cart is empty.', 'error');
                return;
            }

            // Calculate totals
            let subtotal = 0;
            cartItems.forEach(item => {
                subtotal += item.price * item.quantity;
            });
            const tax = subtotal * 0.08; // 8% tax
            const deliveryFee = 5.00; // Flat delivery fee
            const total = subtotal + tax + deliveryFee;

            // Create order object
            const orderId = 'ORD-' + Date.now();
            const orderDate = new Date().toISOString();
            const estimatedDeliveryDate = new Date();
            estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 1); // Next day delivery

            const order = {
                orderId: orderId,
                date: orderDate,
                status: 'Processing',
                estimatedDelivery: estimatedDeliveryDate.toISOString(),
                items: cartItems,
                subtotal: subtotal,
                tax: tax,
                deliveryFee: deliveryFee,
                total: total
            };

            // Save order to localStorage
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));

            // Clear cart - for demo, just clear mock CartManager items (if real, clear storage or backend)
            // Here we simulate clearing by replacing CartManager.getItems to return empty array
            CartManager.getItems = function() { return []; };
            renderCart();

            // Redirect to customer order confirmation page after short delay
            setTimeout(() => {
                window.location.href = 'customer-order-confirmation.html';
            }, 1500);
        }
    });
});
