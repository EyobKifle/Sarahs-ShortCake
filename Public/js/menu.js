// menu.js - Final Debugged Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    // Wait for CartManager to be available
    const checkCartManager = setInterval(() => {
        if (typeof CartManager !== 'undefined') {
            clearInterval(checkCartManager);
            initializeMenu();
        } else {
            console.log('Waiting for CartManager...');
        }
    }, 100);
});

function initializeMenu() {
    console.log('Initializing menu system');
    
    try {
        CartManager.init();
        console.log('CartManager initialized successfully');
        
        setupMenuItems();
        setupCustomCakeForm();
        setupQuantityControls();
        
        console.log('Menu system ready');
    } catch (error) {
        console.error('Failed to initialize menu:', error);
    }
}

// Menu Items Handler
function setupMenuItems() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) {
        console.warn('Menu grid container not found');
        return;
    }

    console.log('Setting up menu items');
    
    menuGrid.addEventListener('click', function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart');
        if (!addToCartBtn) return;

        e.preventDefault();
        e.stopImmediatePropagation();
        
        console.log('Add to cart button clicked');
        
        const menuItem = addToCartBtn.closest('.menu-item');
        if (!menuItem) {
            console.warn('Could not find parent menu item');
            return;
        }

        const quantityInput = menuItem.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value) || 1;
        
        try {
            if (!addToCartBtn.dataset.item) {
                throw new Error('Missing data-item attribute');
            }
            
            const itemData = JSON.parse(addToCartBtn.dataset.item);
            console.log('Parsed item data:', itemData);
            
            // Validate required fields
            if (!itemData.id || !itemData.name || !itemData.price) {
                throw new Error('Invalid item data structure');
            }

            const cartItem = {
                id: itemData.id.toString(),
                name: itemData.name,
                price: parseFloat(itemData.price),
                quantity: quantity,
                image: itemData.image || 'images/default-preview.jpg',
                description: itemData.description || '',
                timestamp: Date.now() // For debugging
            };

            console.log('Attempting to add to cart:', cartItem);
            
            const success = CartManager.addItem(cartItem);
            console.log('Add to cart result:', success);
            
            if (success) {
                quantityInput.value = 1;
                console.log('Item successfully added to cart');
                CartManager.showNotification(`${itemData.name} added to cart`, 'success');
            } else {
                throw new Error('CartManager.addItem returned false');
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            CartManager.showNotification('Failed to add item to cart', 'error');
        }
    });
}

// Custom Cake Form Handler
function setupCustomCakeForm() {
    const form = document.getElementById('customCakeForm');
    if (!form) {
        console.log('Custom cake form not found - skipping setup');
        return;
    }

    console.log('Setting up custom cake form');
    
    // Initialize visual elements
    const cakeBase = document.getElementById('cakeBase');
    const cakeIcing = document.getElementById('cakeIcing');
    const baseColorSelect = document.getElementById('baseColor');
    const icingColorSelect = document.getElementById('icingColor');
    const priceDisplay = document.getElementById('priceDisplay');

    // Set initial colors
    updateCakeColors();

    // Form change handlers
    form.querySelectorAll('select, input, textarea').forEach(element => {
        element.addEventListener('change', handleFormChange);
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Custom cake form submitted');
        
        const formData = new FormData(form);
        const quantity = parseInt(formData.get('quantity')) || 1;
        
        try {
            const customCake = {
                id: `custom-${Date.now()}`,
                name: 'Custom Cake',
                price: calculateCustomCakePrice(formData),
                quantity: quantity,
                image: 'images/default-preview.jpg',
                customizations: getCustomizations(formData),
                timestamp: Date.now()
            };

            console.log('Custom cake data:', customCake);
            
            const success = CartManager.addItem(customCake);
            console.log('Add to cart result:', success);
            
            if (success) {
                form.reset();
                updateCakeColors();
                updateCustomCakePrice(form);
                CartManager.showNotification('Custom cake added to cart!', 'success');
                console.log('Custom cake added successfully');
            } else {
                throw new Error('CartManager.addItem returned false');
            }
        } catch (error) {
            console.error('Error adding custom cake:', error);
            CartManager.showNotification('Failed to add custom cake', 'error');
        }
    });

    function handleFormChange() {
        updateCakeColors();
        updateCustomCakePrice(form);
    }

    function updateCakeColors() {
        if (cakeBase && baseColorSelect) {
            const color = baseColorSelect.value || '#8B4513';
            cakeBase.style.backgroundColor = color;
            console.log('Updated base color:', color);
        }
        if (cakeIcing && icingColorSelect) {
            const color = icingColorSelect.value || '#FFB6C1';
            cakeIcing.style.backgroundColor = color;
            console.log('Updated icing color:', color);
        }
    }
}

// Price Calculation
function updateCustomCakePrice(form) {
    const priceDisplay = document.getElementById('priceDisplay');
    if (!priceDisplay) return;

    try {
        const formData = new FormData(form);
        const price = calculateCustomCakePrice(formData);
        priceDisplay.textContent = `$${price.toFixed(2)}`;
        console.log('Updated price display:', priceDisplay.textContent);
    } catch (error) {
        console.error('Error updating price:', error);
    }
}

function calculateCustomCakePrice(formData) {
    let price = 25.00; // Base price

    // Flavor adjustments
    const flavor = formData.get('flavor');
    if (['red-velvet', 'french-vanilla'].includes(flavor)) price += 2.00;
    if (['chocolate-cheesecake', 'mississippi-mud'].includes(flavor)) price += 3.00;

    // Icing adjustments
    const icing = formData.get('icing');
    if (icing === 'fondant') price += 5.00;
    if (icing === 'ganache') price += 3.00;

    // Decoration adjustments
    const decorations = formData.get('decorations');
    if (['floral', 'geometric'].includes(decorations)) price += 4.00;
    if (['custom', 'themed'].includes(decorations)) price += 6.00;

    console.log('Calculated price:', price);
    return price;
}

function getCustomizations(formData) {
    const customizations = [];
    const fields = [
        { name: 'Flavor', key: 'flavor' },
        { name: 'Base Color', key: 'baseColor' },
        { name: 'Icing', key: 'icing' },
        { name: 'Icing Color', key: 'icingColor' },
        { name: 'Decorations', key: 'decorations' }
    ];

    fields.forEach(field => {
        const value = formData.get(field.key);
        if (value) {
            customizations.push({ 
                name: field.name, 
                value: value,
                timestamp: Date.now()
            });
        }
    });

    const specialInstructions = formData.get('specialInstructions');
    if (specialInstructions) {
        customizations.push({ 
            name: 'Special Instructions', 
            value: specialInstructions,
            timestamp: Date.now()
        });
    }

    console.log('Generated customizations:', customizations);
    return customizations;
}

// Quantity Controls
function setupQuantityControls() {
    console.log('Setting up quantity controls');
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const control = e.target.closest('.quantity-control');
            if (!control) return;

            const input = control.querySelector('.quantity-input');
            if (!input) return;

            let value = parseInt(input.value) || 1;
            
            if (e.target.classList.contains('minus')) {
                value = Math.max(1, value - 1);
            } else {
                value = Math.min(12, value + 1);
            }

            input.value = value;
            console.log('Updated quantity:', value);
        }
    });

    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            let value = parseInt(e.target.value) || 1;
            value = Math.max(1, Math.min(12, value));
            e.target.value = value;
            console.log('Validated quantity:', value);
        }
    });
}