/**
 * Create a test order for tracking system testing
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
require('dotenv').config();

// Generate EDB5A185 format order number
function generateEDB5A185Format() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let orderNumber = '';

    // Add 3 random letters
    for (let i = 0; i < 3; i++) {
        orderNumber += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Add random number (1-9)
    orderNumber += Math.floor(Math.random() * 9) + 1;

    // Add random letter
    orderNumber += letters.charAt(Math.floor(Math.random() * letters.length));

    // Add 3 random numbers
    for (let i = 0; i < 3; i++) {
        orderNumber += Math.floor(Math.random() * 10);
    }

    return orderNumber;
}

async function createTestOrder() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Generate test order number
        const orderNumber = generateEDB5A185Format();
        console.log('📝 Generated order number:', orderNumber);

        // Create test order
        const testOrder = new Order({
            orderNumber: orderNumber,
            customerType: 'guest',
            guestInfo: {
                name: 'Test Customer',
                email: 'test@sarahsshortcakes.com',
                phone: '555-0123'
            },
            items: [
                {
                    productId: 'vanilla-cupcake',
                    quantity: 6,
                    price: 3.99,
                    customization: {
                        flavor: 'Vanilla',
                        icing: 'Chocolate Buttercream',
                        decorations: 'Rainbow sprinkles'
                    }
                },
                {
                    productId: 'chocolate-cupcake',
                    quantity: 4,
                    price: 4.49,
                    customization: {
                        flavor: 'Chocolate',
                        icing: 'Vanilla Buttercream',
                        decorations: 'Chocolate chips'
                    }
                }
            ],
            deliveryInfo: {
                method: 'pickup',
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                deliveryTime: '14:00',
                address: {
                    street: '123 Test Street',
                    city: 'Test City',
                    state: 'Test State',
                    zip: '12345'
                }
            },
            payment: {
                method: 'proof_upload',
                amount: 41.90,
                status: 'pending'
            },
            subtotal: 41.90,
            tax: 3.35,
            deliveryFee: 0.00,
            totalAmount: 45.25,
            status: 'processing',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await testOrder.save();
        console.log('✅ Test order created successfully!');
        console.log('📋 Order Details:');
        console.log(`   Order Number: ${testOrder.orderNumber}`);
        console.log(`   Customer: ${testOrder.guestInfo.name}`);
        console.log(`   Email: ${testOrder.guestInfo.email}`);
        console.log(`   Total: $${(testOrder.totalAmount || 0).toFixed(2)}`);
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

// Run the script
createTestOrder();
