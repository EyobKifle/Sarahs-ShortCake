const mongoose = require('mongoose');

const inventoryItemProductSchema = new mongoose.Schema({
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }
}, {
  timestamps: false
});

// Composite unique index to prevent duplicate pairs
inventoryItemProductSchema.index({ inventoryItemId: 1, productId: 1 }, { unique: true });

const InventoryItemProduct = mongoose.model('InventoryItemProduct', inventoryItemProductSchema);

module.exports = InventoryItemProduct;
