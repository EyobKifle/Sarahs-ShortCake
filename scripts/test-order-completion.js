const mongoose = require('mongoose');
const Order = require('../models/Order');
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
require('dotenv').config();

async function testOrderCompletion() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        console.log('\n🧪 TESTING ORDER COMPLETION WITH INVENTORY DEDUCTION');
        console.log('═'.repeat(70));

        // STEP 1: Create a test order
        console.log('\n📝 STEP 1: Creating Test Order');
        console.log('─'.repeat(40));

        const testOrder = new Order({
            orderNumber: `TEST-${Date.now()}`,
            customerType: 'guest',
            guestInfo: {
                name: 'Test Customer',
                email: 'test@example.com',
                phone: '1234567890'
            },
            items: [
                {
                    productId: 'vanilla-cupcake',
                    quantity: 3,
                    price: 3.99
                },
                {
                    productId: 'chocolate-cupcake',
                    quantity: 2,
                    price: 3.99
                }
            ],
            deliveryInfo: {
                method: 'pickup',
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                deliveryTime: '14:00'
            },
            payment: {
                method: 'cash',
                status: 'pending'
            },
            subtotal: 19.95,
            tax: 1.60,
            deliveryFee: 0,
            total: 21.55,
            status: 'pending'
        });

        await testOrder.save();
        console.log(`   ✅ Created test order: ${testOrder.orderNumber}`);
        console.log(`   📦 Items: ${testOrder.items.length}`);

        // STEP 2: Check inventory before completion
        console.log('\n📊 STEP 2: Inventory Before Order Completion');
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

        // STEP 3: Simulate order completion via API call
        console.log('\n🔄 STEP 3: Completing Order (Simulating API Call)');
        console.log('─'.repeat(40));

        // Import the order controller function
        const orderController = require('../controllers/orderController');
        
        // Create mock request and response objects
        const mockReq = {
            params: { id: testOrder._id.toString() },
            body: { status: 'completed' },
            user: { name: 'Test Admin' }
        };

        let responseData = null;
        let responseStatus = null;
        const mockRes = {
            status: (code) => {
                responseStatus = code;
                return mockRes;
            },
            json: (data) => {
                responseData = data;
                return mockRes;
            }
        };

        // Call the updateOrderStatus function
        await orderController.updateOrderStatus(mockReq, mockRes);

        console.log(`   Response Status: ${responseStatus}`);
        console.log(`   Success: ${responseData?.success ? '✅' : '❌'}`);
        console.log(`   Message: ${responseData?.message}`);

        if (responseData?.inventoryUpdate) {
            console.log(`   Inventory Update: ${responseData.inventoryUpdate.success ? '✅' : '❌'}`);
            console.log(`   Details: ${responseData.inventoryUpdate.details}`);
        }

        // STEP 4: Check inventory after completion
        console.log('\n📊 STEP 4: Inventory After Order Completion');
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

        // STEP 5: Verify order status was updated
        console.log('\n✅ STEP 5: Verifying Order Status');
        console.log('─'.repeat(40));

        const updatedOrder = await Order.findById(testOrder._id);
        console.log(`   Order Status: ${updatedOrder.status}`);
        console.log(`   Order Number: ${updatedOrder.orderNumber}`);

        // STEP 6: Check inventory history
        console.log('\n📋 STEP 6: Checking Inventory History');
        console.log('─'.repeat(40));

        const flourItem = await InventoryItem.findOne({ name: 'All-purpose flour' });
        if (flourItem && flourItem.history.length > 0) {
            const latestHistory = flourItem.history[flourItem.history.length - 1];
            console.log(`   Latest flour history entry:`);
            console.log(`     Action: ${latestHistory.action}`);
            console.log(`     Change: ${latestHistory.changeAmount}`);
            console.log(`     Notes: ${latestHistory.notes}`);
            console.log(`     Date: ${latestHistory.date}`);
        }

        // STEP 7: Clean up test order
        console.log('\n🧹 STEP 7: Cleaning Up Test Order');
        console.log('─'.repeat(40));

        await Order.findByIdAndDelete(testOrder._id);
        console.log(`   ✅ Deleted test order: ${testOrder.orderNumber}`);

        console.log('\n✅ ORDER COMPLETION TEST COMPLETED SUCCESSFULLY');
        console.log('═'.repeat(70));

        console.log('\n📊 SUMMARY:');
        console.log(`   ✅ Order creation: Success`);
        console.log(`   ✅ Order completion: ${responseData?.success ? 'Success' : 'Failed'}`);
        console.log(`   ✅ Inventory deduction: ${responseData?.inventoryUpdate?.success ? 'Success' : 'Failed'}`);
        console.log(`   ✅ Status update: ${updatedOrder.status === 'completed' ? 'Success' : 'Failed'}`);
        console.log(`   ✅ History tracking: ${flourItem?.history?.length > 0 ? 'Success' : 'Failed'}`);

    } catch (error) {
        console.error('❌ Error during order completion test:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testOrderCompletion();
}

module.exports = { testOrderCompletion };
