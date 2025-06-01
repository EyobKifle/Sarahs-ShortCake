const mongoose = require('mongoose');

const customizationOptionsSchema = new mongoose.Schema({
  colors: [String],
  icings: [String],
  decorations: [String]
}, { _id: false });

const recipeIngredientSchema = new mongoose.Schema({
  ingredient: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, enum: ['cupcake', 'cake', 'custom'], required: true },
  flavors: [String],
  basePrice: { type: Number, min: 0 },
  imagePath: { type: String, trim: true },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  customizationOptions: customizationOptionsSchema,
  recipe: [recipeIngredientSchema] // Recipe with ingredients and quantities
});

// Update updatedAt before save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
