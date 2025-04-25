const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  polygon: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of coordinate pairs
      required: true
    }
  },
  deliveryFee: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, required: true, min: 0 },
  estimatedDeliveryTime: { type: Number, required: true, min: 0 }, // in minutes
  isActive: { type: Boolean, default: true }
});

// 2dsphere index for geospatial queries
deliveryZoneSchema.index({ polygon: '2dsphere' });

const DeliveryZone = mongoose.model('DeliveryZone', deliveryZoneSchema);

module.exports = DeliveryZone;
