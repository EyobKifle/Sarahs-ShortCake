const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  customization: {
    flavor: String,
    color: String,
    icing: String,
    icingColor: String,
    decorations: String,
    specialInstructions: String
  },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, sparse: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', sparse: true },
  items: [cartItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } } // TTL index
});

// Update updatedAt before save
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
cartSchema.index({ userId: 1 }, { sparse: true });
cartSchema.index({ expiresAt: 1 });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
