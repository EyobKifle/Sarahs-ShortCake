// System Health Monitoring Module
class SystemHealth {
    constructor() {
        this.healthData = null;
        this.refreshInterval = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // System Health Modal events
        const systemHealthModal = document.getElementById('systemHealthModal');
        if (systemHealthModal) {
            systemHealthModal.addEventListener('shown.bs.modal', () => {
                this.loadHealthData();
                this.startAutoRefresh();
            });

            systemHealthModal.addEventListener('hidden.bs.modal', () => {
                this.stopAutoRefresh();
            });
        }

        // Refresh button
        const refreshHealthBtn = document.getElementById('refreshHealthBtn');
        if (refreshHealthBtn) {
            refreshHealthBtn.addEventListener('click', () => {
                this.loadHealthData(true);
            });
        }

        // Export report button
        const exportHealthReportBtn = document.getElementById('exportHealthReportBtn');
        if (exportHealthReportBtn) {
            exportHealthReportBtn.addEventListener('click', () => {
                this.exportHealthReport();
            });
        }
    }

    async loadHealthData(forceRefresh = false) {
        try {
            if (forceRefresh) {
                this.showLoadingState();
            }

            // Simulate API call to get system health data
            const response = await this.fetchHealthData();
            
            if (response && response.success) {
                this.healthData = response.data;
                this.displayHealthData();
            } else {
                throw new Error('Failed to fetch health data');
            }
        } catch (error) {
            console.error('Error loading health data:', error);
            this.showErrorState(error.message);
        }
    }

    async fetchHealthData() {
        // Simulate health data - in real implementation, this would call the monitoring API
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        overall: {
                            status: 'healthy', // healthy, warning, critical
                            score: 95,
                            lastChecked: new Date()
                        },
                        system: {
                            cpu: { usage: 45, status: 'healthy' },
                            memory: { usage: 62, total: '8 GB', used: '4.96 GB', status: 'healthy' },
                            disk: { usage: 78, total: '100 GB', used: '78 GB', status: 'warning' },
                            uptime: '5 days, 12 hours'
                        },
                        database: {
                            status: 'connected',
                            collections: 8,
                            totalSize: '245 MB',
                            documents: 1247,
                            responseTime: '12ms'
                        },
                        application: {
                            version: '1.0.0',
                            nodeVersion: 'v18.17.0',
                            uptime: '5 days, 12 hours',
                            memoryUsage: '156 MB',
                            eventLoopLag: '2.3ms'
                        },
                        business: {
                            ordersToday: 23,
                            totalRevenue: '$1,247.50',
                            activeCustomers: 156,
                            lowStockItems: 3,
                            unreadMessages: 2
                        },
                        alerts: [
                            {
                                id: 1,
                                type: 'disk_space',
                                severity: 'warning',
                                message: 'Disk usage is at 78%',
                                timestamp: new Date(Date.now() - 30 * 60 * 1000)
                            },
                            {
                                id: 2,
                                type: 'low_stock',
                                severity: 'info',
                                message: '3 items are low in stock',
                                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
                            }
                        ]
                    }
                });
            }, 1000);
        });
    }

    displayHealthData() {
        this.displayOverallHealth();
        this.displaySystemMetrics();
        this.displayDatabaseMetrics();
        this.displayApplicationMetrics();
        this.displayBusinessMetrics();
        this.displayRecentAlerts();
    }

    displayOverallHealth() {
        const container = document.getElementById('overallHealthStatus');
        if (!container) return;

        const { overall } = this.healthData;
        const statusColor = this.getStatusColor(overall.status);
        const statusIcon = this.getStatusIcon(overall.status);

        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-center">
                <div class="me-3">
                    <i class="fas ${statusIcon} fa-3x text-${statusColor}"></i>
                </div>
                <div class="text-start">
                    <h3 class="mb-1">System Status: <span class="text-${statusColor}">${overall.status.toUpperCase()}</span></h3>
                    <p class="mb-1">Health Score: <strong>${overall.score}%</strong></p>
                    <small class="text-muted">Last checked: ${overall.lastChecked.toLocaleString()}</small>
                </div>
            </div>
        `;
    }

    displaySystemMetrics() {
        const container = document.getElementById('systemMetrics');
        if (!container) return;

        const { system } = this.healthData;

        container.innerHTML = `
            <div class="row g-2">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>CPU Usage</span>
                        <span class="badge bg-${this.getStatusColor(system.cpu.status)}">${system.cpu.usage}%</span>
                    </div>
                    <div class="progress mb-3" style="height: 8px;">
                        <div class="progress-bar bg-${this.getStatusColor(system.cpu.status)}" 
                             style="width: ${system.cpu.usage}%"></div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>Memory Usage</span>
                        <span class="badge bg-${this.getStatusColor(system.memory.status)}">${system.memory.usage}%</span>
                    </div>
                    <div class="progress mb-3" style="height: 8px;">
                        <div class="progress-bar bg-${this.getStatusColor(system.memory.status)}" 
                             style="width: ${system.memory.usage}%"></div>
                    </div>
                    <small class="text-muted">${system.memory.used} / ${system.memory.total}</small>
                </div>
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>Disk Usage</span>
                        <span class="badge bg-${this.getStatusColor(system.disk.status)}">${system.disk.usage}%</span>
                    </div>
                    <div class="progress mb-3" style="height: 8px;">
                        <div class="progress-bar bg-${this.getStatusColor(system.disk.status)}" 
                             style="width: ${system.disk.usage}%"></div>
                    </div>
                    <small class="text-muted">${system.disk.used} / ${system.disk.total}</small>
                </div>
                <div class="col-12">
                    <hr>
                    <div class="d-flex justify-content-between">
                        <span>System Uptime</span>
                        <strong>${system.uptime}</strong>
                    </div>
                </div>
            </div>
        `;
    }

    displayDatabaseMetrics() {
        const container = document.getElementById('databaseMetrics');
        if (!container) return;

        const { database } = this.healthData;
        const statusColor = database.status === 'connected' ? 'success' : 'danger';

        container.innerHTML = `
            <div class="row g-2">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span>Connection Status</span>
                        <span class="badge bg-${statusColor}">${database.status.toUpperCase()}</span>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center">
                        <h4 class="mb-1">${database.collections}</h4>
                        <small class="text-muted">Collections</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center">
                        <h4 class="mb-1">${database.documents}</h4>
                        <small class="text-muted">Documents</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center">
                        <h4 class="mb-1">${database.totalSize}</h4>
                        <small class="text-muted">Total Size</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center">
                        <h4 class="mb-1">${database.responseTime}</h4>
                        <small class="text-muted">Response Time</small>
                    </div>
                </div>
            </div>
        `;
    }

    displayApplicationMetrics() {
        const container = document.getElementById('applicationMetrics');
        if (!container) return;

        const { application } = this.healthData;

        container.innerHTML = `
            <div class="row g-2">
                <div class="col-12">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Application Version</span>
                        <strong>${application.version}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Node.js Version</span>
                        <strong>${application.nodeVersion}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Application Uptime</span>
                        <strong>${application.uptime}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Memory Usage</span>
                        <strong>${application.memoryUsage}</strong>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>Event Loop Lag</span>
                        <strong>${application.eventLoopLag}</strong>
                    </div>
                </div>
            </div>
        `;
    }

    displayBusinessMetrics() {
        const container = document.getElementById('businessMetrics');
        if (!container) return;

        const { business } = this.healthData;

        container.innerHTML = `
            <div class="row g-2">
                <div class="col-6">
                    <div class="text-center">
                        <h4 class="mb-1 text-primary">${business.ordersToday}</h4>
                        <small class="text-muted">Orders Today</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center">
                        <h4 class="mb-1 text-success">${business.totalRevenue}</h4>
                        <small class="text-muted">Today's Revenue</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center">
                        <h4 class="mb-1 text-info">${business.activeCustomers}</h4>
                        <small class="text-muted">Active Customers</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="text-center">
                        <h4 class="mb-1 ${business.lowStockItems > 0 ? 'text-warning' : 'text-success'}">${business.lowStockItems}</h4>
                        <small class="text-muted">Low Stock Items</small>
                    </div>
                </div>
                <div class="col-12">
                    <hr>
                    <div class="d-flex justify-content-between">
                        <span>Unread Messages</span>
                        <span class="badge ${business.unreadMessages > 0 ? 'bg-warning' : 'bg-success'}">${business.unreadMessages}</span>
                    </div>
                </div>
            </div>
        `;
    }

    displayRecentAlerts() {
        const container = document.getElementById('recentAlerts');
        if (!container) return;

        const { alerts } = this.healthData;

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-check-circle fa-2x mb-2"></i>
                    <p>No recent alerts</p>
                </div>
            `;
            return;
        }

        const alertsHtml = alerts.map(alert => `
            <div class="alert alert-${this.getSeverityColor(alert.severity)} alert-dismissible fade show mb-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${alert.type.replace('_', ' ').toUpperCase()}</strong>
                        <p class="mb-1">${alert.message}</p>
                        <small class="text-muted">${this.getTimeAgo(alert.timestamp)}</small>
                    </div>
                    <span class="badge bg-${this.getSeverityColor(alert.severity)}">${alert.severity}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = alertsHtml;
    }

    showLoadingState() {
        const containers = ['overallHealthStatus', 'systemMetrics', 'databaseMetrics', 'applicationMetrics', 'businessMetrics', 'recentAlerts'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        <small class="d-block mt-1">Loading...</small>
                    </div>
                `;
            }
        });
    }

    showErrorState(message) {
        const container = document.getElementById('overallHealthStatus');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Error loading health data</p>
                    <small>${message}</small>
                </div>
            `;
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.loadHealthData();
        }, 30000); // Refresh every 30 seconds
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async exportHealthReport() {
        try {
            if (!this.healthData) {
                await this.loadHealthData();
            }

            const report = {
                generatedAt: new Date().toISOString(),
                systemHealth: this.healthData,
                summary: {
                    overallStatus: this.healthData.overall.status,
                    healthScore: this.healthData.overall.score,
                    criticalIssues: this.healthData.alerts.filter(a => a.severity === 'critical').length,
                    warnings: this.healthData.alerts.filter(a => a.severity === 'warning').length
                }
            };

            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system-health-report-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Health report exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting health report:', error);
            this.showNotification('Error exporting health report', 'error');
        }
    }

    getStatusColor(status) {
        const colors = {
            'healthy': 'success',
            'warning': 'warning',
            'critical': 'danger'
        };
        return colors[status] || 'secondary';
    }

    getStatusIcon(status) {
        const icons = {
            'healthy': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'critical': 'fa-times-circle'
        };
        return icons[status] || 'fa-question-circle';
    }

    getSeverityColor(severity) {
        const colors = {
            'info': 'info',
            'warning': 'warning',
            'critical': 'danger'
        };
        return colors[severity] || 'secondary';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    showNotification(message, type = 'info') {
        if (window.AdminManager && window.AdminManager.showNotification) {
            window.AdminManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Export for use in other modules
window.SystemHealth = SystemHealth;
