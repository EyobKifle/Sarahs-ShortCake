const InventoryItem = require('../models/InventoryItem');

// Get all inventory items
exports.getAllInventoryItems = async (req, res) => {
    try {
        console.log('📦 Getting all inventory items...');
        console.log('🔍 Query params:', req.query);
        console.log('👤 User:', req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'No user');

        const { category, stockStatus, search } = req.query;

        let query = {};

        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }

        // Stock status filter
        if (stockStatus && stockStatus !== 'all') {
            if (stockStatus === 'low') {
                query.$expr = { $lt: ['$quantity', '$threshold'] };
            } else if (stockStatus === 'out') {
                query.quantity = 0;
            }
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('🔍 MongoDB query:', JSON.stringify(query, null, 2));

        const items = await InventoryItem.find(query).sort({ name: 1 });

        console.log(`📊 Found ${items.length} inventory items`);
        if (items.length > 0) {
            console.log('📋 First item:', {
                id: items[0]._id,
                name: items[0].name,
                quantity: items[0].quantity,
                unit: items[0].unit
            });
        }

        res.status(200).json({
            success: true,
            data: items,
            count: items.length
        });
    } catch (error) {
        console.error('❌ Error fetching inventory items:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory items',
            error: error.message
        });
    }
};

// Create a new inventory item
exports.createInventoryItem = async (req, res) => {
    try {
        const { name, category, description, quantity, unit, threshold, costPerUnit, location, supplier } = req.body;

        // Validate required fields
        if (!name || !category || quantity === undefined || !unit || threshold === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, quantity, unit, and threshold are required'
            });
        }

        const item = new InventoryItem({
            name,
            category,
            description: description || '',
            quantity: parseFloat(quantity),
            unit,
            threshold: parseFloat(threshold),
            costPerUnit: parseFloat(costPerUnit) || 0,
            location: location || '',
            supplier: supplier || ''
        });

        await item.save();

        res.status(201).json({
            success: true,
            data: item,
            message: 'Inventory item created successfully'
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating inventory item'
        });
    }
};

// Get single inventory item by ID
exports.getInventoryItemById = async (req, res) => {
    try {
        console.log('🔍 Getting inventory item by ID:', req.params.id);
        console.log('👤 User:', req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'No user');

        const item = await InventoryItem.findById(req.params.id);

        console.log('📦 Found item:', item ? `${item.name} (${item._id})` : 'Not found');

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('❌ Error fetching inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory item',
            error: error.message
        });
    }
};

// Update an inventory item with history tracking
exports.updateInventoryItem = async (req, res) => {
    try {
        const { name, category, description, quantity, unit, threshold, costPerUnit, location, supplier, notes } = req.body;

        const item = await InventoryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Store previous values for history
        const previousValues = {
            name: item.name,
            category: item.category,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            threshold: item.threshold,
            costPerUnit: item.costPerUnit,
            location: item.location,
            supplier: item.supplier
        };

        // Track changes
        const changes = [];

        // Update fields and track changes
        if (name !== undefined && name !== item.name) {
            changes.push(`Name: "${item.name}" → "${name}"`);
            item.name = name;
        }
        if (category !== undefined && category !== item.category) {
            changes.push(`Category: "${item.category}" → "${category}"`);
            item.category = category;
        }
        if (description !== undefined && description !== item.description) {
            changes.push(`Description: "${item.description}" → "${description}"`);
            item.description = description;
        }
        if (quantity !== undefined && parseFloat(quantity) !== item.quantity) {
            const oldQty = item.quantity;
            const newQty = parseFloat(quantity);
            changes.push(`Quantity: ${oldQty} → ${newQty} ${item.unit}`);
            item.quantity = newQty;
        }
        if (unit !== undefined && unit !== item.unit) {
            changes.push(`Unit: "${item.unit}" → "${unit}"`);
            item.unit = unit;
        }
        if (threshold !== undefined && parseFloat(threshold) !== item.threshold) {
            changes.push(`Threshold: ${item.threshold} → ${parseFloat(threshold)}`);
            item.threshold = parseFloat(threshold);
        }
        if (costPerUnit !== undefined && parseFloat(costPerUnit) !== item.costPerUnit) {
            changes.push(`Cost per unit: $${item.costPerUnit} → $${parseFloat(costPerUnit)}`);
            item.costPerUnit = parseFloat(costPerUnit);
        }
        if (location !== undefined && location !== item.location) {
            changes.push(`Location: "${item.location}" → "${location}"`);
            item.location = location;
        }
        if (supplier !== undefined && supplier !== item.supplier) {
            changes.push(`Supplier: "${item.supplier}" → "${supplier}"`);
            item.supplier = supplier;
        }

        item.updatedAt = Date.now();

        // Add to history if there were changes
        if (changes.length > 0) {
            if (!item.history) item.history = [];
            item.history.push({
                action: 'update',
                previousQuantity: previousValues.quantity,
                newQuantity: item.quantity,
                changeAmount: item.quantity - previousValues.quantity,
                date: new Date(),
                notes: notes || `Updated: ${changes.join(', ')}`,
                performedBy: req.user ? req.user._id : null,
                changes: changes
            });
        }

        await item.save();

        // Check for low stock after update
        try {
            await this.checkAndSendLowStockAlerts([item]);
        } catch (alertError) {
            console.error('Error checking low stock alerts:', alertError);
            // Don't fail the update if alert fails
        }

        res.status(200).json({
            success: true,
            data: item,
            message: 'Inventory item updated successfully',
            changes: changes
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating inventory item'
        });
    }
};

// Delete an inventory item with safety checks
exports.deleteInventoryItem = async (req, res) => {
    try {
        const { reason } = req.body;

        const item = await InventoryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Check if item is used in any recipes
        const Product = require('../models/Product');
        const productsUsingItem = await Product.find({
            'recipe.ingredient': { $regex: new RegExp(item.name, 'i') }
        });

        if (productsUsingItem.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete ${item.name}. It is used in ${productsUsingItem.length} product recipe(s): ${productsUsingItem.map(p => p.name).join(', ')}`,
                usedInProducts: productsUsingItem.map(p => ({ id: p._id, name: p.name }))
            });
        }

        // Store item data for history/audit
        const deletedItemData = {
            _id: item._id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            threshold: item.threshold,
            costPerUnit: item.costPerUnit,
            location: item.location,
            supplier: item.supplier,
            deletedAt: new Date(),
            deletedBy: req.user ? req.user._id : null,
            reason: reason || 'No reason provided'
        };

        // Add deletion record to history before deleting
        if (!item.history) item.history = [];
        item.history.push({
            action: 'delete',
            previousQuantity: item.quantity,
            newQuantity: 0,
            changeAmount: -item.quantity,
            date: new Date(),
            notes: `Item deleted. Reason: ${reason || 'No reason provided'}`,
            performedBy: req.user ? req.user._id : null,
            finalAction: true
        });

        await item.save();

        // Now delete the item
        await InventoryItem.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully',
            deletedItem: deletedItemData
        });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting inventory item'
        });
    }
};

// Record inventory restock
exports.recordInventoryRestock = async (req, res) => {
    try {
        const { amount, notes } = req.body;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required for restocking'
            });
        }

        const item = await InventoryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        const restockAmount = parseFloat(amount);
        const previousQuantity = item.quantity || 0;
        item.quantity = previousQuantity + restockAmount;
        item.lastRestocked = new Date();

        // Add history entry
        item.history.push({
            action: 'restock',
            previousQuantity: previousQuantity,
            newQuantity: item.quantity,
            changeAmount: restockAmount,
            date: new Date(),
            notes: notes || `Restocked ${restockAmount} ${item.unit}`,
            performedBy: req.user ? req.user._id : null
        });

        await item.save();

        res.status(200).json({
            success: true,
            data: item,
            message: `Successfully added ${restockAmount} ${item.unit || 'units'} to ${item.name}`
        });
    } catch (error) {
        console.error('Error recording inventory restock:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording inventory restock'
        });
    }
};

// Update inventory when order is confirmed
exports.updateInventoryForOrder = async (orderItems) => {
    try {
        console.log('🔄 Updating inventory for order items:', orderItems);
        const updateLog = [];

        for (const item of orderItems) {
            // Find the product to get its recipe/ingredients
            const Product = require('../models/Product');
            const product = await Product.findById(item.productId || item.product);

            if (!product) {
                console.log(`❌ Product not found for ID: ${item.productId || item.product}, skipping inventory update`);
                updateLog.push({
                    productId: item.productId || item.product,
                    error: 'Product not found'
                });
                continue;
            }

            console.log(`📦 Processing product: ${product.name} (quantity: ${item.quantity})`);

            // Check if product has recipe/ingredients
            if (!product.recipe || !Array.isArray(product.recipe) || product.recipe.length === 0) {
                console.log(`⚠️  No recipe found for product ${product.name}, skipping inventory update`);
                updateLog.push({
                    productName: product.name,
                    error: 'No recipe defined'
                });
                continue;
            }

            // Update inventory for each ingredient in the recipe
            for (const ingredient of product.recipe) {
                const ingredientName = ingredient.ingredient || ingredient.name;
                if (!ingredientName) continue;

                // Find inventory item by name (case-insensitive)
                const inventoryItem = await InventoryItem.findOne({
                    name: { $regex: new RegExp(ingredientName.trim(), 'i') }
                });

                if (inventoryItem) {
                    const recipeQuantity = parseFloat(ingredient.quantity) || 1;
                    const orderQuantity = parseInt(item.quantity) || 1;
                    const usedQuantity = recipeQuantity * orderQuantity;
                    const currentQuantity = parseFloat(inventoryItem.quantity) || 0;
                    const newQuantity = Math.max(0, currentQuantity - usedQuantity);

                    await InventoryItem.findByIdAndUpdate(inventoryItem._id, {
                        quantity: newQuantity,
                        lastUsed: new Date(),
                        $inc: { usageCount: orderQuantity }
                    });

                    updateLog.push({
                        ingredient: inventoryItem.name,
                        previousQuantity: currentQuantity,
                        usedQuantity: usedQuantity,
                        newQuantity: newQuantity,
                        unit: inventoryItem.unit
                    });

                    console.log(`✅ Updated ${inventoryItem.name}: ${currentQuantity} -> ${newQuantity} ${inventoryItem.unit} (used: ${usedQuantity})`);

                    // Check for low stock warning and send alert
                    if (newQuantity <= inventoryItem.threshold) {
                        console.log(`⚠️  LOW STOCK WARNING: ${inventoryItem.name} is now at ${newQuantity} ${inventoryItem.unit} (threshold: ${inventoryItem.threshold})`);

                        // Send low stock alert
                        try {
                            const emailService = require('../services/emailService');
                            await emailService.sendLowStockAlert([{
                                name: inventoryItem.name,
                                quantity: newQuantity,
                                threshold: inventoryItem.threshold,
                                unit: inventoryItem.unit,
                                category: inventoryItem.category
                            }]);
                            console.log('✅ Low stock alert sent for:', inventoryItem.name);
                        } catch (alertError) {
                            console.error('⚠️ Error sending low stock alert:', alertError);
                        }
                    }
                } else {
                    console.log(`❌ Inventory item not found for ingredient: ${ingredientName}`);
                    updateLog.push({
                        ingredient: ingredientName,
                        error: 'Not found in inventory'
                    });
                }
            }
        }

        return { success: true, updateLog };
    } catch (error) {
        console.error('Error updating inventory for order:', error);
        return { success: false, error: error.message };
    }
};

// Check and send low stock alerts
exports.checkAndSendLowStockAlerts = async (items = null) => {
    try {
        let itemsToCheck = items;

        // If no specific items provided, check all inventory items
        if (!itemsToCheck) {
            itemsToCheck = await InventoryItem.find();
        }

        const lowStockItems = itemsToCheck.filter(item =>
            item.quantity <= item.threshold && item.quantity > 0
        );

        if (lowStockItems.length > 0) {
            console.log(`⚠️ Found ${lowStockItems.length} low stock items:`, lowStockItems.map(item => item.name));

            const emailService = require('../services/emailService');
            await emailService.sendLowStockAlert(lowStockItems);

            console.log('✅ Low stock alert emails sent successfully');
            return { success: true, alertsSent: lowStockItems.length };
        } else {
            console.log('✅ No low stock items found');
            return { success: true, alertsSent: 0 };
        }
    } catch (error) {
        console.error('❌ Error checking and sending low stock alerts:', error);
        return { success: false, error: error.message };
    }
};

// Get menu items with inventory status
exports.getMenuWithInventoryStatus = async (req, res) => {
    try {
        const Product = require('../models/Product');
        const products = await Product.find({ active: true });
        const inventory = await InventoryItem.find();

        const menuWithStatus = await Promise.all(products.map(async (product) => {
            let canMake = true;
            let missingIngredients = [];
            let lowStockIngredients = [];

            if (product.recipe && Array.isArray(product.recipe)) {
                for (const ingredient of product.recipe) {
                    const ingredientName = ingredient.ingredient || ingredient.name;
                    if (!ingredientName) continue;

                    const inventoryItem = inventory.find(item =>
                        item.name.toLowerCase().includes(ingredientName.toLowerCase())
                    );

                    if (!inventoryItem) {
                        missingIngredients.push(ingredientName);
                        canMake = false;
                    } else {
                        const requiredQuantity = parseFloat(ingredient.quantity) || 1;
                        if (inventoryItem.quantity < requiredQuantity) {
                            canMake = false;
                            missingIngredients.push(`${ingredientName} (need ${requiredQuantity}, have ${inventoryItem.quantity})`);
                        } else if (inventoryItem.quantity <= inventoryItem.threshold) {
                            lowStockIngredients.push(ingredientName);
                        }
                    }
                }
            }

            return {
                ...product.toObject(),
                inventoryStatus: {
                    canMake,
                    missingIngredients,
                    lowStockIngredients
                }
            };
        }));

        res.status(200).json({
            success: true,
            data: menuWithStatus
        });
    } catch (error) {
        console.error('Error getting menu with inventory status:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting menu with inventory status'
        });
    }
};

// Generate inventory usage report
exports.generateInventoryUsageReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const items = await InventoryItem.find();
        const lowStockItems = items.filter(item => item.quantity <= item.threshold);
        const outOfStockItems = items.filter(item => item.quantity === 0);

        const report = {
            startDate,
            endDate,
            totalItems: items.length,
            lowStockItems: lowStockItems.length,
            outOfStockItems: outOfStockItems.length,
            totalValue: items.reduce((sum, item) => sum + (item.quantity * (item.costPerUnit || 0)), 0),
            categories: [...new Set(items.map(item => item.category))],
            items: items.map(item => ({
                _id: item._id,
                name: item.name,
                category: item.category,
                currentStock: item.quantity,
                threshold: item.threshold,
                unit: item.unit,
                costPerUnit: item.costPerUnit || 0,
                totalValue: item.quantity * (item.costPerUnit || 0),
                status: item.quantity === 0 ? 'Out of Stock' :
                        item.quantity <= item.threshold ? 'Low Stock' : 'In Stock',
                lastUsed: item.lastUsed,
                lastRestocked: item.lastRestocked
            }))
        };

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating inventory usage report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating inventory usage report'
        });
    }
};

// Get inventory item history
exports.getInventoryItemHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const item = await InventoryItem.findById(id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Get history from the item's history array if it exists
        const history = item.history || [];

        // Sort by date descending
        const sortedHistory = history.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedHistory = sortedHistory.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            data: {
                item: {
                    _id: item._id,
                    name: item.name,
                    category: item.category,
                    currentQuantity: item.quantity,
                    unit: item.unit
                },
                history: paginatedHistory,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(history.length / limit),
                    totalRecords: history.length,
                    hasNext: endIndex < history.length,
                    hasPrev: startIndex > 0
                }
            }
        });
    } catch (error) {
        console.error('Error getting inventory item history:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting inventory item history'
        });
    }
};

// Enhanced restock function with history tracking
exports.recordInventoryRestock = async (req, res) => {
    try {
        const { amount, notes, supplier, costPerUnit } = req.body;

        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required for restocking'
            });
        }

        const item = await InventoryItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        const restockAmount = parseFloat(amount);
        const previousQuantity = item.quantity || 0;

        // Update item
        item.quantity = previousQuantity + restockAmount;
        item.lastRestocked = new Date();

        if (supplier) item.supplier = supplier;
        if (costPerUnit) item.costPerUnit = parseFloat(costPerUnit);

        // Add to history
        if (!item.history) item.history = [];
        item.history.push({
            action: 'restock',
            previousQuantity,
            newQuantity: item.quantity,
            changeAmount: restockAmount,
            date: new Date(),
            notes: notes || `Restocked ${restockAmount} ${item.unit}`,
            performedBy: req.user ? req.user._id : null,
            supplier: supplier || item.supplier,
            costPerUnit: costPerUnit || item.costPerUnit
        });

        await item.save();

        res.status(200).json({
            success: true,
            data: item,
            message: `Successfully added ${restockAmount} ${item.unit || 'units'} to ${item.name}`
        });
    } catch (error) {
        console.error('Error restocking inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error restocking inventory item'
        });
    }
};

// Get restock history for an inventory item
exports.getInventoryRestockHistory = async (req, res) => {
    try {
        const itemId = req.params.id;
        // Assuming restock history is stored in a separate collection or embedded in InventoryItem
        // For this example, let's assume it's embedded as an array in InventoryItem document

        const item = await InventoryItem.findById(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Assuming item.restockHistory is an array of restock records
        const restockHistory = item.restockHistory || [];

        res.status(200).json({
            success: true,
            data: restockHistory
        });
    } catch (error) {
        console.error('Error fetching restock history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching restock history'
        });
    }
};
