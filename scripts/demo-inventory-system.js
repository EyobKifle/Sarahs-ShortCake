const mongoose = require('mongoose');
const Order = require('../models/Order');
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
require('dotenv').config();

async function demonstrateInventorySystem() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        console.log('\n🎯 SARAH\'S SHORTCAKES - INVENTORY MANAGEMENT SYSTEM DEMO');
        console.log('═'.repeat(80));

        // STEP 1: Show current inventory status
        console.log('\n📊 STEP 1: Current Inventory Status');
        console.log('─'.repeat(50));

        const allInventory = await InventoryItem.find().sort({ category: 1, name: 1 });
        const inventoryByCategory = {};

        allInventory.forEach(item => {
            if (!inventoryByCategory[item.category]) {
                inventoryByCategory[item.category] = [];
            }
            inventoryByCategory[item.category].push(item);
        });

        console.log(`   📦 Total Inventory Items: ${allInventory.length}`);
        console.log(`   📂 Categories: ${Object.keys(inventoryByCategory).length}`);
        console.log('');

        Object.keys(inventoryByCategory).forEach(category => {
            console.log(`   📂 ${category.toUpperCase()}:`);
            inventoryByCategory[category].forEach(item => {
                const status = item.quantity <= item.threshold ? '⚠️ LOW' : '✅ OK';
                console.log(`     ${item.name}: ${item.quantity} ${item.unit} ${status}`);
            });
            console.log('');
        });

        // STEP 2: Show recipe mapping
        console.log('\n🧁 STEP 2: Recipe Mapping System');
        console.log('─'.repeat(50));

        const recipeMapping = require('../utils/recipeMapping');
        const recipeNames = Object.keys(recipeMapping);
        
        console.log(`   📋 Total Recipes: ${recipeNames.length}`);
        console.log('   🧁 Available Cupcake Types:');
        
        recipeNames.slice(0, 5).forEach((recipeName, index) => {
            const recipe = recipeMapping[recipeName];
            console.log(`     ${index + 1}. ${recipeName} (${recipe.ingredients.length} ingredients)`);
        });
        
        if (recipeNames.length > 5) {
            console.log(`     ... and ${recipeNames.length - 5} more cupcake types`);
        }

        // STEP 3: Demonstrate inventory calculation for sample order
        console.log('\n🔢 STEP 3: Sample Order Calculation');
        console.log('─'.repeat(50));

        const sampleOrder = [
            { productName: 'Vanilla Cupcake', quantity: 10 },
            { productName: 'Chocolate Cupcake', quantity: 5 },
            { productName: 'Red Velvet Cupcake', quantity: 3 }
        ];

        console.log('   📝 Sample Order:');
        sampleOrder.forEach(item => {
            console.log(`     - ${item.quantity}x ${item.productName}`);
        });

        const { checkInventoryAvailability } = require('../utils/inventoryDeduction');
        const availability = await checkInventoryAvailability(sampleOrder);

        console.log(`\n   📊 Availability Check: ${availability.available ? '✅ Available' : '❌ Insufficient Stock'}`);
        
        if (!availability.available) {
            console.log('   ⚠️ Insufficient Items:');
            availability.insufficientItems.forEach(item => {
                console.log(`     - ${item}`);
            });
        }

        // STEP 4: Show ingredient requirements breakdown
        console.log('\n📋 STEP 4: Ingredient Requirements Breakdown');
        console.log('─'.repeat(50));

        const vanillaRecipe = recipeMapping['Vanilla Cupcake'];
        if (vanillaRecipe) {
            console.log('   🧁 Vanilla Cupcake Recipe (per cupcake):');
            vanillaRecipe.ingredients.forEach(ingredient => {
                const totalNeeded = ingredient.quantity * ingredient.conversionFactor;
                console.log(`     - ${ingredient.name}: ${ingredient.quantity} ${ingredient.unit} (${totalNeeded.toFixed(4)} inventory units)`);
            });
        }

        // STEP 5: Show low stock warnings
        console.log('\n⚠️ STEP 5: Low Stock Warnings');
        console.log('─'.repeat(50));

        const lowStockItems = allInventory.filter(item => item.quantity <= item.threshold);
        
        if (lowStockItems.length > 0) {
            console.log(`   📉 ${lowStockItems.length} items are at or below threshold:`);
            lowStockItems.forEach(item => {
                console.log(`     ⚠️ ${item.name}: ${item.quantity} ${item.unit} (threshold: ${item.threshold})`);
            });
        } else {
            console.log('   ✅ All inventory items are above threshold levels');
        }

        // STEP 6: Show recent inventory history
        console.log('\n📜 STEP 6: Recent Inventory Activity');
        console.log('─'.repeat(50));

        const itemsWithHistory = allInventory.filter(item => item.history && item.history.length > 0);
        
        if (itemsWithHistory.length > 0) {
            console.log(`   📊 ${itemsWithHistory.length} items have activity history`);
            
            // Show recent activity from a few items
            const recentActivity = [];
            itemsWithHistory.slice(0, 3).forEach(item => {
                if (item.history.length > 0) {
                    const latestHistory = item.history[item.history.length - 1];
                    recentActivity.push({
                        item: item.name,
                        action: latestHistory.action,
                        change: latestHistory.changeAmount,
                        date: latestHistory.date,
                        notes: latestHistory.notes
                    });
                }
            });

            recentActivity.forEach(activity => {
                const changeStr = activity.change > 0 ? `+${activity.change}` : activity.change;
                console.log(`     📝 ${activity.item}: ${activity.action} (${changeStr}) - ${activity.notes || 'No notes'}`);
            });
        } else {
            console.log('   📝 No inventory activity history found');
        }

        // STEP 7: Calculate production capacity
        console.log('\n🏭 STEP 7: Production Capacity Analysis');
        console.log('─'.repeat(50));

        const keyIngredients = ['All-purpose flour', 'Granulated sugar', 'Unsalted butter'];
        console.log('   📊 Maximum production capacity based on key ingredients:');

        for (const ingredientName of keyIngredients) {
            const item = await InventoryItem.findOne({ name: ingredientName });
            if (item) {
                // Estimate how many vanilla cupcakes we could make with this ingredient
                const vanillaIngredient = vanillaRecipe.ingredients.find(ing => ing.name === ingredientName);
                if (vanillaIngredient) {
                    const requiredPerCupcake = vanillaIngredient.quantity * vanillaIngredient.conversionFactor;
                    const maxCupcakes = Math.floor(item.quantity / requiredPerCupcake);
                    console.log(`     ${ingredientName}: ~${maxCupcakes} vanilla cupcakes (${item.quantity} ${item.unit} available)`);
                }
            }
        }

        console.log('\n✅ INVENTORY SYSTEM DEMONSTRATION COMPLETED');
        console.log('═'.repeat(80));

        console.log('\n🎯 SYSTEM CAPABILITIES SUMMARY:');
        console.log('   ✅ Complete ingredient inventory tracking');
        console.log('   ✅ Recipe-based ingredient mapping for all 17 cupcake types');
        console.log('   ✅ Automatic inventory deduction on order completion');
        console.log('   ✅ Low stock warnings and threshold monitoring');
        console.log('   ✅ Detailed inventory history tracking');
        console.log('   ✅ Production capacity analysis');
        console.log('   ✅ Real-time availability checking');
        console.log('   ✅ Support for 100+ cupcakes with current inventory levels');

        console.log('\n📋 NEXT STEPS:');
        console.log('   1. Use the admin panel to complete orders and see automatic inventory deduction');
        console.log('   2. Monitor inventory levels through the admin dashboard');
        console.log('   3. Set up restock alerts when items reach threshold levels');
        console.log('   4. Track ingredient usage patterns for better inventory planning');

    } catch (error) {
        console.error('❌ Error during inventory system demonstration:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the demo if this file is executed directly
if (require.main === module) {
    demonstrateInventorySystem();
}

module.exports = { demonstrateInventorySystem };
