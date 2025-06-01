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
    location: {
        type: String,
        trim: true
    },
    lastUsed: {
        type: Date
    },
    usageCount: {
        type: Number,
        default: 0
    },
    history: [{
        action: {
            type: String,
            enum: ['create', 'update', 'restock', 'use', 'delete', 'deduct'],
            required: true
        },
        previousQuantity: {
            type: Number,
            default: 0
        },
        newQuantity: {
            type: Number,
            default: 0
        },
        changeAmount: {
            type: Number,
            default: 0
        },
        date: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            trim: true
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        supplier: {
            type: String,
            trim: true
        },
        costPerUnit: {
            type: Number
        },
        changes: [{
            type: String
        }],
        finalAction: {
            type: Boolean,
            default: false
        }
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
