const mongoose = require('mongoose');

const productFlavorSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  flavorId: { type: mongoose.Schema.Types.ObjectId, ref: 'flavor', required: true }
}, {
  timestamps: false
});

// Composite unique index to prevent duplicate pairs
productFlavorSchema.index({ productId: 1, flavorId: 1 }, { unique: true });

const ProductFlavor = mongoose.model('ProductFlavor', productFlavorSchema);

module.exports = ProductFlavor;
