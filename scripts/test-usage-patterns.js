const mongoose = require('mongoose');
const UsagePatternAnalyzer = require('../utils/usagePatternAnalyzer');
require('dotenv').config();

async function testUsagePatterns() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        console.log('\n📈 TESTING USAGE PATTERN ANALYZER');
        console.log('═'.repeat(60));

        const analyzer = new UsagePatternAnalyzer();

        // STEP 1: Generate comprehensive usage report
        console.log('\n📊 STEP 1: Comprehensive Usage Analysis');
        console.log('─'.repeat(40));

        const report = await analyzer.generateUsageReport(30);
        
        console.log('   📋 Analysis Summary:');
        console.log(`     📦 Total Ingredients: ${report.summary.totalIngredients}`);
        console.log(`     🔄 Active Ingredients: ${report.summary.activeIngredients}`);
        console.log(`     📈 High Usage Items: ${report.summary.highUsageIngredients}`);
        console.log(`     📉 Low Usage Items: ${report.summary.lowUsageIngredients}`);
        console.log(`     💰 Total Usage Value: $${report.summary.totalUsageValue.toFixed(2)}`);

        // STEP 2: Show top usage ingredients
        console.log('\n🏆 STEP 2: Top Usage Ingredients');
        console.log('─'.repeat(40));

        const topIngredients = report.ingredients
            .filter(i => i.usage.totalUsed > 0)
            .slice(0, 10);

        console.log('   📊 Top 10 Most Used Ingredients (by value):');
        topIngredients.forEach((ingredient, index) => {
            console.log(`     ${index + 1}. ${ingredient.name}:`);
            console.log(`        📦 Used: ${ingredient.usage.totalUsed.toFixed(4)} ${ingredient.unit}`);
            console.log(`        💰 Value: $${ingredient.usage.totalValue.toFixed(2)}`);
            console.log(`        📈 Daily Avg: ${ingredient.usage.averageDaily.toFixed(4)} ${ingredient.unit}`);
            console.log(`        📅 Peak Day: ${ingredient.usage.peakDay} (${ingredient.usage.peakDayUsage.toFixed(4)} ${ingredient.unit})`);
        });

        // STEP 3: Show usage trends
        console.log('\n📈 STEP 3: Usage Trends Analysis');
        console.log('─'.repeat(40));

        const trendingIngredients = report.ingredients.filter(i => 
            i.trends.trend !== 'insufficient_data' && i.usage.totalUsed > 0
        );

        console.log('   📊 Ingredients with Clear Trends:');
        trendingIngredients.slice(0, 8).forEach(ingredient => {
            const trendIcon = ingredient.trends.direction === 'up' ? '📈' : 
                             ingredient.trends.direction === 'down' ? '📉' : '➡️';
            const confidencePercent = (ingredient.trends.confidence * 100).toFixed(0);
            
            console.log(`     ${trendIcon} ${ingredient.name}: ${ingredient.trends.trend} (${ingredient.trends.changePercent?.toFixed(1)}%, ${confidencePercent}% confidence)`);
        });

        // STEP 4: Show predictions
        console.log('\n🔮 STEP 4: Usage Predictions');
        console.log('─'.repeat(40));

        const predictableIngredients = topIngredients.slice(0, 5);
        
        console.log('   📊 Predictions for Top 5 Ingredients:');
        predictableIngredients.forEach(ingredient => {
            console.log(`     📦 ${ingredient.name}:`);
            console.log(`        📅 Next Week: ${ingredient.predictions.nextWeek.toFixed(4)} ${ingredient.unit}`);
            console.log(`        📅 Next Month: ${ingredient.predictions.nextMonth.toFixed(4)} ${ingredient.unit}`);
            console.log(`        ⏰ Days until threshold: ${ingredient.predictions.daysUntilThreshold}`);
            console.log(`        ⏰ Days until empty: ${ingredient.predictions.daysUntilEmpty}`);
        });

        // STEP 5: Show recommendations
        console.log('\n💡 STEP 5: Purchasing Recommendations');
        console.log('─'.repeat(40));

        const ingredientsWithRecommendations = report.ingredients.filter(i => 
            i.recommendations && i.recommendations.length > 0
        );

        console.log(`   📋 ${ingredientsWithRecommendations.length} ingredients have recommendations:`);
        
        ingredientsWithRecommendations.slice(0, 8).forEach(ingredient => {
            console.log(`\n     📦 ${ingredient.name}:`);
            ingredient.recommendations.forEach(rec => {
                const priorityIcon = rec.priority === 'high' ? '🚨' : 
                                   rec.priority === 'medium' ? '⚠️' : '💡';
                console.log(`       ${priorityIcon} ${rec.type.toUpperCase()}: ${rec.message}`);
                console.log(`         📦 Quantity: ${rec.suggestedQuantity.toFixed(2)} ${ingredient.unit}`);
                console.log(`         💰 Cost: $${rec.estimatedCost.toFixed(2)}`);
                if (rec.potentialSavings) {
                    console.log(`         💵 Potential Savings: $${rec.potentialSavings.toFixed(2)}`);
                }
            });
        });

        // STEP 6: Show business insights
        console.log('\n🎯 STEP 6: Business Insights');
        console.log('─'.repeat(40));

        if (report.insights && report.insights.length > 0) {
            report.insights.forEach(insight => {
                console.log(`\n   📊 ${insight.title}:`);
                
                if (insight.type === 'top_usage') {
                    insight.data.forEach((item, index) => {
                        console.log(`     ${index + 1}. ${item.name}: ${item.usage.toFixed(4)} ${item.unit} ($${item.value.toFixed(2)})`);
                    });
                } else if (insight.type === 'increasing_trends') {
                    insight.data.forEach(item => {
                        console.log(`     📈 ${item.name}: +${item.changePercent.toFixed(1)}% (${(item.confidence * 100).toFixed(0)}% confidence)`);
                    });
                } else if (insight.type === 'cost_analysis') {
                    console.log(`     💰 Total Usage Value: $${insight.data.totalUsageValue.toFixed(2)}`);
                    console.log(`     📊 Average per Ingredient: $${insight.data.averageCostPerIngredient.toFixed(2)}`);
                    console.log(`     🔥 High-Value Ingredients: ${insight.data.highValueIngredients}`);
                }
            });
        }

        // STEP 7: Show action items
        console.log('\n📋 STEP 7: Action Items');
        console.log('─'.repeat(40));

        if (report.actionItems && report.actionItems.length > 0) {
            report.actionItems.forEach(action => {
                const priorityIcon = action.priority === 'high' ? '🚨' : 
                                   action.priority === 'medium' ? '⚠️' : '💡';
                console.log(`\n   ${priorityIcon} ${action.action}:`);
                console.log(`     📦 Items: ${action.items.join(', ')}`);
                if (action.estimatedCost) {
                    console.log(`     💰 Estimated Cost: $${action.estimatedCost.toFixed(2)}`);
                }
                if (action.potentialSavings) {
                    console.log(`     💵 Potential Savings: $${action.potentialSavings.toFixed(2)}`);
                }
            });
        } else {
            console.log('   ✅ No immediate action items required');
        }

        // STEP 8: Show cost optimization
        console.log('\n💰 STEP 8: Cost Optimization Analysis');
        console.log('─'.repeat(40));

        if (report.costOptimization) {
            console.log(`   💰 Current Usage Value: $${report.costOptimization.totalCurrentValue.toFixed(2)}`);
            console.log(`   💵 Potential Savings: $${report.costOptimization.potentialSavings.toFixed(2)}`);
            
            if (report.costOptimization.recommendations.length > 0) {
                console.log('\n   📋 Optimization Recommendations:');
                report.costOptimization.recommendations.forEach(rec => {
                    console.log(`     💡 ${rec.type.toUpperCase()}: ${rec.description}`);
                    if (rec.potentialSavings) {
                        console.log(`       💵 Savings: $${rec.potentialSavings.toFixed(2)}`);
                    }
                    if (rec.affectedItems) {
                        console.log(`       📦 Affected Items: ${rec.affectedItems}`);
                    }
                    console.log(`       🔧 Implementation: ${rec.implementation}`);
                });
            }
        }

        console.log('\n✅ USAGE PATTERN ANALYSIS COMPLETED');
        console.log('═'.repeat(60));

        // Generate executive summary
        const executiveSummary = {
            totalIngredients: report.summary.totalIngredients,
            activeIngredients: report.summary.activeIngredients,
            totalUsageValue: report.summary.totalUsageValue,
            potentialSavings: report.costOptimization?.potentialSavings || 0,
            actionItemsCount: report.actionItems?.length || 0,
            topIngredient: topIngredients[0]?.name || 'None',
            topIngredientValue: topIngredients[0]?.usage.totalValue || 0
        };

        console.log('\n📋 EXECUTIVE SUMMARY:');
        console.log(`   📦 Active Ingredients: ${executiveSummary.activeIngredients}/${executiveSummary.totalIngredients}`);
        console.log(`   💰 Total Usage Value: $${executiveSummary.totalUsageValue.toFixed(2)}`);
        console.log(`   💵 Potential Savings: $${executiveSummary.potentialSavings.toFixed(2)}`);
        console.log(`   📋 Action Items: ${executiveSummary.actionItemsCount}`);
        console.log(`   🏆 Top Ingredient: ${executiveSummary.topIngredient} ($${executiveSummary.topIngredientValue.toFixed(2)})`);

        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. Implement recommended purchasing schedules');
        console.log('   2. Negotiate bulk discounts for high-usage items');
        console.log('   3. Set up automated reorder points');
        console.log('   4. Monitor trends monthly for adjustments');
        console.log('   5. Optimize inventory levels based on predictions');

        return report;

    } catch (error) {
        console.error('❌ Error during usage pattern analysis:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testUsagePatterns();
}

module.exports = { testUsagePatterns };
