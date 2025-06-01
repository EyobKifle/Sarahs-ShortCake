const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const recipeMapping = require('../utils/recipeMapping');
require('dotenv').config();

async function inventoryMonitoringDashboard() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        console.log('\n📊 SARAH\'S SHORTCAKES - INVENTORY MONITORING DASHBOARD');
        console.log('═'.repeat(80));

        // STEP 1: Overall Inventory Health
        console.log('\n🏥 STEP 1: Overall Inventory Health Status');
        console.log('─'.repeat(50));

        const allInventory = await InventoryItem.find().sort({ category: 1, name: 1 });
        
        const healthStats = {
            total: allInventory.length,
            healthy: 0,
            warning: 0,
            critical: 0,
            outOfStock: 0
        };

        allInventory.forEach(item => {
            if (item.quantity <= 0) {
                healthStats.outOfStock++;
            } else if (item.quantity <= item.threshold) {
                healthStats.critical++;
            } else if (item.quantity <= item.threshold * 1.5) {
                healthStats.warning++;
            } else {
                healthStats.healthy++;
            }
        });

        console.log(`   📦 Total Items: ${healthStats.total}`);
        console.log(`   ✅ Healthy: ${healthStats.healthy} (${(healthStats.healthy/healthStats.total*100).toFixed(1)}%)`);
        console.log(`   ⚠️ Warning: ${healthStats.warning} (${(healthStats.warning/healthStats.total*100).toFixed(1)}%)`);
        console.log(`   🚨 Critical: ${healthStats.critical} (${(healthStats.critical/healthStats.total*100).toFixed(1)}%)`);
        console.log(`   ❌ Out of Stock: ${healthStats.outOfStock} (${(healthStats.outOfStock/healthStats.total*100).toFixed(1)}%)`);

        // STEP 2: Category-wise Inventory Status
        console.log('\n📂 STEP 2: Category-wise Inventory Status');
        console.log('─'.repeat(50));

        const categoryStats = {};
        allInventory.forEach(item => {
            if (!categoryStats[item.category]) {
                categoryStats[item.category] = {
                    total: 0,
                    healthy: 0,
                    warning: 0,
                    critical: 0,
                    totalValue: 0
                };
            }
            
            categoryStats[item.category].total++;
            categoryStats[item.category].totalValue += item.quantity * item.costPerUnit;
            
            if (item.quantity <= 0) {
                // Out of stock
            } else if (item.quantity <= item.threshold) {
                categoryStats[item.category].critical++;
            } else if (item.quantity <= item.threshold * 1.5) {
                categoryStats[item.category].warning++;
            } else {
                categoryStats[item.category].healthy++;
            }
        });

        Object.keys(categoryStats).forEach(category => {
            const stats = categoryStats[category];
            const healthPercent = (stats.healthy / stats.total * 100).toFixed(1);
            console.log(`   📂 ${category}: ${stats.total} items, ${stats.healthy} healthy (${healthPercent}%), Value: $${stats.totalValue.toFixed(2)}`);
        });

        // STEP 3: Critical Items Requiring Immediate Attention
        console.log('\n🚨 STEP 3: Critical Items Requiring Immediate Attention');
        console.log('─'.repeat(50));

        const criticalItems = allInventory.filter(item => item.quantity <= item.threshold);
        const outOfStockItems = allInventory.filter(item => item.quantity <= 0);

        if (outOfStockItems.length > 0) {
            console.log(`   ❌ OUT OF STOCK (${outOfStockItems.length} items):`);
            outOfStockItems.forEach(item => {
                console.log(`     - ${item.name}: ${item.quantity} ${item.unit} (URGENT RESTOCK NEEDED)`);
            });
        }

        if (criticalItems.length > 0) {
            console.log(`   🚨 CRITICAL STOCK (${criticalItems.length} items):`);
            criticalItems.forEach(item => {
                const daysLeft = Math.floor(item.quantity / (item.threshold * 0.1)); // Rough estimate
                console.log(`     - ${item.name}: ${item.quantity.toFixed(4)} ${item.unit} (threshold: ${item.threshold}, ~${daysLeft} days left)`);
            });
        }

        if (criticalItems.length === 0 && outOfStockItems.length === 0) {
            console.log('   ✅ No critical stock issues detected!');
        }

        // STEP 4: Top 10 Most Used Ingredients (by recent activity)
        console.log('\n📈 STEP 4: Most Active Ingredients (Recent Usage)');
        console.log('─'.repeat(50));

        const ingredientUsage = [];
        allInventory.forEach(item => {
            if (item.history && item.history.length > 0) {
                const recentDeductions = item.history
                    .filter(h => h.action === 'deduct')
                    .slice(-10); // Last 10 deductions
                
                const totalUsed = recentDeductions.reduce((sum, h) => sum + Math.abs(h.changeAmount), 0);
                
                if (totalUsed > 0) {
                    ingredientUsage.push({
                        name: item.name,
                        unit: item.unit,
                        totalUsed: totalUsed,
                        transactions: recentDeductions.length,
                        currentStock: item.quantity,
                        category: item.category
                    });
                }
            }
        });

        ingredientUsage.sort((a, b) => b.totalUsed - a.totalUsed);
        
        console.log('   📊 Top 10 Most Used Ingredients:');
        ingredientUsage.slice(0, 10).forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.name}: ${item.totalUsed.toFixed(4)} ${item.unit} used (${item.transactions} transactions)`);
        });

        // STEP 5: Production Capacity Analysis
        console.log('\n🏭 STEP 5: Current Production Capacity');
        console.log('─'.repeat(50));

        const popularCupcakes = ['Vanilla Cupcake', 'Chocolate Cupcake', 'Red Velvet Cupcake'];
        
        console.log('   📊 Maximum production capacity for popular cupcakes:');
        
        for (const cupcakeType of popularCupcakes) {
            const recipe = recipeMapping[cupcakeType];
            if (recipe) {
                let minCapacity = Infinity;
                let limitingIngredient = '';
                
                for (const ingredient of recipe.ingredients) {
                    const inventoryItem = allInventory.find(item => item.name === ingredient.name);
                    if (inventoryItem) {
                        const requiredPerCupcake = ingredient.quantity * ingredient.conversionFactor;
                        const maxPossible = Math.floor(inventoryItem.quantity / requiredPerCupcake);
                        
                        if (maxPossible < minCapacity) {
                            minCapacity = maxPossible;
                            limitingIngredient = ingredient.name;
                        }
                    }
                }
                
                console.log(`     ${cupcakeType}: ~${minCapacity} cupcakes (limited by ${limitingIngredient})`);
            }
        }

        // STEP 6: Restock Recommendations
        console.log('\n📋 STEP 6: Smart Restock Recommendations');
        console.log('─'.repeat(50));

        const restockRecommendations = [];
        
        allInventory.forEach(item => {
            if (item.quantity <= item.threshold * 1.5) { // 150% of threshold
                const urgency = item.quantity <= item.threshold ? 'HIGH' : 'MEDIUM';
                const recommendedOrder = Math.max(item.threshold * 3, item.quantity * 2); // Order 3x threshold or 2x current
                const estimatedCost = recommendedOrder * item.costPerUnit;
                
                restockRecommendations.push({
                    name: item.name,
                    current: item.quantity,
                    threshold: item.threshold,
                    recommended: recommendedOrder,
                    cost: estimatedCost,
                    urgency: urgency,
                    supplier: item.supplier,
                    unit: item.unit
                });
            }
        });

        restockRecommendations.sort((a, b) => {
            if (a.urgency === 'HIGH' && b.urgency !== 'HIGH') return -1;
            if (b.urgency === 'HIGH' && a.urgency !== 'HIGH') return 1;
            return b.cost - a.cost; // Sort by cost within same urgency
        });

        if (restockRecommendations.length > 0) {
            console.log(`   📦 ${restockRecommendations.length} items need restocking:`);
            
            let totalRestockCost = 0;
            restockRecommendations.forEach((item, index) => {
                const urgencyIcon = item.urgency === 'HIGH' ? '🚨' : '⚠️';
                console.log(`     ${urgencyIcon} ${item.name}: Order ${item.recommended.toFixed(2)} ${item.unit} (~$${item.cost.toFixed(2)}) from ${item.supplier}`);
                totalRestockCost += item.cost;
            });
            
            console.log(`   💰 Total estimated restock cost: $${totalRestockCost.toFixed(2)}`);
        } else {
            console.log('   ✅ No immediate restocking needed!');
        }

        // STEP 7: Inventory Value Analysis
        console.log('\n💰 STEP 7: Inventory Value Analysis');
        console.log('─'.repeat(50));

        let totalInventoryValue = 0;
        const valueByCategory = {};

        allInventory.forEach(item => {
            const itemValue = item.quantity * item.costPerUnit;
            totalInventoryValue += itemValue;
            
            if (!valueByCategory[item.category]) {
                valueByCategory[item.category] = 0;
            }
            valueByCategory[item.category] += itemValue;
        });

        console.log(`   💰 Total Inventory Value: $${totalInventoryValue.toFixed(2)}`);
        console.log('   📊 Value by Category:');
        
        Object.keys(valueByCategory)
            .sort((a, b) => valueByCategory[b] - valueByCategory[a])
            .forEach(category => {
                const percentage = (valueByCategory[category] / totalInventoryValue * 100).toFixed(1);
                console.log(`     ${category}: $${valueByCategory[category].toFixed(2)} (${percentage}%)`);
            });

        console.log('\n✅ INVENTORY MONITORING DASHBOARD COMPLETE');
        console.log('═'.repeat(80));

        // Generate summary report
        const summary = {
            timestamp: new Date().toISOString(),
            totalItems: healthStats.total,
            healthyItems: healthStats.healthy,
            criticalItems: healthStats.critical,
            totalValue: totalInventoryValue,
            restockNeeded: restockRecommendations.length,
            estimatedRestockCost: restockRecommendations.reduce((sum, item) => sum + item.cost, 0)
        };

        console.log('\n📋 EXECUTIVE SUMMARY:');
        console.log(`   📦 Inventory Health: ${healthStats.healthy}/${healthStats.total} items healthy (${(healthStats.healthy/healthStats.total*100).toFixed(1)}%)`);
        console.log(`   💰 Total Inventory Value: $${totalInventoryValue.toFixed(2)}`);
        console.log(`   🚨 Items Needing Attention: ${healthStats.critical + healthStats.warning}`);
        console.log(`   📋 Restock Recommendations: ${restockRecommendations.length} items ($${summary.estimatedRestockCost.toFixed(2)})`);

        return summary;

    } catch (error) {
        console.error('❌ Error during inventory monitoring:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the dashboard if this file is executed directly
if (require.main === module) {
    inventoryMonitoringDashboard();
}

module.exports = { inventoryMonitoringDashboard };
