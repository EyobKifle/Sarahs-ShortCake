document.addEventListener('DOMContentLoaded', function() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) {
        console.error('Menu grid container not found');
        return;
    }

    // Fetch products from backend API
    fetch('/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            return response.json();
        })
        .then(data => {
            if (!data.success || !Array.isArray(data.data)) {
                throw new Error('Invalid products data');
            }
            const products = data.data;

            // Populate menu grid with products
            products.forEach(product => {
                const item = {
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.image || 'images/default-preview.jpg',
                    description: product.description || ''
                };

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
                        <button class="add-to-cart" data-item='${JSON.stringify(item)}'>
                            Add to Cart
                        </button>
                    </div>
                `;
                menuGrid.appendChild(menuItem);
            });
        })
        .catch(error => {
            console.error('Error loading products:', error);
            menuGrid.innerHTML = '<p>Failed to load products. Please try again later.</p>';
        });

    // Add to cart functionality delegated to document
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const itemData = JSON.parse(e.target.dataset.item);
            const quantityInput = e.target.closest('.menu-item').querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value) || 1;

            const cartItem = {
                ...itemData,
                quantity: quantity
            };

            try {
                if (CartManager.addItem(cartItem)) {
                    CartManager.showNotification('Item added to cart!', 'success');
                    quantityInput.value = 1;
                    CartManager.updateCartCount();
                } else {
                    CartManager.showNotification('Failed to add item to cart', 'error');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                CartManager.showNotification('Error adding to cart', 'error');
            }
        }
    });
});
