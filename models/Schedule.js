const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true, trim: true }, // e.g., "09:00"
  endTime: { type: String, required: true, trim: true },
  maxOrders: { type: Number, required: true, min: 0 },
  bookedOrders: { type: Number, default: 0, min: 0 }
}, { _id: false });

const specialHoursSchema = new mongoose.Schema({
  opensAt: { type: String, trim: true },
  closesAt: { type: String, trim: true }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  availableTimeSlots: [timeSlotSchema],
  isHoliday: { type: Boolean, default: false },
  specialHours: specialHoursSchema,
  notes: { type: String, trim: true }
});

// Indexes
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ isHoliday: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
