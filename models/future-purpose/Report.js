const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: { type: String, enum: ['sales', 'inventory', 'delivery', 'customer'], required: true },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  generatedAt: { type: Date, default: Date.now },
  filters: { type: mongoose.Schema.Types.Mixed }
});

// Indexes
reportSchema.index({ type: 1 });
reportSchema.index({ generatedAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
