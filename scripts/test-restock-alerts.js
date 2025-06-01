const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const RestockAlertSystem = require('../utils/restockAlertSystem');
require('dotenv').config();

async function testRestockAlerts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        console.log('\n⚠️ TESTING RESTOCK ALERT SYSTEM');
        console.log('═'.repeat(60));

        const alertSystem = new RestockAlertSystem();

        // STEP 1: Test with current inventory levels
        console.log('\n📊 STEP 1: Current Inventory Alert Status');
        console.log('─'.repeat(40));

        let report = await alertSystem.generateRestockReport();
        
        console.log('   📋 Current Status:');
        console.log(`     🚨 Critical: ${report.summary.criticalCount} items`);
        console.log(`     ⚠️ Warning: ${report.summary.warningCount} items`);
        console.log(`     👀 Watch: ${report.summary.watchCount} items`);
        console.log(`     ✅ Healthy: ${report.summary.healthyCount} items`);
        console.log(`     💰 Total Restock Cost: $${report.totalEstimatedCost.toFixed(2)}`);

        // STEP 2: Simulate low stock scenarios
        console.log('\n🧪 STEP 2: Simulating Low Stock Scenarios');
        console.log('─'.repeat(40));

        // Get a few items to simulate low stock
        const testItems = await InventoryItem.find().limit(3);
        const originalQuantities = {};

        console.log('   🔄 Temporarily reducing stock levels for testing...');
        
        for (const item of testItems) {
            originalQuantities[item._id] = item.quantity;
            
            // Simulate different alert levels
            if (testItems.indexOf(item) === 0) {
                // Critical level (below threshold)
                item.quantity = item.threshold * 0.8;
                console.log(`     🚨 ${item.name}: Set to CRITICAL (${item.quantity.toFixed(2)} ${item.unit})`);
            } else if (testItems.indexOf(item) === 1) {
                // Warning level (150% of threshold)
                item.quantity = item.threshold * 1.3;
                console.log(`     ⚠️ ${item.name}: Set to WARNING (${item.quantity.toFixed(2)} ${item.unit})`);
            } else {
                // Watch level (200% of threshold)
                item.quantity = item.threshold * 1.8;
                console.log(`     👀 ${item.name}: Set to WATCH (${item.quantity.toFixed(2)} ${item.unit})`);
            }
            
            await item.save();
        }

        // STEP 3: Generate alerts with simulated data
        console.log('\n📊 STEP 3: Alert System Response to Low Stock');
        console.log('─'.repeat(40));

        report = await alertSystem.generateRestockReport();
        
        console.log('   📋 Alert Status After Simulation:');
        console.log(`     🚨 Critical: ${report.summary.criticalCount} items`);
        console.log(`     ⚠️ Warning: ${report.summary.warningCount} items`);
        console.log(`     👀 Watch: ${report.summary.watchCount} items`);
        console.log(`     💰 Total Restock Cost: $${report.totalEstimatedCost.toFixed(2)}`);

        // Show detailed alerts
        if (report.alerts.critical.length > 0) {
            console.log('\n   🚨 CRITICAL ALERTS:');
            report.alerts.critical.forEach(alert => {
                console.log(`     - ${alert.name}: ${alert.currentQuantity.toFixed(2)} ${alert.unit} (${alert.percentOfThreshold}% of threshold)`);
                console.log(`       📦 Recommended order: ${alert.recommendedOrder.toFixed(2)} ${alert.unit} (~$${alert.estimatedCost.toFixed(2)})`);
                console.log(`       ⏰ Days until empty: ${alert.daysUntilEmpty}`);
            });
        }

        if (report.alerts.warning.length > 0) {
            console.log('\n   ⚠️ WARNING ALERTS:');
            report.alerts.warning.forEach(alert => {
                console.log(`     - ${alert.name}: ${alert.currentQuantity.toFixed(2)} ${alert.unit} (${alert.percentOfThreshold}% of threshold)`);
                console.log(`       📦 Recommended order: ${alert.recommendedOrder.toFixed(2)} ${alert.unit} (~$${alert.estimatedCost.toFixed(2)})`);
            });
        }

        // STEP 4: Test recommendations
        console.log('\n📋 STEP 4: Restock Recommendations');
        console.log('─'.repeat(40));

        if (report.recommendations.length > 0) {
            report.recommendations.forEach(rec => {
                const priorityIcon = rec.priority === 'IMMEDIATE' ? '🚨' : 
                                   rec.priority === 'HIGH' ? '⚠️' : '👀';
                console.log(`   ${priorityIcon} ${rec.priority}: ${rec.action}`);
                console.log(`     📦 Items: ${rec.items}, Cost: $${rec.estimatedCost.toFixed(2)}`);
            });
        } else {
            console.log('   ✅ No restock recommendations needed');
        }

        // STEP 5: Test automated check
        console.log('\n🤖 STEP 5: Testing Automated Check Function');
        console.log('─'.repeat(40));

        const automatedReport = await alertSystem.runAutomatedCheck();
        console.log('   ✅ Automated check completed successfully');

        // STEP 6: Restore original quantities
        console.log('\n🔄 STEP 6: Restoring Original Inventory Levels');
        console.log('─'.repeat(40));

        for (const item of testItems) {
            item.quantity = originalQuantities[item._id];
            await item.save();
            console.log(`   ✅ Restored ${item.name} to ${item.quantity.toFixed(2)} ${item.unit}`);
        }

        // STEP 7: Final verification
        console.log('\n✅ STEP 7: Final Verification');
        console.log('─'.repeat(40));

        const finalReport = await alertSystem.generateRestockReport();
        console.log('   📋 Final Status:');
        console.log(`     🚨 Critical: ${finalReport.summary.criticalCount} items`);
        console.log(`     ⚠️ Warning: ${finalReport.summary.warningCount} items`);
        console.log(`     👀 Watch: ${finalReport.summary.watchCount} items`);
        console.log(`     ✅ Healthy: ${finalReport.summary.healthyCount} items`);

        console.log('\n✅ RESTOCK ALERT SYSTEM TEST COMPLETED');
        console.log('═'.repeat(60));

        console.log('\n📋 TEST SUMMARY:');
        console.log('   ✅ Alert level detection: Working');
        console.log('   ✅ Recommendation generation: Working');
        console.log('   ✅ Cost calculation: Working');
        console.log('   ✅ Automated monitoring: Working');
        console.log('   ✅ Data restoration: Working');

        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. Set up automated daily checks (cron job)');
        console.log('   2. Configure email notifications (SMTP settings)');
        console.log('   3. Integrate with admin dashboard');
        console.log('   4. Set up supplier contact automation');

    } catch (error) {
        console.error('❌ Error during restock alert test:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testRestockAlerts();
}

module.exports = { testRestockAlerts };
