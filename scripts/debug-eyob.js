const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

async function debugEyob() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/sarahs_shortcakes');
        console.log('✅ Connected to MongoDB');

        // Check database stats
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('📊 Available collections:', collections.map(c => c.name));

        // Count documents in each collection
        for (const collection of collections) {
            const count = await db.collection(collection.name).countDocuments();
            console.log(`   ${collection.name}: ${count} documents`);
        }

        // Search for Eyob in Customer model
        console.log('\n🔍 Searching for Eyob in Customer model...');
        const eyobCustomer = await Customer.findOne({
            $or: [
                { firstName: /eyob/i },
                { lastName: /kifle/i },
                { email: /eyob/i }
            ]
        });

        if (eyobCustomer) {
            console.log('✅ Found Eyob in Customer model:');
            console.log('   ID:', eyobCustomer._id);
            console.log('   Name:', eyobCustomer.firstName, eyobCustomer.lastName);
            console.log('   Email:', eyobCustomer.email);
            console.log('   Password exists:', !!eyobCustomer.password);
            console.log('   isGuest:', eyobCustomer.isGuest);
            console.log('   Created:', eyobCustomer.createdAt);
        } else {
            console.log('❌ Eyob NOT found in Customer model');
        }

        // Search for Eyob in Orders
        console.log('\n🔍 Searching for Eyob in Orders...');
        const eyobOrders = await Order.find({
            $or: [
                { 'guestInfo.firstName': /eyob/i },
                { 'guestInfo.lastName': /kifle/i },
                { 'guestInfo.email': /eyob/i },
                { 'customerInfo.firstName': /eyob/i },
                { 'customerInfo.lastName': /kifle/i },
                { 'customerInfo.email': /eyob/i }
            ]
        }).limit(5);

        console.log(`📦 Found ${eyobOrders.length} orders for Eyob:`);
        eyobOrders.forEach((order, index) => {
            console.log(`\n   Order ${index + 1}:`);
            console.log('   ID:', order._id);
            console.log('   Customer ID:', order.customerId);
            console.log('   Guest Info:', order.guestInfo);
            console.log('   Customer Info:', order.customerInfo);
            console.log('   Status:', order.status);
            console.log('   Created:', order.createdAt);
        });

        // Check all customers in Customer model
        console.log('\n📋 All customers in Customer model:');
        const allCustomers = await Customer.find({}).select('firstName lastName email isGuest createdAt');
        allCustomers.forEach((customer, index) => {
            console.log(`   ${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.email}) - Guest: ${customer.isGuest}`);
        });

        // Check orders without customerId
        console.log('\n📦 Orders without customerId (potential guest orders):');
        const guestOrders = await Order.find({
            $or: [
                { customerId: { $exists: false } },
                { customerId: null }
            ]
        }).select('guestInfo customerInfo status createdAt').limit(10);

        guestOrders.forEach((order, index) => {
            const guestName = order.guestInfo ?
                `${order.guestInfo.firstName} ${order.guestInfo.lastName}` :
                'No guest info';
            const customerName = order.customerInfo ?
                `${order.customerInfo.firstName} ${order.customerInfo.lastName}` :
                'No customer info';
            console.log(`   ${index + 1}. Guest: ${guestName}, Customer: ${customerName}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

debugEyob();
