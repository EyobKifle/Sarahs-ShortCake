const mongoose = require('mongoose');

const userAddressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  zip: { type: String, trim: true }
}, {
  timestamps: true
});

const UserAddress = mongoose.model('UserAddress', userAddressSchema);

module.exports = UserAddress;
