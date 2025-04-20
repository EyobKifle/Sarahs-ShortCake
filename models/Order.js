const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    cakeFlavor: {
        type: String,
        required: [true, 'Cake flavor is required'],
        enum: [
            'Vanilla', 'French Vanilla', 'Chocolate', 'White Chocolate', 
            'Double Chocolate', 'S\'mores', 'Strawberry', 'Peanut Butter',
            'Pumpkin Spice', 'Blueberry', 'Apple Cinnamon', 'Cookies and Cream',
            'Champagne', 'Chocolate Chip Cheesecake', 'Mississippi Mud', 
            'Red Velvet', 'Coconut'
        ]
    },
    cakeColor: {
        type: String,
        enum: ['N/A', 'Blue', 'Purple', 'Green', 'Red', 'Orange', 'Yellow'],
        default: 'N/A'
    },
    icingFlavor: {
        type: String,
        required: [true, 'Icing flavor is required'],
        enum: [
            'Vanilla', 'Butter Cream', 'Lemon', 'Cream Cheese', 'Cookie Crumbs',
            'Strawberry', 'Peanut Butter', 'Oreo', 'Champagne', 'Mint Chocolate',
            'German Chocolate', 'Espresso', 'Pink Lemonade', 'Maple Bacon',
            'Dark Chocolate', 'Milk Chocolate', 'Coconut Pecan'
        ]
    },
    icingColor: {
        type: String,
        enum: ['N/A', 'Blue', 'Purple', 'Green', 'Red', 'Orange', 'Yellow'],
        default: 'N/A'
    },
    decoration: {
        type: String,
        trim: true
    }
});

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    guestInfo: {
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        streetAddress: { type: String, trim: true },
        city: { type: String, trim: true }
    },
    items: [orderItemSchema],
    deliveryOption: {
        type: String,
        required: [true, 'Delivery option is required'],
        enum: ['pickup', 'delivery']
    },
    neededDate: {
        type: Date,
        required: [true, 'Needed date is required']
    },
    neededTime: {
        type: String,
        required: [true, 'Needed time is required']
    },
    notes: {
        type: String,
        trim: true
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['pending', 'processing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deliveryLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            default: undefined
        },
        address: {
            type: String,
            trim: true
        }
    },
    estimatedDistance: {
        type: Number,
        default: 0
    },
    estimatedTime: {
        type: Number,
        default: 0
    },
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
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes for faster querying
orderSchema.index({ customer: 1 });
orderSchema.index({ neededDate: 1, neededTime: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryOption: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;