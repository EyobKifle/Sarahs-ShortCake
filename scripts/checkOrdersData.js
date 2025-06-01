require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function checkOrdersData() {
  try {
    // Use MONGODB_URI from .env
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_shortcakes';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    const ordersMissingDeliveryInfo = await Order.find({
      $or: [
        { deliveryInfo: { $exists: false } },
        { 'deliveryInfo.deliveryDate': { $exists: false } },
        { 'deliveryInfo.deliveryTime': { $exists: false } }
      ]
    });

    const ordersMissingStatus = await Order.find({
      status: { $exists: false }
    });

    console.log(`Orders missing deliveryInfo or its fields: ${ordersMissingDeliveryInfo.length}`);
    ordersMissingDeliveryInfo.forEach(order => {
      console.log(`Order ID: ${order._id}, deliveryInfo: ${JSON.stringify(order.deliveryInfo)}`);
    });

    console.log(`Orders missing status: ${ordersMissingStatus.length}`);
    ordersMissingStatus.forEach(order => {
      console.log(`Order ID: ${order._id}, status: ${order.status}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error checking orders data:', error);
  }
}

checkOrdersData();
