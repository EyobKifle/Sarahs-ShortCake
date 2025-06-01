const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const LoggerService = require('./loggerService');
const NotificationService = require('./notificationService');

class MonitoringService {
    constructor() {
        this.metrics = {
            system: {},
            database: {},
            application: {},
            business: {}
        };
        this.alerts = [];
        this.thresholds = {
            cpu: 80,           // CPU usage percentage
            memory: 85,        // Memory usage percentage
            disk: 90,          // Disk usage percentage
            responseTime: 5000, // Response time in ms
            errorRate: 5       // Error rate percentage
        };
        this.monitoringInterval = null;
        this.isMonitoring = false;
    }

    async startMonitoring(intervalMs = 60000) {
        if (this.isMonitoring) {
            console.log('Monitoring already running');
            return;
        }

        console.log('Starting system monitoring...');
        this.isMonitoring = true;

        // Initial metrics collection
        await this.collectMetrics();

        // Set up periodic monitoring
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.collectMetrics();
                await this.checkAlerts();
            } catch (error) {
                console.error('Error in monitoring cycle:', error);
                await LoggerService.error('Monitoring cycle error', { error: error.message });
            }
        }, intervalMs);

        await LoggerService.info('System monitoring started', { interval: intervalMs });
    }

    async stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        console.log('Stopping system monitoring...');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        this.isMonitoring = false;
        await LoggerService.info('System monitoring stopped');
    }

    async collectMetrics() {
        try {
            // Collect system metrics
            await this.collectSystemMetrics();
            
            // Collect database metrics
            await this.collectDatabaseMetrics();
            
            // Collect application metrics
            await this.collectApplicationMetrics();
            
            // Collect business metrics
            await this.collectBusinessMetrics();

            // Update timestamp
            this.metrics.lastUpdated = new Date();

        } catch (error) {
            console.error('Error collecting metrics:', error);
            await LoggerService.error('Metrics collection error', { error: error.message });
        }
    }

    async collectSystemMetrics() {
        // CPU metrics
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const cpuUsage = 100 - ~~(100 * idle / total);

        // Memory metrics
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;

        // Disk metrics
        const diskUsage = await this.getDiskUsage();

        // Load average (Unix systems)
        const loadAverage = os.loadavg();

        this.metrics.system = {
            cpu: {
                usage: cpuUsage,
                cores: cpus.length,
                model: cpus[0].model
            },
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usage: memoryUsage
            },
            disk: diskUsage,
            loadAverage: {
                '1min': loadAverage[0],
                '5min': loadAverage[1],
                '15min': loadAverage[2]
            },
            uptime: os.uptime(),
            platform: os.platform(),
            arch: os.arch()
        };
    }

    async getDiskUsage() {
        try {
            const stats = await fs.statfs(process.cwd());
            const total = stats.blocks * stats.blksize;
            const free = stats.bavail * stats.blksize;
            const used = total - free;
            const usage = (used / total) * 100;

            return {
                total,
                used,
                free,
                usage
            };
        } catch (error) {
            // Fallback for systems that don't support statfs
            return {
                total: 0,
                used: 0,
                free: 0,
                usage: 0
            };
        }
    }

    async collectDatabaseMetrics() {
        try {
            const dbStats = await mongoose.connection.db.stats();
            const collections = await mongoose.connection.db.listCollections().toArray();

            // Get collection stats
            const collectionStats = {};
            for (const collection of collections) {
                try {
                    const stats = await mongoose.connection.db.collection(collection.name).stats();
                    collectionStats[collection.name] = {
                        documents: stats.count,
                        size: stats.size,
                        avgObjSize: stats.avgObjSize,
                        indexes: stats.nindexes
                    };
                } catch (error) {
                    // Skip collections that can't be accessed
                }
            }

            this.metrics.database = {
                connected: mongoose.connection.readyState === 1,
                collections: collections.length,
                totalSize: dbStats.dataSize,
                indexSize: dbStats.indexSize,
                documents: dbStats.objects,
                avgObjSize: dbStats.avgObjSize,
                collectionStats
            };
        } catch (error) {
            this.metrics.database = {
                connected: false,
                error: error.message
            };
        }
    }

    async collectApplicationMetrics() {
        const processMemory = process.memoryUsage();
        
        this.metrics.application = {
            nodeVersion: process.version,
            pid: process.pid,
            uptime: process.uptime(),
            memory: {
                rss: processMemory.rss,
                heapTotal: processMemory.heapTotal,
                heapUsed: processMemory.heapUsed,
                external: processMemory.external
            },
            eventLoopLag: await this.measureEventLoopLag()
        };
    }

    async collectBusinessMetrics() {
        try {
            // Get today's date range
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Orders metrics
            const totalOrders = await mongoose.connection.db.collection('orders').countDocuments();
            const todayOrders = await mongoose.connection.db.collection('orders').countDocuments({
                createdAt: { $gte: today, $lt: tomorrow }
            });
            const pendingOrders = await mongoose.connection.db.collection('orders').countDocuments({
                status: 'pending'
            });

            // Revenue metrics
            const revenueResult = await mongoose.connection.db.collection('orders').aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]).toArray();
            const totalRevenue = revenueResult[0]?.total || 0;

            const todayRevenueResult = await mongoose.connection.db.collection('orders').aggregate([
                { 
                    $match: { 
                        createdAt: { $gte: today, $lt: tomorrow },
                        status: { $ne: 'cancelled' }
                    }
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]).toArray();
            const todayRevenue = todayRevenueResult[0]?.total || 0;

            // Customer metrics
            const totalCustomers = await mongoose.connection.db.collection('customers').countDocuments();
            const newCustomersToday = await mongoose.connection.db.collection('customers').countDocuments({
                createdAt: { $gte: today, $lt: tomorrow }
            });

            // Inventory metrics
            const lowStockItems = await mongoose.connection.db.collection('inventory').countDocuments({
                $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
            });

            // Contact messages
            const unreadMessages = await mongoose.connection.db.collection('contactmessages').countDocuments({
                status: 'unread'
            });

            this.metrics.business = {
                orders: {
                    total: totalOrders,
                    today: todayOrders,
                    pending: pendingOrders
                },
                revenue: {
                    total: totalRevenue,
                    today: todayRevenue
                },
                customers: {
                    total: totalCustomers,
                    newToday: newCustomersToday
                },
                inventory: {
                    lowStockItems
                },
                messages: {
                    unread: unreadMessages
                }
            };
        } catch (error) {
            console.error('Error collecting business metrics:', error);
            this.metrics.business = { error: error.message };
        }
    }

    async measureEventLoopLag() {
        return new Promise((resolve) => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
                resolve(lag);
            });
        });
    }

    async checkAlerts() {
        const newAlerts = [];

        // Check CPU usage
        if (this.metrics.system.cpu?.usage > this.thresholds.cpu) {
            newAlerts.push({
                type: 'cpu_high',
                severity: 'warning',
                message: `High CPU usage: ${this.metrics.system.cpu.usage.toFixed(1)}%`,
                value: this.metrics.system.cpu.usage,
                threshold: this.thresholds.cpu
            });
        }

        // Check memory usage
        if (this.metrics.system.memory?.usage > this.thresholds.memory) {
            newAlerts.push({
                type: 'memory_high',
                severity: 'warning',
                message: `High memory usage: ${this.metrics.system.memory.usage.toFixed(1)}%`,
                value: this.metrics.system.memory.usage,
                threshold: this.thresholds.memory
            });
        }

        // Check disk usage
        if (this.metrics.system.disk?.usage > this.thresholds.disk) {
            newAlerts.push({
                type: 'disk_high',
                severity: 'critical',
                message: `High disk usage: ${this.metrics.system.disk.usage.toFixed(1)}%`,
                value: this.metrics.system.disk.usage,
                threshold: this.thresholds.disk
            });
        }

        // Check database connection
        if (!this.metrics.database.connected) {
            newAlerts.push({
                type: 'database_disconnected',
                severity: 'critical',
                message: 'Database connection lost',
                value: false,
                threshold: true
            });
        }

        // Check low stock items
        if (this.metrics.business.inventory?.lowStockItems > 0) {
            newAlerts.push({
                type: 'low_stock',
                severity: 'warning',
                message: `${this.metrics.business.inventory.lowStockItems} items are low in stock`,
                value: this.metrics.business.inventory.lowStockItems,
                threshold: 0
            });
        }

        // Process new alerts
        for (const alert of newAlerts) {
            await this.processAlert(alert);
        }

        // Clean up old alerts (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        this.alerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo);
    }

    async processAlert(alert) {
        alert.id = Date.now() + Math.random();
        alert.timestamp = new Date();

        // Check if this alert already exists (avoid spam)
        const existingAlert = this.alerts.find(a => 
            a.type === alert.type && 
            a.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Within last 5 minutes
        );

        if (existingAlert) {
            return; // Don't duplicate recent alerts
        }

        this.alerts.push(alert);

        // Log the alert
        await LoggerService.warn(`System alert: ${alert.message}`, {
            type: 'system_alert',
            alertType: alert.type,
            severity: alert.severity,
            value: alert.value,
            threshold: alert.threshold
        });

        // Send notifications for critical alerts
        if (alert.severity === 'critical') {
            try {
                await NotificationService.sendMaintenanceNotification(
                    `Critical Alert: ${alert.message}`,
                    new Date()
                );
            } catch (error) {
                console.error('Error sending alert notification:', error);
            }
        }
    }

    getMetrics() {
        return this.metrics;
    }

    getAlerts() {
        return this.alerts;
    }

    getHealthStatus() {
        const health = {
            status: 'healthy',
            checks: {},
            timestamp: new Date()
        };

        // System health checks
        health.checks.cpu = {
            status: this.metrics.system.cpu?.usage < this.thresholds.cpu ? 'healthy' : 'warning',
            value: this.metrics.system.cpu?.usage
        };

        health.checks.memory = {
            status: this.metrics.system.memory?.usage < this.thresholds.memory ? 'healthy' : 'warning',
            value: this.metrics.system.memory?.usage
        };

        health.checks.disk = {
            status: this.metrics.system.disk?.usage < this.thresholds.disk ? 'healthy' : 'critical',
            value: this.metrics.system.disk?.usage
        };

        health.checks.database = {
            status: this.metrics.database.connected ? 'healthy' : 'critical',
            value: this.metrics.database.connected
        };

        // Determine overall status
        const statuses = Object.values(health.checks).map(check => check.status);
        if (statuses.includes('critical')) {
            health.status = 'critical';
        } else if (statuses.includes('warning')) {
            health.status = 'warning';
        }

        return health;
    }

    async generateReport(startDate, endDate) {
        try {
            // This would typically aggregate historical data
            // For now, return current metrics with timestamp range
            return {
                period: {
                    start: startDate,
                    end: endDate
                },
                currentMetrics: this.metrics,
                alerts: this.alerts.filter(alert => 
                    alert.timestamp >= startDate && alert.timestamp <= endDate
                ),
                summary: {
                    totalAlerts: this.alerts.length,
                    criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
                    warningAlerts: this.alerts.filter(a => a.severity === 'warning').length,
                    averageCpuUsage: this.metrics.system.cpu?.usage || 0,
                    averageMemoryUsage: this.metrics.system.memory?.usage || 0,
                    databaseUptime: this.metrics.database.connected ? '100%' : '0%'
                },
                generatedAt: new Date()
            };
        } catch (error) {
            console.error('Error generating monitoring report:', error);
            throw error;
        }
    }

    updateThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
        LoggerService.info('Monitoring thresholds updated', { thresholds: this.thresholds });
    }
}

module.exports = new MonitoringService();
