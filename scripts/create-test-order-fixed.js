const mongoose = require('mongoose');
const Order = require('../models/Order');

async function createTestOrder() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/sarahs_shortcakes', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Create test order with order number CJP9F310
        const orderNumber = 'CJP9F310';

        // Check if order already exists
        const existingOrder = await Order.findOne({ orderNumber: orderNumber });
        if (existingOrder) {
            console.log('⚠️ Order already exists:', orderNumber);
            return;
        }

        const testOrder = new Order({
            orderNumber: orderNumber,
            customerType: 'guest',
            guestInfo: {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1234567890'
            },
            items: [
                {
                    productId: 'vanilla-cupcake',
                    quantity: 6,
                    price: 3.50,
                    customization: {
                        flavor: 'Vanilla',
                        icing: 'Vanilla Buttercream',
                        icingColor: 'Pink',
                        decorations: 'Sprinkles',
                        specialInstructions: 'Happy Birthday message'
                    }
                },
                {
                    productId: 'chocolate-cupcake',
                    quantity: 6,
                    price: 3.75,
                    customization: {
                        flavor: 'Chocolate',
                        icing: 'Chocolate Ganache',
                        icingColor: 'Brown',
                        decorations: 'Chocolate chips'
                    }
                }
            ],
            deliveryInfo: {
                method: 'pickup',
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                deliveryTime: '14:00'
            },
            payment: {
                method: 'proof_upload',
                amount: 43.50,
                status: 'pending'
            },
            subtotal: 43.50,
            tax: 3.48,
            deliveryFee: 0.00,
            total: 46.98,
            totalAmount: 46.98, // Add both fields for compatibility
            status: 'processing',
            notes: 'Test order for tracking system',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await testOrder.save();
        console.log('✅ Test order created successfully!');
        console.log('📋 Order Details:');
        console.log(`   Order Number: ${testOrder.orderNumber}`);
        console.log(`   Customer: ${testOrder.guestInfo.name}`);
        console.log(`   Email: ${testOrder.guestInfo.email}`);
        console.log(`   Total: $${(testOrder.totalAmount || testOrder.total || 0).toFixed(2)}`);
        console.log(`   Status: ${testOrder.status}`);
        console.log(`   Items: ${testOrder.items.length}`);

        console.log('\n🔍 You can now test the tracking system with order number:', orderNumber);
        console.log('🌐 Visit: http://localhost:3000/order.html');

    } catch (error) {
        console.error('❌ Error creating test order:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createTestOrder();
