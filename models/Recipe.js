const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  ingredients: [ingredientSchema],
  batchSize: { type: Number, required: true, min: 1 },
  preparationTime: { type: Number, required: true, min: 0 }, // in minutes
  instructions: { type: String, trim: true },
  relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt before save
recipeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
