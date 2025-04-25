const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, trim: true }, // e.g., "order.create", "inventory.update"
  entityType: { type: String, required: true, trim: true }, // e.g., "Order", "Product"
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  changes: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true },
  timestamp: { type: Date, default: Date.now }
});

// Indexes
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
