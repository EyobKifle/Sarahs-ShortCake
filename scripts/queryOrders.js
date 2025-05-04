const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_shortcakes';

async function main() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const orders = await Order.find().limit(5).lean();
    console.log('Sample orders:', orders);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error querying orders:', error);
  }
}

main();
