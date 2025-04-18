const InventoryItem = require('../models/InventoryItem');

// Get all inventory items
exports.getAllInventoryItems = async (req, res) => {
    try {
        const { category, stockStatus, search } = req.query;
        
        let query = {};
        
        // Category filter
        if (category && category !== 'all') {
            query.category = category;
        }
        
        // Stock status filter
        if (stockStatus && stockStatus !== 'all') {
            if (stockStatus === 'low') {
                query.$expr = { $lt: ['$currentStock', '$reorderLevel'] };
            } else if (stockStatus === 'out') {
                query.currentStock = 0;
            }
        }
        
        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }
        
        const items = await InventoryItem.find(query).sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory items'
        });
    }
};

// Create a new inventory item
exports.createInventoryItem = async (req, res) => {
    try {
        const { name, category, currentStock, unit, reorderLevel } = req.body;
        
        const item = new InventoryItem({
            name,
            category,
            currentStock,
            unit,
            reorderLevel
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

// Update an inventory item
exports.updateInventoryItem = async (req, res) => {
    try {
        const { name, category, currentStock, unit, reorderLevel } = req.body;
        
        const item = await InventoryItem.findByIdAndUpdate(
            req.params.id,
            { name, category, currentStock, unit, reorderLevel },
            { new: true }
        );
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: item,
            message: 'Inventory item updated successfully'
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating inventory item'
        });
    }
};

// Record inventory restock
exports.recordInventoryRestock = async (req, res) => {
    try {
        const { amount } = req.body;
        
        const item = await InventoryItem.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        
        item.currentStock += amount;
        await item.save();
        
        res.status(200).json({
            success: true,
            data: item,
            message: 'Inventory restock recorded successfully'
        });
    } catch (error) {
        console.error('Error recording inventory restock:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording inventory restock'
        });
    }
};

// Generate inventory usage report
exports.generateInventoryUsageReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // In a real implementation, this would query order data
        // and calculate ingredient usage based on recipes
        
        // For now, return a mock report
        const report = {
            startDate,
            endDate,
            items: [
                {
                    name: 'All-Purpose Flour',
                    unit: 'lbs',
                    startingStock: 25,
                    endingStock: 12.5,
                    usage: 12.5
                },
                {
                    name: 'Granulated Sugar',
                    unit: 'lbs',
                    startingStock: 15,
                    endingStock: 8.2,
                    usage: 6.8
                }
                // More items would be here
            ]
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