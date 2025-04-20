// inventory.js - Complete Inventory Management System for Sarah's Short Cakes

// Database setup
const db = {
    save: function(data) {
        localStorage.setItem('inventoryDB', JSON.stringify(data));
    },
    load: function() {
        const data = localStorage.getItem('inventoryDB');
        return data ? JSON.parse(data) : null;
    }
};

// Initialize inventory database with all recipes
function initInventory() {
    if (!db.load()) {
        const initialInventory = {
            ingredients: {
                // Dry Ingredients
                'all-purpose-flour': { name: 'All-purpose flour', quantity: 50, unit: 'cups', threshold: 10 },
                'sugar': { name: 'Sugar', quantity: 30, unit: 'cups', threshold: 8 },
                'baking-powder': { name: 'Baking powder', quantity: 5, unit: 'tsp', threshold: 2 },
                'baking-soda': { name: 'Baking soda', quantity: 5, unit: 'tsp', threshold: 2 },
                'salt': { name: 'Salt', quantity: 5, unit: 'tsp', threshold: 1 },
                'cocoa-powder': { name: 'Cocoa powder', quantity: 10, unit: 'cups', threshold: 3 },
                'cinnamon': { name: 'Cinnamon', quantity: 2, unit: 'tsp', threshold: 0.5 },
                'nutmeg': { name: 'Nutmeg', quantity: 1, unit: 'tsp', threshold: 0.25 },
                'ginger': { name: 'Ginger', quantity: 1, unit: 'tsp', threshold: 0.25 },
                'clove': { name: 'Clove', quantity: 0.5, unit: 'tsp', threshold: 0.1 },
                
                // Wet Ingredients
                'unsalted-butter': { name: 'Unsalted butter', quantity: 20, unit: 'cups', threshold: 5 },
                'eggs': { name: 'Eggs', quantity: 60, unit: 'pieces', threshold: 12 },
                'milk': { name: 'Milk', quantity: 10, unit: 'cups', threshold: 3 },
                'buttermilk': { name: 'Buttermilk', quantity: 5, unit: 'cups', threshold: 2 },
                'vegetable-oil': { name: 'Vegetable oil', quantity: 10, unit: 'cups', threshold: 3 },
                'pumpkin-puree': { name: 'Pumpkin puree', quantity: 3, unit: 'cups', threshold: 1 },
                'strawberry-puree': { name: 'Strawberry puree', quantity: 3, unit: 'cups', threshold: 1 },
                'champagne': { name: 'Champagne', quantity: 2, unit: 'cups', threshold: 0.5 },
                'coconut-milk': { name: 'Coconut milk', quantity: 2, unit: 'cups', threshold: 0.5 },
                
                // Flavorings and Extras
                'vanilla-extract': { name: 'Vanilla extract', quantity: 5, unit: 'tsp', threshold: 1 },
                'french-vanilla-extract': { name: 'French vanilla extract', quantity: 2, unit: 'tsp', threshold: 0.5 },
                'red-food-coloring': { name: 'Red food coloring', quantity: 2, unit: 'tbsp', threshold: 0.5 },
                'white-vinegar': { name: 'White vinegar', quantity: 1, unit: 'tsp', threshold: 0.5 },
                'white-chocolate': { name: 'White chocolate', quantity: 16, unit: 'oz', threshold: 4 },
                'chocolate-chips': { name: 'Chocolate chips', quantity: 5, unit: 'cups', threshold: 1 },
                'peanut-butter': { name: 'Peanut butter', quantity: 3, unit: 'cups', threshold: 1 },
                'blueberries': { name: 'Blueberries', quantity: 4, unit: 'cups', threshold: 1 },
                'oreo-cookies': { name: 'Oreo cookies', quantity: 2, unit: 'cups', threshold: 0.5 },
                'cream-cheese': { name: 'Cream cheese', quantity: 16, unit: 'oz', threshold: 4 },
                'mini-marshmallows': { name: 'Mini marshmallows', quantity: 3, unit: 'cups', threshold: 1 },
                'shredded-coconut': { name: 'Shredded coconut', quantity: 2, unit: 'cups', threshold: 0.5 },
                'graham-cracker-crumbs': { name: 'Graham cracker crumbs', quantity: 2, unit: 'cups', threshold: 0.5 },
                'chopped-pecans': { name: 'Chopped pecans', quantity: 1, unit: 'cups', threshold: 0.25 },
                'freeze-dried-strawberries': { name: 'Freeze-dried strawberries', quantity: 1, unit: 'cups', threshold: 0.25 }
            },
            recipes: {
                'vanilla-cupcake': {
                    name: 'Vanilla Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'sugar': 0.75,
                        'baking-powder': 1.5,
                        'salt': 0.25,
                        'unsalted-butter': 0.5,
                        'eggs': 2,
                        'milk': 0.5,
                        'vanilla-extract': 1.5
                    },
                    batchSize: 12
                },
                'chocolate-cupcake': {
                    name: 'Chocolate Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1,
                        'sugar': 1,
                        'cocoa-powder': 0.5,
                        'baking-soda': 1,
                        'baking-powder': 0.5,
                        'salt': 0.25,
                        'eggs': 2,
                        'buttermilk': 0.5,
                        'vegetable-oil': 0.5,
                        'vanilla-extract': 1
                    },
                    batchSize: 12
                },
                'red-velvet-cupcake': {
                    name: 'Red Velvet Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.25,
                        'sugar': 1,
                        'cocoa-powder': 0.0625,
                        'baking-soda': 0.5,
                        'salt': 0.25,
                        'buttermilk': 0.5,
                        'vegetable-oil': 0.5,
                        'eggs': 1,
                        'red-food-coloring': 0.0625,
                        'white-vinegar': 1,
                        'vanilla-extract': 1
                    },
                    batchSize: 12
                },
                'french-vanilla-cupcake': {
                    name: 'French Vanilla Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'sugar': 0.75,
                        'baking-powder': 1.5,
                        'salt': 0.25,
                        'unsalted-butter': 0.5,
                        'eggs': 3,
                        'milk': 0.5,
                        'french-vanilla-extract': 1.5
                    },
                    batchSize: 12
                },
                'white-chocolate-cupcake': {
                    name: 'White Chocolate Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.25,
                        'baking-powder': 1,
                        'salt': 0.25,
                        'sugar': 0.75,
                        'eggs': 2,
                        'unsalted-butter': 0.5,
                        'milk': 0.5,
                        'white-chocolate': 4,
                        'vanilla-extract': 1
                    },
                    batchSize: 12
                },
                'double-chocolate-cupcake': {
                    name: 'Double Chocolate Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1,
                        'cocoa-powder': 0.5,
                        'baking-powder': 1,
                        'baking-soda': 0.5,
                        'salt': 0.25,
                        'sugar': 1,
                        'eggs': 2,
                        'milk': 0.5,
                        'vegetable-oil': 0.5,
                        'vanilla-extract': 1,
                        'chocolate-chips': 0.5
                    },
                    batchSize: 12
                },
                'strawberry-cupcake': {
                    name: 'Strawberry Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'baking-powder': 1.5,
                        'salt': 0.25,
                        'sugar': 0.75,
                        'unsalted-butter': 0.5,
                        'eggs': 2,
                        'milk': 0.5,
                        'vanilla-extract': 1,
                        'strawberry-puree': 0.5,
                        'freeze-dried-strawberries': 0.125
                    },
                    batchSize: 12
                },
                'peanut-butter-cupcake': {
                    name: 'Peanut Butter Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'baking-powder': 1,
                        'salt': 0.25,
                        'sugar': 0.75,
                        'eggs': 2,
                        'unsalted-butter': 0.25,
                        'peanut-butter': 0.5,
                        'milk': 0.5,
                        'vanilla-extract': 1
                    },
                    batchSize: 12
                },
                'blueberry-cupcake': {
                    name: 'Blueberry Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'baking-powder': 1.5,
                        'salt': 0.25,
                        'sugar': 0.75,
                        'unsalted-butter': 0.5,
                        'eggs': 2,
                        'milk': 0.5,
                        'vanilla-extract': 1,
                        'blueberries': 0.75
                    },
                    batchSize: 12
                },
                'pumpkin-spice-cupcake': {
                    name: 'Pumpkin Spice Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'baking-powder': 1,
                        'baking-soda': 0.5,
                        'salt': 0.25,
                        'pumpkin-puree': 0.75,
                        'eggs': 2,
                        'sugar': 0.75,
                        'vegetable-oil': 0.5,
                        'cinnamon': 1,
                        'nutmeg': 0.5,
                        'ginger': 0.5,
                        'clove': 0.25,
                        'vanilla-extract': 1
                    },
                    batchSize: 12
                },
                'apple-cinnamon-cupcake': {
                    name: 'Apple Cinnamon Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'baking-powder': 1.5,
                        'salt': 0.25,
                        'sugar': 0.75,
                        'unsalted-butter': 0.5,
                        'eggs': 2,
                        'milk': 0.25,
                        'vanilla-extract': 1,
                        'cinnamon': 1
                    },
                    batchSize: 12
                },
                'cookies-and-cream-cupcake': {
                    name: 'Cookies and Cream Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.25,
                        'sugar': 0.75,
                        'baking-powder': 1.5,
                        'salt': 0.25,
                        'eggs': 2,
                        'unsalted-butter': 0.5,
                        'milk': 0.5,
                        'vanilla-extract': 1,
                        'oreo-cookies': 0.5
                    },
                    batchSize: 12
                },
                'champagne-cupcake': {
                    name: 'Champagne Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'baking-powder': 1,
                        'salt': 0.25,
                        'sugar': 0.75,
                        'unsalted-butter': 0.5,
                        'eggs': 2,
                        'champagne': 0.5,
                        'vanilla-extract': 1
                    },
                    batchSize: 12
                },
                'chocolate-cheesecake-cupcake': {
                    name: 'Chocolate Cheesecake Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1,
                        'cocoa-powder': 0.33,
                        'sugar': 0.75,
                        'baking-soda': 0.5,
                        'salt': 0.25,
                        'eggs': 2,
                        'vegetable-oil': 0.5,
                        'milk': 0.5,
                        'cream-cheese': 4,
                        'vanilla-extract': 1
                    },
                    batchSize: 12
                },
                'mississippi-mud-cupcake': {
                    name: 'Mississippi Mud Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1,
                        'cocoa-powder': 0.5,
                        'baking-soda': 0.5,
                        'salt': 0.25,
                        'sugar': 1,
                        'eggs': 2,
                        'unsalted-butter': 0.5,
                        'buttermilk': 0.5,
                        'mini-marshmallows': 1,
                        'chopped-pecans': 0.5
                    },
                    batchSize: 12
                },
                'coconut-cupcake': {
                    name: 'Coconut Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.5,
                        'baking-powder': 1,
                        'salt': 0.25,
                        'sugar': 0.75,
                        'eggs': 2,
                        'unsalted-butter': 0.5,
                        'coconut-milk': 0.5,
                        'vanilla-extract': 1,
                        'shredded-coconut': 0.5
                    },
                    batchSize: 12
                },
                'smores-cupcake': {
                    name: 'S\'mores Cupcake',
                    ingredients: {
                        'all-purpose-flour': 1.25,
                        'cocoa-powder': 0.5,
                        'baking-powder': 1,
                        'salt': 0.25,
                        'sugar': 0.75,
                        'eggs': 2,
                        'unsalted-butter': 0.5,
                        'milk': 0.5,
                        'graham-cracker-crumbs': 0.5,
                        'mini-marshmallows': 0.5,
                        'chocolate-chips': 0.5
                    },
                    batchSize: 12
                }
            },
            restockHistory: [],
            lowStockNotifications: []
        };
        db.save(initialInventory);
    }
}

// Load inventory data
function loadInventoryData() {
    return db.load();
}

// Save inventory data
function saveInventoryData(data) {
    db.save(data);
}

// Update inventory after order confirmation
function updateInventoryForOrder(orderItems) {
    const inventory = loadInventoryData();
    let insufficientIngredients = [];
    
    // First check if we have enough ingredients
    orderItems.forEach(item => {
        const recipe = inventory.recipes[item.recipeId];
        if (recipe) {
            const batchesNeeded = Math.ceil(item.quantity / recipe.batchSize);
            
            for (const [ingredientId, amount] of Object.entries(recipe.ingredients)) {
                const totalNeeded = amount * batchesNeeded;
                if (!inventory.ingredients[ingredientId] || inventory.ingredients[ingredientId].quantity < totalNeeded) {
                    insufficientIngredients.push({
                        ingredient: inventory.ingredients[ingredientId]?.name || ingredientId,
                        needed: totalNeeded,
                        available: inventory.ingredients[ingredientId]?.quantity || 0,
                        unit: inventory.ingredients[ingredientId]?.unit || 'units'
                    });
                }
            }
        }
    });
    
    // If not enough ingredients, return false with the list
    if (insufficientIngredients.length > 0) {
        return {
            success: false,
            message: 'Insufficient ingredients to fulfill order',
            insufficientIngredients
        };
    }
    
    // If we have enough, deduct the ingredients
    orderItems.forEach(item => {
        const recipe = inventory.recipes[item.recipeId];
        if (recipe) {
            const batchesNeeded = Math.ceil(item.quantity / recipe.batchSize);
            
            for (const [ingredientId, amount] of Object.entries(recipe.ingredients)) {
                const totalUsed = amount * batchesNeeded;
                inventory.ingredients[ingredientId].quantity -= totalUsed;
                
                // Round to 2 decimal places for cleanliness
                inventory.ingredients[ingredientId].quantity = 
                    Math.round(inventory.ingredients[ingredientId].quantity * 100) / 100;
                
                // Check if this brings the ingredient below threshold
                checkLowStock(inventory.ingredients[ingredientId]);
            }
        }
    });
    
    saveInventoryData(inventory);
    return { success: true };
}

// Check for low stock and create notification if needed
function checkLowStock(ingredient) {
    const inventory = loadInventoryData();
    
    if (ingredient.quantity <= 0) {
        // Critical stock - completely out
        addNotification(`${ingredient.name} is out of stock!`, 'critical');
    } else if (ingredient.quantity <= ingredient.threshold) {
        // Low stock
        addNotification(`${ingredient.name} is running low (${ingredient.quantity} ${ingredient.unit} remaining)`, 'warning');
    }
}

// Add a notification to the system
function addNotification(message, type) {
    const inventory = loadInventoryData();
    const notification = {
        id: Date.now(),
        message,
        type,
        date: new Date().toISOString(),
        read: false
    };
    
    inventory.lowStockNotifications.unshift(notification);
    saveInventoryData(inventory);
    
    // Update UI if we're on the inventory page
    if (window.location.pathname.includes('admin-inventory.html')) {
        showAlert(notification.message, notification.type);
        updateNotificationBadges();
    }
}

// Show alert notification
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show alert-notification`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const notificationArea = document.getElementById('notificationArea');
    notificationArea.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}

// Restock an ingredient
function restockIngredient(ingredientId, quantity, notes = '') {
    const inventory = loadInventoryData();
    
    if (inventory.ingredients[ingredientId]) {
        inventory.ingredients[ingredientId].quantity += quantity;
        
        // Add to restock history
        inventory.restockHistory.unshift({
            ingredientId,
            quantity,
            notes,
            date: new Date().toISOString(),
            newQuantity: inventory.ingredients[ingredientId].quantity
        });
        
        saveInventoryData(inventory);
        
        // Check if this restock resolves a low stock notification
        const ingredient = inventory.ingredients[ingredientId];
        if (ingredient.quantity > ingredient.threshold) {
            // Remove any low stock notifications for this ingredient
            inventory.lowStockNotifications = inventory.lowStockNotifications.filter(
                notif => !notif.message.includes(ingredient.name)
            );
            saveInventoryData(inventory);
        }
        
        return true;
    }
    return false;
}

// Add a new ingredient to inventory
function addNewIngredient(name, initialQuantity, unit, threshold) {
    const inventory = loadInventoryData();
    const ingredientId = name.toLowerCase().replace(/\s+/g, '-');
    
    if (inventory.ingredients[ingredientId]) {
        return { success: false, message: 'Ingredient already exists' };
    }
    
    inventory.ingredients[ingredientId] = {
        name,
        quantity: initialQuantity,
        unit,
        threshold
    };
    
    saveInventoryData(inventory);
    return { success: true };
}

// Map order items to recipe IDs
function mapOrderItemsToRecipes(orderItems) {
    return orderItems.map(item => {
        // Convert item name to recipe ID format (e.g., "Chocolate Cupcake" -> "chocolate-cupcake")
        const recipeId = item.name.toLowerCase().replace(/\s+/g, '-');
        return {
            recipeId: recipeId,
            quantity: item.quantity
        };
    });
}

// Helper functions
function getIngredientStatus(ingredient) {
    if (ingredient.quantity <= 0) return 'critical';
    if (ingredient.quantity <= ingredient.threshold) return 'low';
    return 'ok';
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'critical': return 'badge-critical';
        case 'low': return 'badge-low';
        default: return 'badge-ok';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'critical': return 'Out of Stock';
        case 'low': return 'Low Stock';
        default: return 'In Stock';
    }
}

function getIngredientIcon(ingredientId) {
    // Map ingredient IDs to appropriate Font Awesome icons
    const iconMap = {
        'flour': 'wheat-awn',
        'sugar': 'cubes-stacked',
        'butter': 'cow',
        'eggs': 'egg',
        'milk': 'bottle-water',
        'chocolate': 'mug-hot',
        'vanilla': 'leaf',
        'fruit': 'apple-whole',
        'cheese': 'cheese',
        'nut': 'acorn',
        'spice': 'mortar-pestle',
        'coffee': 'coffee',
        'alcohol': 'wine-bottle'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
        if (ingredientId.includes(key)) return icon;
    }
    
    return 'shapes'; // Default icon
}

function getRecipeIcon(recipeId) {
    const iconMap = {
        'vanilla': 'ice-cream',
        'chocolate': 'mug-hot',
        'red-velvet': 'heart',
        'french': 'flag',
        'white-chocolate': 'mug-saucer',
        'double-chocolate': 'mug-hot',
        'strawberry': 'strawberry',
        'peanut-butter': 'jar',
        'blueberry': 'blueberry',
        'pumpkin': 'pumpkin',
        'apple': 'apple-whole',
        'cookies': 'cookie',
        'champagne': 'wine-glass',
        'cheesecake': 'cheese',
        'mississippi': 'mug-hot',
        'coconut': 'coconut',
        'smores': 'campground'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
        if (recipeId.includes(key)) {
            return icon;
        }
    }
    
    return 'cupcake'; // Default icon
}

function populateIngredientSelect() {
    const inventory = loadInventoryData();
    const select = document.getElementById('ingredientSelect');
    select.innerHTML = '<option value="" selected disabled>Select ingredient</option>';
    
    for (const [id, ingredient] of Object.entries(inventory.ingredients)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${ingredient.name} (Current: ${ingredient.quantity} ${ingredient.unit})`;
        select.appendChild(option);
    }
}

function setupEventListeners() {
    // Restock form submission
    document.getElementById('confirmRestock').addEventListener('click', function() {
        const ingredientId = document.getElementById('ingredientSelect').value;
        const quantity = parseFloat(document.getElementById('restockQuantity').value);
        const notes = document.getElementById('restockNotes').value;
        
        if (ingredientId && quantity) {
            if (restockIngredient(ingredientId, quantity, notes)) {
                showAlert('Ingredient restocked successfully!', 'success');
                renderInventoryTable();
                updateSummaryCards();
                
                // Reset form
                document.getElementById('restockForm').reset();
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('restockModal')).hide();
            } else {
                showAlert('Failed to restock ingredient', 'danger');
            }
        }
    });
    
    // New ingredient form submission
    document.getElementById('confirmNewIngredient').addEventListener('click', function() {
        const name = document.getElementById('newIngredientName').value;
        const quantity = parseFloat(document.getElementById('initialQuantity').value);
        const unit = document.getElementById('ingredientUnit').value;
        const threshold = parseFloat(document.getElementById('thresholdQuantity').value);
        
        if (name && quantity >= 0 && threshold >= 0) {
            const result = addNewIngredient(name, quantity, unit, threshold);
            if (result.success) {
                showAlert('New ingredient added successfully!', 'success');
                renderInventoryTable();
                updateSummaryCards();
                populateIngredientSelect();
                
                // Reset form
                document.getElementById('newIngredientForm').reset();
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('newIngredientModal')).hide();
            } else {
                showAlert(result.message, 'danger');
            }
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                localStorage.removeItem('adminToken');
                window.location.href = 'login.html';
            } else {
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout error. Please try again.');
        }
    });
    
    // Search functionality
    document.getElementById('searchButton').addEventListener('click', function() {
        const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
        filterInventoryTable(searchTerm);
    });
    
    document.getElementById('inventorySearch').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.toLowerCase();
            filterInventoryTable(searchTerm);
        }
    });
}

function filterInventoryTable(searchTerm) {
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function renderInventoryTable() {
    const inventory = loadInventoryData();
    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';
    
    let totalIngredients = 0;
    let lowStockCount = 0;
    let criticalCount = 0;
    
    for (const [id, ingredient] of Object.entries(inventory.ingredients)) {
        totalIngredients++;
        
        const status = getIngredientStatus(ingredient);
        if (status === 'low') lowStockCount++;
        if (status === 'critical') criticalCount++;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="ingredient-image me-3">
                        <i class="fas fa-${getIngredientIcon(id)}"></i>
                    </div>
                    <div>
                        <strong>${ingredient.name}</strong>
                    </div>
                </div>
            </td>
            <td>${ingredient.quantity}</td>
            <td>${ingredient.threshold}</td>
            <td><span class="badge ${getStatusBadgeClass(status)}">${getStatusText(status)}</span></td>
            <td>${ingredient.unit}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="showRestockModal('${id}')">
                    <i class="fas fa-plus"></i> Restock
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="showIngredientHistory('${id}')">
                    <i class="fas fa-history"></i> History
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    }
    
    // Update summary cards
    document.getElementById('totalIngredients').textContent = totalIngredients;
    document.getElementById('lowStockItems').textContent = lowStockCount;
    document.getElementById('criticalItems').textContent = criticalCount;
}

function renderRecipesTable() {
    const inventory = loadInventoryData();
    const tableBody = document.getElementById('recipesTableBody');
    tableBody.innerHTML = '';
    
    for (const [id, recipe] of Object.entries(inventory.recipes)) {
        // Check recipe status (if any ingredients are low)
        let recipeStatus = 'ok';
        for (const ingredientId of Object.keys(recipe.ingredients)) {
            const ingredient = inventory.ingredients[ingredientId];
            if (!ingredient || getIngredientStatus(ingredient) !== 'ok') {
                recipeStatus = 'warning';
                break;
            }
        }
        
        const statusBadge = recipeStatus === 'ok' 
            ? '<span class="badge bg-success">All stocked</span>'
            : '<span class="badge bg-warning text-dark">Check inventory</span>';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="me-3" style="width: 24px;">
                        <i class="fas fa-${getRecipeIcon(id)}"></i>
                    </div>
                    <div>
                        <strong>${recipe.name}</strong>
                    </div>
                </div>
            </td>
            <td>${Object.keys(recipe.ingredients).length} ingredients</td>
            <td>${recipe.batchSize} cupcakes</td>
            <td class="text-end">
                ${statusBadge}
                <button class="btn btn-sm btn-primary ms-2" onclick="showRecipeDetails('${id}')">
                    <i class="fas fa-eye me-1"></i> View
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    }
    
    // Initialize DataTables if available
    if ($.fn.DataTable) {
        $('#recipesTable').DataTable({
            responsive: true,
            columnDefs: [
                { orderable: false, targets: [3] }
            ]
        });
    }
}

function showRecipeDetails(recipeId) {
    const inventory = loadInventoryData();
    const recipe = inventory.recipes[recipeId];
    
    document.getElementById('recipeName').textContent = recipe.name;
    document.getElementById('recipeBatchSize').textContent = recipe.batchSize;
    
    const ingredientsTable = document.getElementById('recipeIngredientsTable');
    ingredientsTable.innerHTML = '';
    
    let hasLowStock = false;
    let missingIngredients = [];
    
    // Create a row for each ingredient in the recipe
    for (const [ingredientId, amount] of Object.entries(recipe.ingredients)) {
        const ingredient = inventory.ingredients[ingredientId];
        let status, statusClass;
        
        if (!ingredient) {
            // Ingredient not found in inventory
            status = 'Not in inventory';
            statusClass = 'badge-danger';
            missingIngredients.push(ingredientId);
            hasLowStock = true;
        } else {
            // Determine ingredient status
            const statusInfo = getIngredientStatus(ingredient);
            status = getStatusText(statusInfo);
            statusClass = getStatusBadgeClass(statusInfo);
            
            if (statusInfo !== 'ok') {
                hasLowStock = true;
            }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ingredient?.name || ingredientId}</td>
            <td>${amount}</td>
            <td>${ingredient?.unit || 'units'}</td>
            <td>${ingredient?.quantity ?? 'N/A'}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
        `;
        ingredientsTable.appendChild(row);
    }
    
    // Show warning if needed
    const warningElement = document.getElementById('recipeWarning');
    if (hasLowStock) {
        let warningMessage = 'Warning: ';
        
        if (missingIngredients.length > 0) {
            warningMessage += `Missing ingredients: ${missingIngredients.join(', ')}. `;
        }
        
        warningMessage += 'Some ingredients are low in stock or unavailable.';
        
        warningElement.style.display = 'block';
        document.getElementById('warningMessage').textContent = warningMessage;
    } else {
        warningElement.style.display = 'none';
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('viewRecipeModal'));
    modal.show();
}

function showIngredientHistory(ingredientId) {
    const inventory = loadInventoryData();
    const ingredient = inventory.ingredients[ingredientId];
    const history = inventory.restockHistory.filter(item => item.ingredientId === ingredientId);
    
    // Create and show a modal with the history
    const historyModal = new bootstrap.Modal(document.createElement('div'));
    historyModal._element.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Restock History for ${ingredient.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Quantity Added</th>
                                <th>New Total</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${history.map(item => `
                                <tr>
                                    <td>${new Date(item.date).toLocaleDateString()}</td>
                                    <td>${item.quantity} ${ingredient.unit}</td>
                                    <td>${item.newQuantity} ${ingredient.unit}</td>
                                    <td>${item.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(historyModal._element);
    historyModal.show();
}

function showRestockModal(ingredientId) {
    const select = document.getElementById('ingredientSelect');
    select.value = ingredientId;
    
    const modal = new bootstrap.Modal(document.getElementById('restockModal'));
    modal.show();
}

function updateSummaryCards() {
    const inventory = loadInventoryData();
    let totalIngredients = 0;
    let lowStockCount = 0;
    let criticalCount = 0;
    
    for (const ingredient of Object.values(inventory.ingredients)) {
        totalIngredients++;
        const status = getIngredientStatus(ingredient);
        if (status === 'low') lowStockCount++;
        if (status === 'critical') criticalCount++;
    }
    
    document.getElementById('totalIngredients').textContent = totalIngredients;
    document.getElementById('lowStockItems').textContent = lowStockCount;
    document.getElementById('criticalItems').textContent = criticalCount;
}

function checkForNotifications() {
    const inventory = loadInventoryData();
    if (inventory.lowStockNotifications && inventory.lowStockNotifications.length > 0) {
        // Show the most recent unread notification
        const unreadNotifications = inventory.lowStockNotifications.filter(notif => !notif.read);
        if (unreadNotifications.length > 0) {
            showAlert(unreadNotifications[0].message, unreadNotifications[0].type);
            
            // Mark as read
            unreadNotifications[0].read = true;
            saveInventoryData(inventory);
        }
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-inventory.html')) {
        initInventory();
        renderInventoryTable();
        renderRecipesTable();
        updateSummaryCards();
        populateIngredientSelect();
        setupEventListeners();
        checkForNotifications();
    }
    
    // Check if we're on the order confirmation page
    if (document.getElementById('orderItems')) {
        initInventory();
        
        // Get order details from URL or localStorage
        const orderDetails = getOrderDetails();
        
        // Update inventory after order confirmation
        const recipeItems = mapOrderItemsToRecipes(orderDetails.items);
        const result = updateInventoryForOrder(recipeItems);
        
        if (!result.success) {
            console.error('Inventory update failed:', result.message);
        }
    }
});

// Make functions available globally for HTML onclick attributes
window.showRestockModal = showRestockModal;
window.showRecipeDetails = showRecipeDetails;
window.showIngredientHistory = showIngredientHistory;