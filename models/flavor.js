const mongoose = require('mongoose');

const flavorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Flavor name is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isAvailable: {
        type: Boolean,
        default: true
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
flavorSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Flavor = mongoose.model('Flavor', flavorSchema);

module.exports = Flavor;
