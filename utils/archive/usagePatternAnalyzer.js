const InventoryItem = require('../models/InventoryItem');
const Order = require('../models/Order');

/**
 * Usage Pattern Analyzer
 * Analyzes ingredient usage patterns to optimize inventory purchasing
 */

class UsagePatternAnalyzer {
    constructor() {
        this.analysisTypes = {
            DAILY: 'daily',
            WEEKLY: 'weekly',
            MONTHLY: 'monthly',
            SEASONAL: 'seasonal'
        };
    }

    /**
     * Analyze usage patterns for all ingredients
     */
    async analyzeAllIngredients(timeframe = 30) {
        try {
            const allItems = await InventoryItem.find().sort({ name: 1 });
            const analysis = {
                timeframe: timeframe,
                timestamp: new Date().toISOString(),
                ingredients: [],
                summary: {
                    totalIngredients: allItems.length,
                    activeIngredients: 0,
                    highUsageIngredients: 0,
                    lowUsageIngredients: 0,
                    totalUsageValue: 0
                }
            };

            for (const item of allItems) {
                const ingredientAnalysis = await this.analyzeIngredient(item, timeframe);
                analysis.ingredients.push(ingredientAnalysis);

                // Update summary
                if (ingredientAnalysis.usage.totalUsed > 0) {
                    analysis.summary.activeIngredients++;
                    analysis.summary.totalUsageValue += ingredientAnalysis.usage.totalValue;

                    if (ingredientAnalysis.usage.averageDaily > item.threshold * 0.1) {
                        analysis.summary.highUsageIngredients++;
                    } else {
                        analysis.summary.lowUsageIngredients++;
                    }
                }
            }

            // Sort by usage value (highest first)
            analysis.ingredients.sort((a, b) => b.usage.totalValue - a.usage.totalValue);

            return analysis;
        } catch (error) {
            console.error('Error analyzing usage patterns:', error);
            throw error;
        }
    }

    /**
     * Analyze usage pattern for a specific ingredient
     */
    async analyzeIngredient(item, timeframe = 30) {
        const cutoffDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
        
        // Get usage history within timeframe
        const usageHistory = item.history ? item.history.filter(h => 
            h.action === 'deduct' && h.date >= cutoffDate
        ) : [];

        const usage = this.calculateUsageMetrics(usageHistory, timeframe, item.costPerUnit);
        const trends = this.identifyTrends(usageHistory);
        const predictions = this.generatePredictions(usage, trends, item);
        const recommendations = this.generateRecommendations(usage, predictions, item);

        return {
            id: item._id,
            name: item.name,
            category: item.category,
            currentStock: item.quantity,
            threshold: item.threshold,
            unit: item.unit,
            costPerUnit: item.costPerUnit,
            usage: usage,
            trends: trends,
            predictions: predictions,
            recommendations: recommendations
        };
    }

    /**
     * Calculate usage metrics
     */
    calculateUsageMetrics(usageHistory, timeframe, costPerUnit) {
        const totalUsed = usageHistory.reduce((sum, h) => sum + Math.abs(h.changeAmount), 0);
        const totalTransactions = usageHistory.length;
        const averageDaily = totalUsed / timeframe;
        const averagePerTransaction = totalTransactions > 0 ? totalUsed / totalTransactions : 0;
        const totalValue = totalUsed * costPerUnit;

        // Calculate usage by day of week
        const usageByDay = {};
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        daysOfWeek.forEach(day => usageByDay[day] = 0);
        
        usageHistory.forEach(h => {
            const dayOfWeek = daysOfWeek[h.date.getDay()];
            usageByDay[dayOfWeek] += Math.abs(h.changeAmount);
        });

        // Find peak usage days
        const peakDay = Object.keys(usageByDay).reduce((a, b) => 
            usageByDay[a] > usageByDay[b] ? a : b
        );

        return {
            totalUsed: totalUsed,
            totalTransactions: totalTransactions,
            averageDaily: averageDaily,
            averagePerTransaction: averagePerTransaction,
            totalValue: totalValue,
            usageByDay: usageByDay,
            peakDay: peakDay,
            peakDayUsage: usageByDay[peakDay]
        };
    }

    /**
     * Identify usage trends
     */
    identifyTrends(usageHistory) {
        if (usageHistory.length < 7) {
            return {
                trend: 'insufficient_data',
                direction: 'unknown',
                confidence: 0
            };
        }

        // Split history into two halves and compare
        const midpoint = Math.floor(usageHistory.length / 2);
        const firstHalf = usageHistory.slice(0, midpoint);
        const secondHalf = usageHistory.slice(midpoint);

        const firstHalfAvg = firstHalf.reduce((sum, h) => sum + Math.abs(h.changeAmount), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, h) => sum + Math.abs(h.changeAmount), 0) / secondHalf.length;

        const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        let trend, direction;
        if (Math.abs(changePercent) < 10) {
            trend = 'stable';
            direction = 'steady';
        } else if (changePercent > 10) {
            trend = 'increasing';
            direction = 'up';
        } else {
            trend = 'decreasing';
            direction = 'down';
        }

        return {
            trend: trend,
            direction: direction,
            changePercent: changePercent,
            confidence: Math.min(usageHistory.length / 30, 1) // Higher confidence with more data
        };
    }

    /**
     * Generate usage predictions
     */
    generatePredictions(usage, trends, item) {
        const baseDaily = usage.averageDaily;
        let adjustedDaily = baseDaily;

        // Adjust based on trends
        if (trends.trend === 'increasing') {
            adjustedDaily = baseDaily * (1 + Math.abs(trends.changePercent) / 100);
        } else if (trends.trend === 'decreasing') {
            adjustedDaily = baseDaily * (1 - Math.abs(trends.changePercent) / 100);
        }

        const predictions = {
            nextWeek: adjustedDaily * 7,
            nextMonth: adjustedDaily * 30,
            nextQuarter: adjustedDaily * 90,
            daysUntilThreshold: item.quantity > 0 ? Math.floor((item.quantity - item.threshold) / adjustedDaily) : 0,
            daysUntilEmpty: item.quantity > 0 ? Math.floor(item.quantity / adjustedDaily) : 0
        };

        return predictions;
    }

    /**
     * Generate purchasing recommendations
     */
    generateRecommendations(usage, predictions, item) {
        const recommendations = [];

        // Reorder point recommendation
        const safetyStock = usage.averageDaily * 7; // 1 week safety stock
        const reorderPoint = item.threshold + safetyStock;
        
        if (item.quantity <= reorderPoint) {
            recommendations.push({
                type: 'reorder',
                priority: 'high',
                message: `Reorder now - stock below reorder point (${reorderPoint.toFixed(2)} ${item.unit})`,
                suggestedQuantity: Math.max(usage.averageDaily * 30, item.threshold * 2),
                estimatedCost: (Math.max(usage.averageDaily * 30, item.threshold * 2)) * item.costPerUnit
            });
        }

        // Economic order quantity suggestion
        const monthlyUsage = usage.averageDaily * 30;
        const economicOrderQty = Math.max(monthlyUsage, item.threshold * 2);
        
        recommendations.push({
            type: 'economic_order',
            priority: 'medium',
            message: `Optimal order quantity based on usage patterns`,
            suggestedQuantity: economicOrderQty,
            estimatedCost: economicOrderQty * item.costPerUnit,
            frequency: 'monthly'
        });

        // Bulk purchase recommendation for high-usage items
        if (usage.totalValue > 100) { // High-value usage
            const bulkQuantity = usage.averageDaily * 60; // 2 months supply
            recommendations.push({
                type: 'bulk_purchase',
                priority: 'low',
                message: `Consider bulk purchase for cost savings`,
                suggestedQuantity: bulkQuantity,
                estimatedCost: bulkQuantity * item.costPerUnit,
                potentialSavings: bulkQuantity * item.costPerUnit * 0.1 // Assume 10% bulk discount
            });
        }

        return recommendations;
    }

    /**
     * Generate comprehensive usage report
     */
    async generateUsageReport(timeframe = 30) {
        const analysis = await this.analyzeAllIngredients(timeframe);
        
        const report = {
            ...analysis,
            insights: this.generateInsights(analysis),
            actionItems: this.generateActionItems(analysis),
            costOptimization: this.analyzeCostOptimization(analysis)
        };

        return report;
    }

    /**
     * Generate business insights
     */
    generateInsights(analysis) {
        const insights = [];

        // Top usage ingredients
        const topIngredients = analysis.ingredients
            .filter(i => i.usage.totalUsed > 0)
            .slice(0, 5);

        insights.push({
            type: 'top_usage',
            title: 'Top 5 Most Used Ingredients',
            data: topIngredients.map(i => ({
                name: i.name,
                usage: i.usage.totalUsed,
                value: i.usage.totalValue,
                unit: i.unit
            }))
        });

        // Usage trends
        const increasingTrends = analysis.ingredients.filter(i => 
            i.trends.trend === 'increasing' && i.trends.confidence > 0.5
        );

        if (increasingTrends.length > 0) {
            insights.push({
                type: 'increasing_trends',
                title: 'Ingredients with Increasing Usage',
                data: increasingTrends.map(i => ({
                    name: i.name,
                    changePercent: i.trends.changePercent,
                    confidence: i.trends.confidence
                }))
            });
        }

        // Cost analysis
        const totalUsageValue = analysis.summary.totalUsageValue;
        const avgCostPerIngredient = totalUsageValue / analysis.summary.activeIngredients;

        insights.push({
            type: 'cost_analysis',
            title: 'Cost Analysis',
            data: {
                totalUsageValue: totalUsageValue,
                averageCostPerIngredient: avgCostPerIngredient,
                highValueIngredients: analysis.ingredients.filter(i => i.usage.totalValue > avgCostPerIngredient * 2).length
            }
        });

        return insights;
    }

    /**
     * Generate action items
     */
    generateActionItems(analysis) {
        const actionItems = [];

        // Critical reorders
        const criticalReorders = analysis.ingredients.filter(i => 
            i.recommendations.some(r => r.type === 'reorder' && r.priority === 'high')
        );

        if (criticalReorders.length > 0) {
            actionItems.push({
                priority: 'high',
                action: 'Immediate Reorders Required',
                items: criticalReorders.map(i => i.name),
                estimatedCost: criticalReorders.reduce((sum, i) => 
                    sum + i.recommendations.find(r => r.type === 'reorder').estimatedCost, 0
                )
            });
        }

        // Bulk purchase opportunities
        const bulkOpportunities = analysis.ingredients.filter(i => 
            i.recommendations.some(r => r.type === 'bulk_purchase')
        );

        if (bulkOpportunities.length > 0) {
            actionItems.push({
                priority: 'medium',
                action: 'Bulk Purchase Opportunities',
                items: bulkOpportunities.map(i => i.name),
                potentialSavings: bulkOpportunities.reduce((sum, i) => 
                    sum + (i.recommendations.find(r => r.type === 'bulk_purchase').potentialSavings || 0), 0
                )
            });
        }

        return actionItems;
    }

    /**
     * Analyze cost optimization opportunities
     */
    analyzeCostOptimization(analysis) {
        const optimization = {
            totalCurrentValue: analysis.summary.totalUsageValue,
            potentialSavings: 0,
            recommendations: []
        };

        // Calculate potential bulk purchase savings
        const bulkSavings = analysis.ingredients
            .filter(i => i.recommendations.some(r => r.type === 'bulk_purchase'))
            .reduce((sum, i) => {
                const bulkRec = i.recommendations.find(r => r.type === 'bulk_purchase');
                return sum + (bulkRec.potentialSavings || 0);
            }, 0);

        optimization.potentialSavings += bulkSavings;

        if (bulkSavings > 0) {
            optimization.recommendations.push({
                type: 'bulk_purchasing',
                description: 'Implement bulk purchasing for high-usage ingredients',
                potentialSavings: bulkSavings,
                implementation: 'Negotiate bulk discounts with suppliers for ingredients with monthly usage > $100'
            });
        }

        // Inventory optimization
        const overStockedItems = analysis.ingredients.filter(i => 
            i.currentStock > i.predictions.nextMonth * 2
        );

        if (overStockedItems.length > 0) {
            optimization.recommendations.push({
                type: 'inventory_optimization',
                description: 'Reduce overstocking to free up capital',
                affectedItems: overStockedItems.length,
                implementation: 'Adjust reorder quantities for slow-moving items'
            });
        }

        return optimization;
    }
}

module.exports = UsagePatternAnalyzer;
