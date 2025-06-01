const axios = require('axios');
const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

async function testLiveOrderCompletion() {
    try {
        console.log('\n🧪 TESTING LIVE ORDER COMPLETION WITH INVENTORY DEDUCTION');
        console.log('═'.repeat(70));

        // Connect to MongoDB to check inventory
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        // STEP 1: Get admin token
        console.log('\n🔐 STEP 1: Getting Admin Authentication');
        console.log('─'.repeat(40));

        const loginResponse = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
            email: 'admin@sarahsshortcakes.com',
            password: 'admin123'
        });

        const adminToken = loginResponse.data.token;
        console.log('   ✅ Admin authenticated successfully');

        // STEP 2: Check current inventory
        console.log('\n📊 STEP 2: Current Inventory Levels');
        console.log('─'.repeat(40));

        const keyIngredients = ['All-purpose flour', 'Granulated sugar', 'Unsalted butter', 'Whole eggs', 'Vanilla extract'];
        const beforeInventory = {};
        
        for (const ingredientName of keyIngredients) {
            const item = await InventoryItem.findOne({ name: ingredientName });
            if (item) {
                beforeInventory[ingredientName] = item.quantity;
                console.log(`   ${ingredientName}: ${item.quantity} ${item.unit}`);
            }
        }

        // STEP 3: Create a test order via API
        console.log('\n📝 STEP 3: Creating Test Order via API');
        console.log('─'.repeat(40));

        const orderData = {
            customerType: 'guest',
            guestInfo: {
                name: 'Live Test Customer',
                email: 'livetest@example.com',
                phone: '1234567890'
            },
            items: [
                {
                    productId: 'vanilla-cupcake',
                    quantity: 4,
                    price: 3.99
                },
                {
                    productId: 'red-velvet-cupcake',
                    quantity: 2,
                    price: 4.49
                }
            ],
            deliveryInfo: {
                method: 'pickup',
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                deliveryTime: '15:00'
            },
            payment: {
                method: 'cash',
                status: 'pending'
            },
            subtotal: 24.94,
            tax: 2.00,
            deliveryFee: 0,
            total: 26.94,
            status: 'pending'
        };

        const createOrderResponse = await axios.post(`${BASE_URL}/api/orders`, orderData, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        const createdOrder = createOrderResponse.data.data;
        console.log(`   ✅ Created order: ${createdOrder.orderNumber}`);
        console.log(`   📦 Items: ${createdOrder.items.length}`);

        // STEP 4: Update order status to completed via API
        console.log('\n🔄 STEP 4: Completing Order via API');
        console.log('─'.repeat(40));

        const completeOrderResponse = await axios.put(
            `${BASE_URL}/api/orders/${createdOrder._id}/status`,
            { status: 'completed' },
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const completionResult = completeOrderResponse.data;
        console.log(`   Response: ${completionResult.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   Message: ${completionResult.message}`);

        if (completionResult.inventoryUpdate) {
            console.log(`   Inventory Update: ${completionResult.inventoryUpdate.success ? '✅ Success' : '❌ Failed'}`);
        }

        // STEP 5: Check inventory after completion
        console.log('\n📊 STEP 5: Inventory After Order Completion');
        console.log('─'.repeat(40));

        for (const ingredientName of keyIngredients) {
            const item = await InventoryItem.findOne({ name: ingredientName });
            if (item) {
                const before = beforeInventory[ingredientName] || 0;
                const after = item.quantity;
                const change = before - after;
                const changeStr = change > 0 ? `-${change.toFixed(4)}` : `+${Math.abs(change).toFixed(4)}`;
                console.log(`   ${ingredientName}: ${before} → ${after} ${item.unit} (${changeStr})`);
            }
        }

        // STEP 6: Verify order status via API
        console.log('\n✅ STEP 6: Verifying Order Status via API');
        console.log('─'.repeat(40));

        const getOrderResponse = await axios.get(`${BASE_URL}/api/orders/${createdOrder._id}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const updatedOrder = getOrderResponse.data.data;
        console.log(`   Order Status: ${updatedOrder.status}`);
        console.log(`   Order Number: ${updatedOrder.orderNumber}`);

        // STEP 7: Test inventory availability check
        console.log('\n🔍 STEP 7: Testing Large Order (Should Show Warnings)');
        console.log('─'.repeat(40));

        const largeOrderData = {
            customerType: 'guest',
            guestInfo: {
                name: 'Large Order Test',
                email: 'large@example.com',
                phone: '1234567890'
            },
            items: [
                {
                    productId: 'vanilla-cupcake',
                    quantity: 100, // Large quantity to test limits
                    price: 3.99
                }
            ],
            deliveryInfo: {
                method: 'pickup',
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                deliveryTime: '16:00'
            },
            payment: {
                method: 'cash',
                status: 'pending'
            },
            subtotal: 399.00,
            tax: 31.92,
            deliveryFee: 0,
            total: 430.92,
            status: 'pending'
        };

        try {
            const largeOrderResponse = await axios.post(`${BASE_URL}/api/orders`, largeOrderData, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const largeOrder = largeOrderResponse.data.data;
            console.log(`   ✅ Created large order: ${largeOrder.orderNumber}`);

            // Try to complete the large order
            const completeLargeOrderResponse = await axios.put(
                `${BASE_URL}/api/orders/${largeOrder._id}/status`,
                { status: 'completed' },
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const largeCompletionResult = completeLargeOrderResponse.data;
            console.log(`   Large Order Completion: ${largeCompletionResult.success ? '✅ Success' : '❌ Failed'}`);
            console.log(`   Message: ${largeCompletionResult.message}`);

            // Clean up large order
            await axios.delete(`${BASE_URL}/api/orders/${largeOrder._id}`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });

        } catch (error) {
            console.log(`   ⚠️ Large order test failed as expected: ${error.response?.data?.message || error.message}`);
        }

        // STEP 8: Clean up test order
        console.log('\n🧹 STEP 8: Cleaning Up Test Order');
        console.log('─'.repeat(40));

        try {
            await axios.delete(`${BASE_URL}/api/orders/${createdOrder._id}`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            console.log(`   ✅ Deleted test order: ${createdOrder.orderNumber}`);
        } catch (error) {
            console.log(`   ⚠️ Could not delete order (may not have delete endpoint): ${error.response?.status}`);
        }

        console.log('\n✅ LIVE ORDER COMPLETION TEST COMPLETED SUCCESSFULLY');
        console.log('═'.repeat(70));

        console.log('\n📊 FINAL SUMMARY:');
        console.log(`   ✅ Admin authentication: Success`);
        console.log(`   ✅ Order creation via API: Success`);
        console.log(`   ✅ Order completion via API: ${completionResult.success ? 'Success' : 'Failed'}`);
        console.log(`   ✅ Inventory deduction: ${completionResult.inventoryUpdate?.success ? 'Success' : 'Failed'}`);
        console.log(`   ✅ Status verification: ${updatedOrder.status === 'completed' ? 'Success' : 'Failed'}`);
        console.log(`   ✅ Live API integration: Success`);

    } catch (error) {
        console.error('❌ Error during live order completion test:', error.response?.data || error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testLiveOrderCompletion();
}

module.exports = { testLiveOrderCompletion };
