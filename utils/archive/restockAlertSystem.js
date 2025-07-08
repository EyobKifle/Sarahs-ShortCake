const InventoryItem = require('../models/InventoryItem');
const nodemailer = require('nodemailer');

/**
 * Restock Alert System
 * Monitors inventory levels and sends alerts when items need restocking
 */

class RestockAlertSystem {
    constructor() {
        this.alertLevels = {
            CRITICAL: 'critical',    // At or below threshold
            WARNING: 'warning',      // 150% of threshold
            WATCH: 'watch'          // 200% of threshold
        };
        
        this.emailConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'admin@sarahsshortcakes.com',
                pass: process.env.SMTP_PASS || 'your-email-password'
            }
        };
    }

    /**
     * Check all inventory items and generate alerts
     */
    async checkInventoryLevels() {
        try {
            const allItems = await InventoryItem.find().sort({ category: 1, name: 1 });
            const alerts = {
                critical: [],
                warning: [],
                watch: [],
                summary: {
                    totalItems: allItems.length,
                    criticalCount: 0,
                    warningCount: 0,
                    watchCount: 0,
                    healthyCount: 0
                }
            };

            allItems.forEach(item => {
                const alertLevel = this.getAlertLevel(item);
                
                switch (alertLevel) {
                    case this.alertLevels.CRITICAL:
                        alerts.critical.push(this.createAlert(item, 'CRITICAL'));
                        alerts.summary.criticalCount++;
                        break;
                    case this.alertLevels.WARNING:
                        alerts.warning.push(this.createAlert(item, 'WARNING'));
                        alerts.summary.warningCount++;
                        break;
                    case this.alertLevels.WATCH:
                        alerts.watch.push(this.createAlert(item, 'WATCH'));
                        alerts.summary.watchCount++;
                        break;
                    default:
                        alerts.summary.healthyCount++;
                }
            });

            return alerts;
        } catch (error) {
            console.error('Error checking inventory levels:', error);
            throw error;
        }
    }

    /**
     * Determine alert level for an inventory item
     */
    getAlertLevel(item) {
        if (item.quantity <= item.threshold) {
            return this.alertLevels.CRITICAL;
        } else if (item.quantity <= item.threshold * 1.5) {
            return this.alertLevels.WARNING;
        } else if (item.quantity <= item.threshold * 2) {
            return this.alertLevels.WATCH;
        }
        return null;
    }

    /**
     * Create alert object for an inventory item
     */
    createAlert(item, level) {
        const daysUntilEmpty = this.estimateDaysUntilEmpty(item);
        const recommendedOrderQuantity = this.calculateRecommendedOrder(item);
        const estimatedCost = recommendedOrderQuantity * item.costPerUnit;

        return {
            id: item._id,
            name: item.name,
            category: item.category,
            currentQuantity: item.quantity,
            threshold: item.threshold,
            unit: item.unit,
            level: level,
            percentOfThreshold: (item.quantity / item.threshold * 100).toFixed(1),
            daysUntilEmpty: daysUntilEmpty,
            recommendedOrder: recommendedOrderQuantity,
            estimatedCost: estimatedCost,
            supplier: item.supplier,
            location: item.location,
            lastUpdated: item.updatedAt || new Date()
        };
    }

    /**
     * Estimate days until item runs out based on usage history
     */
    estimateDaysUntilEmpty(item) {
        if (!item.history || item.history.length === 0) {
            return 'Unknown';
        }

        // Get recent deductions (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentDeductions = item.history.filter(h => 
            h.action === 'deduct' && 
            h.date >= thirtyDaysAgo
        );

        if (recentDeductions.length === 0) {
            return 'Low usage';
        }

        const totalDeducted = recentDeductions.reduce((sum, h) => sum + Math.abs(h.changeAmount), 0);
        const dailyUsage = totalDeducted / 30;

        if (dailyUsage <= 0) {
            return 'Low usage';
        }

        const daysLeft = Math.floor(item.quantity / dailyUsage);
        return daysLeft > 0 ? daysLeft : 0;
    }

    /**
     * Calculate recommended order quantity
     */
    calculateRecommendedOrder(item) {
        // Order enough to last 30 days plus safety stock
        const safetyStock = item.threshold * 2;
        const monthlyUsage = this.estimateMonthlyUsage(item);
        
        return Math.max(safetyStock, monthlyUsage + item.threshold);
    }

    /**
     * Estimate monthly usage based on history
     */
    estimateMonthlyUsage(item) {
        if (!item.history || item.history.length === 0) {
            return item.threshold * 3; // Default to 3x threshold
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentDeductions = item.history.filter(h => 
            h.action === 'deduct' && 
            h.date >= thirtyDaysAgo
        );

        const totalUsed = recentDeductions.reduce((sum, h) => sum + Math.abs(h.changeAmount), 0);
        return totalUsed || item.threshold * 3;
    }

    /**
     * Generate restock report
     */
    async generateRestockReport() {
        const alerts = await this.checkInventoryLevels();
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: alerts.summary,
            alerts: alerts,
            recommendations: this.generateRecommendations(alerts),
            totalEstimatedCost: this.calculateTotalRestockCost(alerts)
        };

        return report;
    }

    /**
     * Generate restock recommendations
     */
    generateRecommendations(alerts) {
        const recommendations = [];

        // Critical items - immediate action needed
        if (alerts.critical.length > 0) {
            recommendations.push({
                priority: 'IMMEDIATE',
                action: 'Order critical items within 24 hours',
                items: alerts.critical.length,
                estimatedCost: alerts.critical.reduce((sum, alert) => sum + alert.estimatedCost, 0)
            });
        }

        // Warning items - order within a week
        if (alerts.warning.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Order warning items within 1 week',
                items: alerts.warning.length,
                estimatedCost: alerts.warning.reduce((sum, alert) => sum + alert.estimatedCost, 0)
            });
        }

        // Watch items - plan for next order
        if (alerts.watch.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Include in next planned order',
                items: alerts.watch.length,
                estimatedCost: alerts.watch.reduce((sum, alert) => sum + alert.estimatedCost, 0)
            });
        }

        return recommendations;
    }

    /**
     * Calculate total restock cost
     */
    calculateTotalRestockCost(alerts) {
        const allAlerts = [...alerts.critical, ...alerts.warning, ...alerts.watch];
        return allAlerts.reduce((sum, alert) => sum + alert.estimatedCost, 0);
    }

    /**
     * Send email alerts (if configured)
     */
    async sendEmailAlerts(report) {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('📧 Email not configured - skipping email alerts');
            return false;
        }

        try {
            const transporter = nodemailer.createTransporter(this.emailConfig);
            
            const emailContent = this.generateEmailContent(report);
            
            const mailOptions = {
                from: this.emailConfig.auth.user,
                to: process.env.ADMIN_EMAIL || 'admin@sarahsshortcakes.com',
                subject: `Inventory Alert - ${report.alerts.critical.length} Critical Items`,
                html: emailContent
            };

            await transporter.sendMail(mailOptions);
            console.log('📧 Email alert sent successfully');
            return true;
        } catch (error) {
            console.error('📧 Failed to send email alert:', error);
            return false;
        }
    }

    /**
     * Generate email content
     */
    generateEmailContent(report) {
        let html = `
            <h2>🚨 Sarah's Shortcakes - Inventory Alert</h2>
            <p><strong>Report Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            
            <h3>📊 Summary</h3>
            <ul>
                <li>🚨 Critical Items: ${report.summary.criticalCount}</li>
                <li>⚠️ Warning Items: ${report.summary.warningCount}</li>
                <li>👀 Watch Items: ${report.summary.watchCount}</li>
                <li>✅ Healthy Items: ${report.summary.healthyCount}</li>
            </ul>
        `;

        if (report.alerts.critical.length > 0) {
            html += `
                <h3>🚨 Critical Items (Immediate Action Required)</h3>
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <tr>
                        <th>Item</th>
                        <th>Current</th>
                        <th>Threshold</th>
                        <th>Days Left</th>
                        <th>Recommended Order</th>
                        <th>Cost</th>
                    </tr>
            `;
            
            report.alerts.critical.forEach(alert => {
                html += `
                    <tr>
                        <td>${alert.name}</td>
                        <td>${alert.currentQuantity.toFixed(2)} ${alert.unit}</td>
                        <td>${alert.threshold} ${alert.unit}</td>
                        <td>${alert.daysUntilEmpty}</td>
                        <td>${alert.recommendedOrder.toFixed(2)} ${alert.unit}</td>
                        <td>$${alert.estimatedCost.toFixed(2)}</td>
                    </tr>
                `;
            });
            
            html += '</table>';
        }

        html += `
            <h3>💰 Total Estimated Restock Cost: $${report.totalEstimatedCost.toFixed(2)}</h3>
            <p>Please review and take appropriate action.</p>
        `;

        return html;
    }

    /**
     * Run automated check and alert
     */
    async runAutomatedCheck() {
        console.log('🔄 Running automated inventory check...');
        
        const report = await this.generateRestockReport();
        
        // Log results
        console.log(`📊 Inventory Check Results:`);
        console.log(`   🚨 Critical: ${report.summary.criticalCount}`);
        console.log(`   ⚠️ Warning: ${report.summary.warningCount}`);
        console.log(`   👀 Watch: ${report.summary.watchCount}`);
        console.log(`   💰 Total Restock Cost: $${report.totalEstimatedCost.toFixed(2)}`);

        // Send email if there are critical items
        if (report.summary.criticalCount > 0) {
            await this.sendEmailAlerts(report);
        }

        return report;
    }
}

module.exports = RestockAlertSystem;
