const mongoose = require('mongoose');

const contentManagementSchema = new mongoose.Schema({
  page: { type: String, required: true, trim: true }, // e.g., "home", "about", "faq"
  section: { type: String, required: true, trim: true }, // e.g., "hero", "testimonials"
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  publishedAt: { type: Date },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt before save
contentManagementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
contentManagementSchema.index({ page: 1 });
contentManagementSchema.index({ section: 1 });
contentManagementSchema.index({ isActive: 1 });

const ContentManagement = mongoose.model('ContentManagement', contentManagementSchema);

module.exports = ContentManagement;
