const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
        unique: true
    },
    sku: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Flour & Dry Ingredients',
            'Dairy & Eggs',
            'Flavorings & Extracts',
            'Decorations',
            'Packaging',
            'Other'
        ]
    },
    currentStock: {
        type: Number,
        required: [true, 'Current stock is required'],
        min: [0, 'Current stock cannot be negative']
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        enum: ['lbs', 'oz', 'g', 'kg', 'each', 'dozen', 'cup', 'tsp', 'tbsp', 'ml', 'l']
    },
    reorderLevel: {
        type: Number,
        required: [true, 'Reorder level is required'],
        min: [0, 'Reorder level cannot be negative']
    },
    supplier: {
        name: String,
        contact: String,
        phone: String,
        email: String
    },
    lastRestocked: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
inventoryItemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Generate SKU if not provided
    if (!this.sku) {
        const categoryPrefix = {
            'Flour & Dry Ingredients': 'FD',
            'Dairy & Eggs': 'DE',
            'Flavorings & Extracts': 'FE',
            'Decorations': 'DC',
            'Packaging': 'PK',
            'Other': 'OT'
        };
        
        const randomNum = Math.floor(100 + Math.random() * 900);
        this.sku = `${categoryPrefix[this.category]}-${randomNum}`;
    }
    
    next();
});

// Text index for searching
inventoryItemSchema.index({ name: 'text', sku: 'text' });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = InventoryItem;