const mongoose = require('mongoose');
const Order = require('../models/Order');

async function checkTestOrder() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/sarahs_shortcakes', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Check if order CJP9F310 exists
        const orderNumber = 'CJP9F310';
        console.log(`🔍 Searching for order: ${orderNumber}`);

        const order = await Order.findOne({ orderNumber: orderNumber });

        if (order) {
            console.log('✅ Order found!');
            console.log('📋 Order Details:');
            console.log(`   Order Number: ${order.orderNumber}`);
            console.log(`   Customer Type: ${order.customerType}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Total: $${(order.total || order.totalAmount || 0).toFixed(2)}`);
            console.log(`   Items: ${order.items ? order.items.length : 0}`);
            console.log(`   Created: ${order.createdAt}`);

            if (order.guestInfo) {
                console.log(`   Guest Name: ${order.guestInfo.name}`);
                console.log(`   Guest Email: ${order.guestInfo.email}`);
            }

            console.log('\n📄 Full Order Object:');
            console.log(JSON.stringify(order.toObject(), null, 2));
        } else {
            console.log('❌ Order not found!');

            // Check all orders to see what's in the database
            console.log('\n🔍 Checking all orders in database...');
            const allOrders = await Order.find({}).limit(10);
            console.log(`Found ${allOrders.length} orders total`);

            allOrders.forEach((order, index) => {
                console.log(`${index + 1}. Order Number: ${order.orderNumber}, Status: ${order.status}, Created: ${order.createdAt}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

checkTestOrder();
