const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    paymentMethod: {
        type: String,
        required: [true, 'Payment method is required'],
        enum: ['credit-card', 'telebirr', 'cbe', 'cash-on-delivery']
    },
    transactionDetails: {
        transactionId: String,
        phoneNumber: String,
        accountNumber: String,
        approvalCode: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    processedAt: {
        type: Date
    },
    failureReason: {
        type: String,
        trim: true
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
paymentTransactionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

module.exports = PaymentTransaction;
