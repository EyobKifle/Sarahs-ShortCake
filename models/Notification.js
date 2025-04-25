const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { 
    type: String, 
    enum: ['low-stock', 'order-update', 'system', 'promotional'], 
    required: true 
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  relatedEntity: {
    type: { type: String, trim: true },
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  priority: { type: Number, default: 1, min: 1, max: 5 }
});

// Indexes
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ priority: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
