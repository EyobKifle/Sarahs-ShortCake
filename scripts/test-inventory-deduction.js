const mongoose = require('mongoose');
const Order = require('../models/Order');
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
const { deductInventoryForOrder, checkInventoryAvailability } = require('../utils/inventoryDeduction');
require('dotenv').config();

async function testInventoryDeduction() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        console.log('\n🧪 TESTING INVENTORY DEDUCTION SYSTEM');
        console.log('═'.repeat(60));

        // STEP 1: Check current inventory levels
        console.log('\n📊 STEP 1: Current Inventory Levels');
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

        // STEP 2: Test inventory availability check
        console.log('\n🔍 STEP 2: Testing Inventory Availability Check');
        console.log('─'.repeat(40));
        
        const testOrderItems = [
            { productName: 'Vanilla Cupcake', quantity: 5 },
            { productName: 'Chocolate Cupcake', quantity: 3 },
            { productName: 'Red Velvet Cupcake', quantity: 2 }
        ];

        console.log('   Testing order items:', testOrderItems);
        
        const availabilityCheck = await checkInventoryAvailability(testOrderItems);
        console.log(`   Availability: ${availabilityCheck.available ? '✅ Available' : '❌ Not Available'}`);
        
        if (!availabilityCheck.available) {
            console.log('   Insufficient items:');
            availabilityCheck.insufficientItems.forEach(item => {
                console.log(`     - ${item}`);
            });
        }

        // STEP 3: Test inventory deduction
        console.log('\n🔄 STEP 3: Testing Inventory Deduction');
        console.log('─'.repeat(40));
        
        if (availabilityCheck.available) {
            const deductionResult = await deductInventoryForOrder(
                testOrderItems,
                'TEST-ORDER-001',
                'Test System'
            );

            console.log(`   Deduction Success: ${deductionResult.success ? '✅' : '❌'}`);
            console.log(`   Ingredients Processed: ${deductionResult.summary.totalIngredients}`);
            console.log(`   Errors: ${deductionResult.summary.totalErrors}`);
            console.log(`   Warnings: ${deductionResult.summary.totalWarnings}`);

            if (deductionResult.errors.length > 0) {
                console.log('   Errors:');
                deductionResult.errors.forEach(error => {
                    console.log(`     - ${error}`);
                });
            }

            if (deductionResult.warnings.length > 0) {
                console.log('   Warnings:');
                deductionResult.warnings.forEach(warning => {
                    console.log(`     - ${warning}`);
                });
            }

            // Show detailed deduction results
            if (deductionResult.deductionResults.length > 0) {
                console.log('\n   📋 Detailed Deduction Results:');
                deductionResult.deductionResults.forEach(result => {
                    console.log(`     ${result.ingredient}: ${result.previousQuantity} → ${result.newQuantity} ${result.unit} (deducted: ${result.quantityDeducted.toFixed(4)})`);
                });
            }
        } else {
            console.log('   ⚠️ Skipping deduction test due to insufficient inventory');
        }

        // STEP 4: Check inventory levels after deduction
        console.log('\n📊 STEP 4: Inventory Levels After Deduction');
        console.log('─'.repeat(40));
        
        for (const ingredientName of keyIngredients) {
            const item = await InventoryItem.findOne({ name: ingredientName });
            if (item) {
                const before = beforeInventory[ingredientName] || 0;
                const after = item.quantity;
                const change = before - after;
                console.log(`   ${ingredientName}: ${before} → ${after} ${item.unit} (change: ${change > 0 ? '-' : ''}${Math.abs(change).toFixed(4)})`);
            }
        }

        // STEP 5: Test with a real order from database
        console.log('\n🔍 STEP 5: Testing with Real Order from Database');
        console.log('─'.repeat(40));
        
        const realOrder = await Order.findOne({ status: { $ne: 'completed' } }).limit(1);
        if (realOrder) {
            console.log(`   Found order: ${realOrder.orderNumber || realOrder._id}`);
            console.log(`   Items: ${realOrder.items.length}`);
            
            // Convert order items to test format
            const Product = require('../models/Product');
            const realOrderItems = await Promise.all(realOrder.items.map(async (item) => {
                let productName = 'Unknown Product';
                
                try {
                    let product = null;
                    const objectIdRegex = /^[a-f\d]{24}$/i;
                    
                    if (objectIdRegex.test(item.productId)) {
                        product = await Product.findById(item.productId);
                    } else {
                        product = await Product.findOne({ slug: item.productId.toLowerCase() }) ||
                                 await Product.findOne({ name: item.productId });
                    }
                    
                    if (product) {
                        productName = product.name;
                    } else if (typeof item.productId === 'string' && item.productId.includes('-')) {
                        productName = item.productId
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                    }
                } catch (error) {
                    console.error('Error fetching product:', error);
                }
                
                return {
                    productName: productName,
                    quantity: item.quantity
                };
            }));

            console.log('   Real order items:', realOrderItems);
            
            const realAvailabilityCheck = await checkInventoryAvailability(realOrderItems);
            console.log(`   Real order availability: ${realAvailabilityCheck.available ? '✅ Available' : '❌ Not Available'}`);
            
            if (!realAvailabilityCheck.available) {
                console.log('   Insufficient items for real order:');
                realAvailabilityCheck.insufficientItems.forEach(item => {
                    console.log(`     - ${item}`);
                });
            }
        } else {
            console.log('   ⚠️ No non-completed orders found in database');
        }

        console.log('\n✅ INVENTORY DEDUCTION TEST COMPLETED');
        console.log('═'.repeat(60));

    } catch (error) {
        console.error('❌ Error during inventory deduction test:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testInventoryDeduction();
}

module.exports = { testInventoryDeduction };
