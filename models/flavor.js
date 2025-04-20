const mongoose = require('mongoose');

const flavorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Flavor name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Flavor type is required'],
        enum: ['cupcake', 'icing']
    },
    canHaveColor: {
        type: Boolean,
        default: false
    },
    isActive: {
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

// Compound unique index on name and type
flavorSchema.index({ name: 1, type: 1 }, { unique: true });

const Flavor = mongoose.model('Flavor', flavorSchema);

module.exports = Flavor;
