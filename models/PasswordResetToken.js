const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    token: {
        type: String,
        required: false, // Made optional for OTP-only flow
        unique: true,
        sparse: true // Allow null values to be non-unique
    },
    tokenHash: {
        type: String,
        required: false // Made optional for OTP-only flow
    },
    otp: {
        type: String,
        required: false // 6-digit OTP code
    },
    otpHash: {
        type: String,
        required: false // Hashed version of OTP
    },
    type: {
        type: String,
        enum: ['token', 'otp'],
        default: 'otp' // Default to OTP-based reset
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes for OTP, 1 hour for token
    },
    used: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Maximum 3 attempts for OTP
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
});

// Index for automatic cleanup of expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate secure token
passwordResetTokenSchema.statics.generateToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
};

// Static method to generate OTP
passwordResetTokenSchema.statics.generateOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    return { otp, otpHash };
};

// Instance method to verify token
passwordResetTokenSchema.methods.verifyToken = function(candidateToken) {
    const candidateHash = crypto.createHash('sha256').update(candidateToken).digest('hex');
    return this.tokenHash === candidateHash;
};

// Instance method to verify OTP
passwordResetTokenSchema.methods.verifyOTP = function(candidateOTP) {
    if (this.attempts >= 3) {
        return false; // Too many attempts
    }

    const candidateHash = crypto.createHash('sha256').update(candidateOTP).digest('hex');
    const isValid = this.otpHash === candidateHash;

    if (!isValid) {
        this.attempts += 1;
    }

    return isValid;
};

// Instance method to check if token/OTP is valid
passwordResetTokenSchema.methods.isValid = function() {
    return !this.used && this.expiresAt > new Date() && this.attempts < 3;
};

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

module.exports = PasswordResetToken;
