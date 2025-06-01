const mongoose = require('mongoose');


const orderItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: [true, 'Product ID is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    price: { type: Number, required: true, min: 0 },
    customization: {
        flavor: String,
        color: String,
        icing: String,
        icingColor: String,
        decorations: String,
        specialInstructions: String
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerType: {
        type: String,
        enum: ['registered', 'guest'],
        required: true,
        default: function() {
            return this.customerId ? 'registered' : 'guest';
        }
    },
    guestInfo: {
        name: String,
        email: String,
        phone: String
    },
    items: {
        type: [orderItemSchema],
        required: [true, 'Order items are required'],
        validate: [arrayLimit, '{PATH} must have at least one item']
    },
    deliveryInfo: {
        method: { type: String, enum: ['pickup', 'delivery'], required: true },
        address: {
            street: String,
            city: String,
            state: String,
            zip: String
        },
        deliveryDate: Date,
        deliveryTime: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    payment: {
        method: {
            type: String,
            enum: ['integrated', 'proof_upload', 'cash', 'card', 'mobile_money'],
            required: true,
            default: function() {
                return this.parent().customerType === 'registered' ? 'integrated' : 'proof_upload';
            }
        },
        amount: Number,
        status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
        transactionId: String,
        paymentDate: Date,
        proofImage: String, // URL or path to payment proof image (for guest customers)
        proofImageOriginalName: String, // Original filename of uploaded proof
        paymentProvider: String, // For integrated payments (stripe, paypal, etc.)
        paymentReference: String // Additional reference for tracking
    },
    subtotal: Number,
    tax: Number,
    deliveryFee: Number,
    total: Number,
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

function arrayLimit(val) {
    return val.length > 0;
}

// Update the updatedAt field and set customer type before saving
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();

    // Automatically set customer type based on customerId
    if (this.customerId && !this.customerType) {
        this.customerType = 'registered';
    } else if (!this.customerId && !this.customerType) {
        this.customerType = 'guest';
    }

    // Set default payment method based on customer type
    if (!this.payment.method) {
        this.payment.method = this.customerType === 'registered' ? 'integrated' : 'proof_upload';
    }

    next();
});

// Indexes for faster querying
orderSchema.index({ customer: 1 });
orderSchema.index({ neededDate: 1, neededTime: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryOption: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
