// Report Manager for Sarah's Short Cakes Admin Panel
const ReportManager = {
    // Chart instances
    charts: {
        summary: null,
        revenue: null,
        orders: null,
        items: null
    },
    
    // Current report data
    currentReport: {
        type: null,
        dateRange: null,
        data: null
    },
    
    // Initialize the report manager
    init() {
        this.setupEventListeners();
        this.setupCharts();
    },
    
    // Set up event listeners
    setupEventListeners() {
        // Date range change
        document.getElementById('dateRange').addEventListener('change', (e) => {
            const customRange = document.getElementById('customDateRange');
            customRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        // Report card selection
        document.querySelectorAll('.report-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectReportCard(card);
            });
        });
        
        // Generate report button
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });
        
        // Export buttons
        document.getElementById('printReportBtn').addEventListener('click', () => {
            this.printReport();
        });
        
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.exportToExcel();
        });
        
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
        });
        
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab);
            });
        });
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logging out...');
            window.location.href = 'login.html';
        });
    },
    
    // Set up Chart.js instances
    setupCharts() {
        // Summary Chart
        const summaryCtx = document.getElementById('summaryChart').getContext('2d');
        this.charts.summary = new Chart(summaryCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue',
                    data: [],
                    borderColor: '#FF6B8B',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue Trend'
                    }
                }
            }
        });
        
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        this.charts.revenue = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue',
                    data: [],
                    backgroundColor: '#FF6B8B'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue by Period'
                    }
                }
            }
        });
        
        // Orders Chart
        const ordersCtx = document.getElementById('ordersChart').getContext('2d');
        this.charts.orders = new Chart(ordersCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Orders',
                    data: [],
                    borderColor: '#06D6A0',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Orders by Period'
                    }
                }
            }
        });
        
        // Items Chart
        const itemsCtx = document.getElementById('itemsChart').getContext('2d');
        this.charts.items = new Chart(itemsCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6B8B',
                        '#FFD166',
                        '#06D6A0',
                        '#118AB2',
                        '#073B4C'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Items Distribution'
                    }
                }
            }
        });
    },
    
    // Select a report card
    selectReportCard(card) {
        const reportType = card.getAttribute('data-report');
        document.getElementById('reportType').value = reportType;
        
        // Update visual selection
        document.querySelectorAll('.report-card').forEach(c => {
            c.classList.remove('selected');
        });
        card.classList.add('selected');
    },
    
    // Generate report
    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        const dateRange = document.getElementById('dateRange').value;
        
        if (!reportType) {
            this.showNotification('Please select a report type', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Get date range
            const { startDate, endDate } = this.getDateRange(dateRange);
            
            // Fetch report data
            const response = await fetch(`/api/reports/${reportType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    startDate,
                    endDate
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }
            
            const data = await response.json();
            
            // Update current report
            this.currentReport = {
                type: reportType,
                dateRange,
                data
            };
            
            // Update UI
            this.updateReportUI(data);
            
            // Show report results
            document.querySelector('.report-results').style.display = 'block';
            
        } catch (error) {
            console.error('Error generating report:', error);
            this.showNotification('Failed to generate report', 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Get date range based on selection
    getDateRange(range) {
        const now = new Date();
        let startDate, endDate;
        
        switch (range) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date();
                break;
            case 'yesterday':
                startDate = new Date(now.setDate(now.getDate() - 1));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                endDate = new Date();
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date();
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date();
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date();
                break;
            case 'custom':
                startDate = new Date(document.getElementById('startDate').value);
                endDate = new Date(document.getElementById('endDate').value);
                break;
            default:
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date();
        }
        
        return { startDate, endDate };
    },
    
    // Update report UI with data
    updateReportUI(data) {
        // Update summary cards
        document.getElementById('totalOrders').textContent = data.totalOrders;
        document.getElementById('totalRevenue').textContent = this.formatCurrency(data.totalRevenue);
        document.getElementById('avgOrderValue').textContent = this.formatCurrency(data.avgOrderValue);
        document.getElementById('itemsSold').textContent = data.itemsSold;
        
        // Update report title and period
        document.getElementById('reportTitle').textContent = this.getReportTitle();
        document.getElementById('reportPeriod').textContent = this.getReportPeriod();
        
        // Update charts
        this.updateCharts(data);
        
        // Update table
        this.updateTable(data);
    },
    
    // Update charts with new data
    updateCharts(data) {
        // Summary chart (revenue trend)
        this.charts.summary.data.labels = data.dates;
        this.charts.summary.data.datasets[0].data = data.revenueTrend;
        this.charts.summary.update();
        
        // Revenue chart
        this.charts.revenue.data.labels = data.dates;
        this.charts.revenue.data.datasets[0].data = data.revenueByPeriod;
        this.charts.revenue.update();
        
        // Orders chart
        this.charts.orders.data.labels = data.dates;
        this.charts.orders.data.datasets[0].data = data.ordersByPeriod;
        this.charts.orders.update();
        
        // Items chart
        this.charts.items.data.labels = data.popularItems.map(item => item.name);
        this.charts.items.data.datasets[0].data = data.popularItems.map(item => item.count);
        this.charts.items.update();
    },
    
    // Update table with new data
    updateTable(data) {
        const tbody = document.getElementById('reportTableBody');
        tbody.innerHTML = '';
        
        data.dailyData.forEach(day => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(day.date)}</td>
                <td>${day.orders}</td>
                <td>${day.itemsSold}</td>
                <td>${this.formatCurrency(day.revenue)}</td>
                <td>${this.formatCurrency(day.avgOrderValue)}</td>
            `;
            tbody.appendChild(row);
        });
    },
    
    // Switch between tabs
    switchTab(tab) {
        const tabId = tab.getAttribute('data-tab');
        
        // Update tab styles
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');
        
        // Update content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
    },
    
    // Print report
    printReport() {
        window.print();
    },
    
    // Export to Excel
    exportToExcel() {
        // Implementation for Excel export
        this.showNotification('Excel export not implemented yet', 'info');
    },
    
    // Export to PDF
    exportToPDF() {
        // Implementation for PDF export
        this.showNotification('PDF export not implemented yet', 'info');
    },
    
    // Show/hide loading indicator
    showLoading(show) {
        document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
    },
    
    // Show notification
    showNotification(message, type = 'info') {
        // Implementation for showing notifications
        console.log(`${type}: ${message}`);
    },
    
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },
    
    // Get report title based on type
    getReportTitle() {
        const titles = {
            sales: 'Sales Summary Report',
            delivery: 'Delivery Schedule Report',
            inventory: 'Inventory Usage Report',
            popular: 'Popular Items Report'
        };
        return titles[this.currentReport.type] || 'Report';
    },
    
    // Get report period text
    getReportPeriod() {
        const { startDate, endDate } = this.getDateRange(this.currentReport.dateRange);
        return `Period: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ReportManager.init();
}); 