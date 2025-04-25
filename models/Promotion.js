const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed', 'free-shipping'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  maxUses: { type: Number, default: 0, min: 0 },
  currentUses: { type: Number, default: 0, min: 0 },
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
promotionSchema.index({ code: 1 });
promotionSchema.index({ validFrom: 1 });
promotionSchema.index({ validUntil: 1 });
promotionSchema.index({ isActive: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
