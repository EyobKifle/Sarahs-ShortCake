// Customer Menu Manager for Sarah's Short Cakes
// This is specifically for customer dashboard menu page

document.addEventListener('DOMContentLoaded', function() {
    console.log('🍰 Customer menu page loading...');

    // Initialize CartManager first
    if (typeof CartManager !== 'undefined') {
        // Load cart from localStorage first
        CartManager.loadCart();
        console.log('🛒 Cart loaded from localStorage:', CartManager.cart);

        // Initialize other components
        CartManager.updateCartCount();

        console.log('✅ Customer CartManager initialized');
    } else {
        console.error('❌ Customer CartManager not found!');
    }

    // Initialize menu items
    const menuGrid = document.getElementById('menu-grid');
    if (menuGrid) {
        loadMenuItems();
    }

    // Setup add to cart functionality
    setupAddToCartListeners();

    console.log('✅ Customer menu page initialized');
});

// Load menu items from backend or static data
async function loadMenuItems() {
    try {
        console.log('🍰 Loading customer menu items...');

        // Use the same menu data as the public menu for consistency
        const menuItems = [
            {
                id: "vanilla",
                name: "Vanilla Cupcake",
                price: 3.99,
                image: "images/menu images/Vanilla cupcake with Vanilla icing.jpg",
                description: "Classic vanilla cupcake with vanilla buttercream frosting"
            },
            {
                id: "chocolate",
                name: "Chocolate Cupcake",
                price: 3.99,
                image: "images/menu images/Chocolate cupcake with vanilla icing.jpg",
                description: "Rich chocolate cupcake with vanilla buttercream frosting"
            },
            {
                id: "red-velvet",
                name: "Red Velvet Cupcake",
                price: 4.49,
                image: "images/menu images/Red Velvet cak.jpg",
                description: "Classic red velvet cupcake with cream cheese frosting"
            },
            {
                id: "french-vanilla",
                name: "French Vanilla Cupcake",
                price: 4.49,
                image: "images/menu images/French Vanilla cupcake with vanilla icing.jpg",
                description: "Delicate French vanilla cupcake with vanilla buttercream"
            },
            {
                id: "white-chocolate",
                name: "White Chocolate Cupcake",
                price: 4.99,
                image: "images/menu images/White chocolate with cream cheese.jpg",
                description: "White chocolate cupcake with cream cheese frosting"
            },
            {
                id: "double-chocolate",
                name: "Double Chocolate Cupcake",
                price: 4.99,
                image: "images/menu images/double chocolate with coocie crumbs.jpg",
                description: "Rich chocolate cupcake with chocolate frosting and cookie crumbs"
            },
            {
                id: "strawberry",
                name: "Strawberry Cupcake",
                price: 4.99,
                image: "images/menu images/strawberry cupcake with peanut icing.jpg",
                description: "Fresh strawberry cupcake with peanut butter frosting"
            },
            {
                id: "peanut-butter",
                name: "Peanut Butter Cupcake",
                price: 4.99,
                image: "images/menu images/peanut butter cupcake with oreo icing.jpg",
                description: "Peanut butter cupcake with Oreo frosting"
            },
            {
                id: "blueberry",
                name: "Blueberry Cupcake",
                price: 4.99,
                image: "images/menu images/blueberry cupcake with mint icing.jpg",
                description: "Fresh blueberry cupcake with mint frosting"
            },
            {
                id: "pumpkin-spice",
                name: "Pumpkin Spice Cupcake",
                price: 4.99,
                image: "images/menu images/pumpkin spice with champagne icing.jpg",
                description: "Seasonal pumpkin spice cupcake with champagne frosting"
            },
            {
                id: "apple-cinnamon",
                name: "Apple Cinnamon Cupcake",
                price: 4.99,
                image: "images/menu images/apple cinammon cupcake with german cocolate icing.jpg",
                description: "Apple cinnamon cupcake with German chocolate frosting"
            },
            {
                id: "cookies-cream",
                name: "Cookies and Cream Cupcake",
                price: 4.99,
                image: "images/menu images/cookies and cream cupcake with  espresso icing.jpg",
                description: "Cookies and cream cupcake with espresso frosting"
            },
            {
                id: "champagne",
                name: "Champagne Cupcake",
                price: 5.49,
                image: "images/menu images/champagne cupcake with lemon icing.jpg",
                description: "Elegant champagne cupcake with lemon frosting"
            },
            {
                id: "chocolate-cheesecake",
                name: "Chocolate Cheesecake Cupcake",
                price: 5.99,
                image: "images/menu images/Chocolate cheesecake with maple bacon.jpg",
                description: "Chocolate cheesecake cupcake with maple bacon frosting"
            },
            {
                id: "mississippi-mud",
                name: "Mississippi Mud Cupcake",
                price: 5.99,
                image: "images/menu images/missipi mud cake with dark choclate icing.jpg",
                description: "Rich chocolate cupcake with dark chocolate frosting"
            },
            {
                id: "coconut",
                name: "Coconut Cupcake",
                price: 4.99,
                image: "images/menu images/cocunut cupcake with coconut pecan icing.jpg",
                description: "Tropical coconut cupcake with coconut pecan frosting"
            },
            {
                id: "smores",
                name: "S'mores Cupcake",
                price: 5.49,
                image: "images/menu images/smores cupcake strawberry icing.jpg",
                description: "Graham cracker cupcake with strawberry frosting"
            }
        ];

        renderMenuItems(menuItems);
        console.log('✅ Menu items loaded successfully');
    } catch (error) {
        console.error('❌ Error loading menu items:', error);
        const menuGrid = document.getElementById('menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = '<p>Failed to load menu items. Please try again later.</p>';
        }
    }
}

// Render menu items to the grid (matching public menu structure)
function renderMenuItems(items) {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    // Clear existing content
    menuGrid.innerHTML = '';

    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='images/default-preview.jpg'">
            <div class="menu-item-content">
                <h3 class="menu-item-title">${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <p class="menu-item-price">$${item.price.toFixed(2)}</p>
                <div class="quantity-control">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="quantity-input" value="1" min="1" max="12">
                    <button class="quantity-btn plus">+</button>
                </div>
                <button class="add-to-cart" data-item="${encodeURIComponent(JSON.stringify(item))}">
                    <i class="fas fa-cart-plus"></i>
                    Add to Cart
                </button>
            </div>
        `;
        menuGrid.appendChild(menuItem);
    });
}

// Setup add to cart event listeners
function setupAddToCartListeners() {
    // Add to cart functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            console.log('🛒 Customer add to cart button clicked');

            try {
                const itemData = JSON.parse(decodeURIComponent(e.target.dataset.item));
                const quantityInput = e.target.closest('.menu-item').querySelector('.quantity-input');
                const quantity = parseInt(quantityInput.value) || 1;

                console.log('🛒 Adding item to customer cart:', itemData, 'Quantity:', quantity);

                const cartItem = {
                    ...itemData,
                    quantity: quantity
                };

                if (CartManager.addItem(cartItem)) {
                    showNotification('Item added to customer cart!', 'success');
                    updateCartCount();
                    console.log('✅ Item added to customer cart successfully');
                } else {
                    showNotification('Failed to add item to customer cart', 'error');
                }
            } catch (error) {
                console.error('Error adding to customer cart:', error);
                showNotification('Error adding to cart', 'error');
            }
        }

        // Quantity controls
        if (e.target.classList.contains('quantity-btn')) {
            const input = e.target.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value) || 1;

            if (e.target.classList.contains('plus') && value < 12) {
                value++;
            } else if (e.target.classList.contains('minus') && value > 1) {
                value--;
            }

            input.value = value;
        }
    });

    // Handle quantity input changes
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            let value = parseInt(e.target.value) || 1;
            value = Math.max(1, Math.min(12, value));
            e.target.value = value;
        }
    });
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        notification.innerHTML = `
            <i id="notification-icon" class="fas fa-check-circle"></i>
            <span id="notification-message"></span>
        `;
        document.body.appendChild(notification);
    }

    notification.className = `notification ${type}`;
    document.getElementById('notification-message').textContent = message;
    const icon = document.getElementById('notification-icon');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';

    notification.style.display = 'flex';
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.style.display = 'none', 300);
    }, 3000);
}

// Update cart count
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount && typeof CartManager !== 'undefined') {
        const count = CartManager.getItemCount();
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Add notification styles if they don't exist
if (!document.getElementById('customer-menu-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'customer-menu-notification-styles';
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
    `;
    document.head.appendChild(style);
}
