const mongoose = require('mongoose');
const Order = require('../models/Order');
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
const { deductInventoryForOrder, checkInventoryAvailability } = require('../utils/inventoryDeduction');
require('dotenv').config();

async function completeSystemDemo() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        console.log('\n🎯 SARAH\'S SHORTCAKES - COMPLETE SYSTEM DEMONSTRATION');
        console.log('═'.repeat(80));

        // STEP 1: Create multiple test orders to demonstrate the system
        console.log('\n📝 STEP 1: Creating Test Orders');
        console.log('─'.repeat(50));

        const testOrders = [
            {
                orderNumber: `DEMO-${Date.now()}-001`,
                customerType: 'guest',
                guestInfo: {
                    name: 'Alice Johnson',
                    email: 'alice@example.com',
                    phone: '555-0101'
                },
                items: [
                    { productId: 'vanilla-cupcake', quantity: 6, price: 3.99 },
                    { productId: 'chocolate-cupcake', quantity: 4, price: 3.99 }
                ],
                status: 'pending',
                subtotal: 39.90,
                tax: 3.19,
                total: 43.09
            },
            {
                orderNumber: `DEMO-${Date.now()}-002`,
                customerType: 'guest',
                guestInfo: {
                    name: 'Bob Smith',
                    email: 'bob@example.com',
                    phone: '555-0102'
                },
                items: [
                    { productId: 'red-velvet-cupcake', quantity: 8, price: 4.49 },
                    { productId: 'white-chocolate-cupcake', quantity: 3, price: 4.99 }
                ],
                status: 'pending',
                subtotal: 50.89,
                tax: 4.07,
                total: 54.96
            },
            {
                orderNumber: `DEMO-${Date.now()}-003`,
                customerType: 'guest',
                guestInfo: {
                    name: 'Carol Davis',
                    email: 'carol@example.com',
                    phone: '555-0103'
                },
                items: [
                    { productId: 'strawberry-cupcake', quantity: 5, price: 4.99 },
                    { productId: 'peanut-butter-cupcake', quantity: 3, price: 4.99 },
                    { productId: 'blueberry-cupcake', quantity: 2, price: 4.99 }
                ],
                status: 'pending',
                subtotal: 49.90,
                tax: 3.99,
                total: 53.89
            }
        ];

        const createdOrders = [];
        for (const orderData of testOrders) {
            const order = new Order({
                ...orderData,
                deliveryInfo: {
                    method: 'pickup',
                    deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    deliveryTime: '14:00'
                },
                payment: {
                    method: 'cash',
                    status: 'pending'
                }
            });
            await order.save();
            createdOrders.push(order);
            console.log(`   ✅ Created order ${order.orderNumber} for ${order.guestInfo.name}`);
        }

        // STEP 2: Show current inventory levels before processing orders
        console.log('\n📊 STEP 2: Inventory Levels Before Order Processing');
        console.log('─'.repeat(50));

        const keyIngredients = [
            'All-purpose flour', 'Granulated sugar', 'Unsalted butter', 
            'Whole eggs', 'Vanilla extract', 'Cream cheese', 'Fresh strawberries'
        ];
        
        const beforeInventory = {};
        for (const ingredientName of keyIngredients) {
            const item = await InventoryItem.findOne({ name: ingredientName });
            if (item) {
                beforeInventory[ingredientName] = item.quantity;
                console.log(`   ${ingredientName}: ${item.quantity.toFixed(4)} ${item.unit}`);
            }
        }

        // STEP 3: Process each order and show inventory deduction
        console.log('\n🔄 STEP 3: Processing Orders and Deducting Inventory');
        console.log('─'.repeat(50));

        for (const order of createdOrders) {
            console.log(`\n   📦 Processing Order: ${order.orderNumber}`);
            
            // Convert order items to the format expected by deductInventoryForOrder
            const orderItems = order.items.map(item => {
                let productName = 'Unknown Product';
                if (typeof item.productId === 'string' && item.productId.includes('-')) {
                    productName = item.productId
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }
                return {
                    productName: productName,
                    quantity: item.quantity
                };
            });

            console.log(`   📋 Items: ${orderItems.map(item => `${item.quantity}x ${item.productName}`).join(', ')}`);

            // Check availability first
            const availability = await checkInventoryAvailability(orderItems);
            if (!availability.available) {
                console.log(`   ❌ Insufficient inventory for order ${order.orderNumber}`);
                availability.insufficientItems.forEach(item => {
                    console.log(`     - ${item}`);
                });
                continue;
            }

            // Process the inventory deduction
            const deductionResult = await deductInventoryForOrder(
                orderItems,
                order.orderNumber,
                'Demo System'
            );

            if (deductionResult.success) {
                console.log(`   ✅ Successfully deducted ${deductionResult.summary.totalIngredients} ingredients`);
                
                // Update order status to completed
                order.status = 'completed';
                await order.save();
                console.log(`   📋 Order status updated to: ${order.status}`);

                if (deductionResult.warnings.length > 0) {
                    console.log(`   ⚠️ Warnings: ${deductionResult.warnings.length}`);
                    deductionResult.warnings.slice(0, 2).forEach(warning => {
                        console.log(`     - ${warning}`);
                    });
                }
            } else {
                console.log(`   ❌ Failed to process order: ${deductionResult.errors.join(', ')}`);
            }
        }

        // STEP 4: Show inventory levels after processing
        console.log('\n📊 STEP 4: Inventory Levels After Order Processing');
        console.log('─'.repeat(50));

        for (const ingredientName of keyIngredients) {
            const item = await InventoryItem.findOne({ name: ingredientName });
            if (item) {
                const before = beforeInventory[ingredientName] || 0;
                const after = item.quantity;
                const change = before - after;
                const changeStr = change > 0 ? `-${change.toFixed(4)}` : `+${Math.abs(change).toFixed(4)}`;
                const status = item.quantity <= item.threshold ? '⚠️ LOW' : '✅ OK';
                console.log(`   ${ingredientName}: ${before.toFixed(4)} → ${after.toFixed(4)} ${item.unit} (${changeStr}) ${status}`);
            }
        }

        // STEP 5: Analyze usage patterns
        console.log('\n📈 STEP 5: Usage Pattern Analysis');
        console.log('─'.repeat(50));

        const flourItem = await InventoryItem.findOne({ name: 'All-purpose flour' });
        if (flourItem && flourItem.history.length > 0) {
            const recentDeductions = flourItem.history
                .filter(h => h.action === 'deduct')
                .slice(-5); // Last 5 deductions

            console.log(`   📊 Recent flour usage (last ${recentDeductions.length} deductions):`);
            let totalDeducted = 0;
            recentDeductions.forEach(deduction => {
                const amount = Math.abs(deduction.changeAmount);
                totalDeducted += amount;
                console.log(`     - ${amount.toFixed(4)} kg: ${deduction.notes}`);
            });
            console.log(`   📋 Total recent usage: ${totalDeducted.toFixed(4)} kg`);
        }

        // STEP 6: Production capacity analysis
        console.log('\n🏭 STEP 6: Updated Production Capacity Analysis');
        console.log('─'.repeat(50));

        const recipeMapping = require('../utils/recipeMapping');
        const vanillaRecipe = recipeMapping['Vanilla Cupcake'];
        
        if (vanillaRecipe) {
            console.log('   📊 Maximum vanilla cupcakes possible with current inventory:');
            
            for (const ingredientName of ['All-purpose flour', 'Granulated sugar', 'Unsalted butter']) {
                const item = await InventoryItem.findOne({ name: ingredientName });
                if (item) {
                    const vanillaIngredient = vanillaRecipe.ingredients.find(ing => ing.name === ingredientName);
                    if (vanillaIngredient) {
                        const requiredPerCupcake = vanillaIngredient.quantity * vanillaIngredient.conversionFactor;
                        const maxCupcakes = Math.floor(item.quantity / requiredPerCupcake);
                        console.log(`     ${ingredientName}: ~${maxCupcakes} cupcakes (${item.quantity.toFixed(2)} ${item.unit} available)`);
                    }
                }
            }
        }

        // STEP 7: Low stock alerts and restock recommendations
        console.log('\n⚠️ STEP 7: Stock Alerts and Restock Recommendations');
        console.log('─'.repeat(50));

        const allInventory = await InventoryItem.find().sort({ quantity: 1 });
        const lowStockItems = allInventory.filter(item => item.quantity <= item.threshold * 1.5); // 150% of threshold
        const criticalStockItems = allInventory.filter(item => item.quantity <= item.threshold);

        if (criticalStockItems.length > 0) {
            console.log(`   🚨 CRITICAL: ${criticalStockItems.length} items at or below threshold:`);
            criticalStockItems.forEach(item => {
                console.log(`     - ${item.name}: ${item.quantity.toFixed(4)} ${item.unit} (threshold: ${item.threshold})`);
            });
        }

        if (lowStockItems.length > 0) {
            console.log(`   ⚠️ LOW STOCK: ${lowStockItems.length} items approaching threshold:`);
            lowStockItems.slice(0, 5).forEach(item => {
                const percentOfThreshold = (item.quantity / item.threshold * 100).toFixed(1);
                console.log(`     - ${item.name}: ${item.quantity.toFixed(4)} ${item.unit} (${percentOfThreshold}% of threshold)`);
            });
        }

        if (criticalStockItems.length === 0 && lowStockItems.length === 0) {
            console.log('   ✅ All inventory levels are healthy!');
        }

        // STEP 8: Clean up demo orders
        console.log('\n🧹 STEP 8: Cleaning Up Demo Orders');
        console.log('─'.repeat(50));

        for (const order of createdOrders) {
            await Order.findByIdAndDelete(order._id);
            console.log(`   ✅ Deleted demo order: ${order.orderNumber}`);
        }

        console.log('\n✅ COMPLETE SYSTEM DEMONSTRATION FINISHED');
        console.log('═'.repeat(80));

        // Final summary
        console.log('\n📋 DEMONSTRATION SUMMARY:');
        console.log(`   ✅ Created and processed ${createdOrders.length} test orders`);
        console.log(`   ✅ Automatically deducted ingredients for all completed orders`);
        console.log(`   ✅ Tracked inventory changes in real-time`);
        console.log(`   ✅ Generated usage pattern analysis`);
        console.log(`   ✅ Provided production capacity insights`);
        console.log(`   ✅ Identified stock alerts and restock needs`);

    } catch (error) {
        console.error('❌ Error during complete system demonstration:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    completeSystemDemo();
}

module.exports = { completeSystemDemo };
