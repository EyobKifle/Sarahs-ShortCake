const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Inventory item name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true
    },
    threshold: {
        type: Number,
        default: 0,
        min: [0, 'Threshold cannot be negative']
    },
    lastRestocked: {
        type: Date
    },
    supplier: {
        type: String,
        trim: true
    },
    costPerUnit: {
        type: Number,
        min: 0
    },
    usedInRecipes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
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
    next();
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = InventoryItem;
