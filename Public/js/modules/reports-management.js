// Enhanced Reports Management Module - Unified System
class ReportsManagement {
    constructor() {
        this.reportsData = {};
        this.currentPeriod = 'month';
        this.detailedReportData = [];
        this.charts = {
            sales: null,
            topProducts: null
        };
        this.currentReport = {
            type: 'sales',
            dateRange: null,
            data: null
        };
        this.setupEventListeners();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Period filter change
        document.addEventListener('change', (e) => {
            if (e.target.id === 'reportPeriodFilter') {
                this.loadReports(e.target.value);
            }
            if (e.target.id === 'reportType') {
                this.handleReportTypeChange(e.target.value);
            }
            if (e.target.id === 'reportDateRange') {
                this.handleDateRangeChange();
            }
        });

        // Refresh button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refreshReportBtn' || e.target.closest('#refreshReportBtn')) {
                const period = document.getElementById('reportPeriodFilter')?.value || 'month';
                const reportType = document.getElementById('reportType')?.value || 'sales';

                console.log(`🔄 Refreshing ${reportType} report for period: ${period}`);

                // Load specific report type or all reports
                if (reportType && reportType !== 'sales') {
                    this.loadReportsForType(reportType, period);
                } else {
                    this.loadReports(period);
                }
            }



            // Apply date range button
            if (e.target.id === 'applyDateRange' || e.target.closest('#applyDateRange')) {
                this.applyDateRangeFilter();
            }
        });
    }

    // Initialize charts for reports
    initializeCharts() {
        // Only initialize if we're on the reports section
        if (document.getElementById('reportSalesChart')) {
            this.setupSalesChart();
        }
        if (document.getElementById('reportCategoryChart')) {
            this.setupTopProductsChart();
        }
    }

    // Setup sales trend chart
    setupSalesChart() {
        const ctx = document.getElementById('reportSalesChart');
        if (!ctx) return;

        this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue',
                    data: [],
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Orders',
                    data: [],
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Orders'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    // Setup top products chart
    setupTopProductsChart() {
        const ctx = document.getElementById('reportCategoryChart');
        if (!ctx) return;

        this.charts.topProducts = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(0, 123, 255, 0.8)',
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(108, 66, 193, 0.8)',
                        'rgba(255, 107, 139, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Handle report type change
    handleReportTypeChange(reportType) {
        this.currentReport.type = reportType;
        console.log(`📊 Report type changed to: ${reportType}`);

        // Update the display based on report type
        this.switchReportDisplay(reportType);

        // Always reload reports to ensure fresh data for the selected type
        this.loadReportsForType(reportType, this.currentPeriod);
    }

    // Switch the report display based on type
    switchReportDisplay(reportType) {
        // Hide all report sections first
        this.hideAllReportSections();

        // Show the appropriate sections based on report type
        switch (reportType) {
            case 'sales':
                this.showSalesReportSections();
                break;
            case 'inventory':
                this.showInventoryReportSections();
                break;
            case 'customers':
                this.showCustomerReportSections();
                break;
            default:
                this.showSalesReportSections(); // Default to sales
        }
    }

    hideAllReportSections() {
        // Hide summary cards that are sales-specific
        const salesCards = document.getElementById('reportSummaryCards');
        if (salesCards) salesCards.style.display = 'none';

        // Hide charts row
        const chartsRow = document.getElementById('reportChartsRow');
        if (chartsRow) chartsRow.style.display = 'none';

        // Hide tax and delivery cards (sales-specific)
        const taxDeliveryRow = document.querySelector('.row.g-4.mb-4:has(#reportTotalTax)');
        if (taxDeliveryRow) taxDeliveryRow.style.display = 'none';
    }

    showSalesReportSections() {
        // Show sales summary cards
        const salesCards = document.getElementById('reportSummaryCards');
        if (salesCards) salesCards.style.display = 'flex';

        // Show charts
        const chartsRow = document.getElementById('reportChartsRow');
        if (chartsRow) chartsRow.style.display = 'flex';

        // Show tax and delivery cards
        const taxDeliveryRow = document.querySelector('.row.g-4.mb-4:has(#reportTotalTax)');
        if (taxDeliveryRow) taxDeliveryRow.style.display = 'flex';

        // Update detailed table headers for sales
        this.updateDetailedTableHeaders('sales');
    }

    showInventoryReportSections() {
        // Create inventory-specific summary cards if they don't exist
        this.createInventorySummaryCards();

        // Hide sales charts, show inventory charts
        const chartsRow = document.getElementById('reportChartsRow');
        if (chartsRow) {
            chartsRow.style.display = 'flex';
            this.updateChartsForInventory();
        }

        // Update detailed table headers for inventory
        this.updateDetailedTableHeaders('inventory');
    }

    showCustomerReportSections() {
        // Create customer-specific summary cards if they don't exist
        this.createCustomerSummaryCards();

        // Hide sales charts, show customer charts
        const chartsRow = document.getElementById('reportChartsRow');
        if (chartsRow) {
            chartsRow.style.display = 'flex';
            this.updateChartsForCustomers();
        }

        // Update detailed table headers for customers
        this.updateDetailedTableHeaders('customers');
    }

    // Create inventory-specific summary cards
    createInventorySummaryCards() {
        const summaryCards = document.getElementById('reportSummaryCards');
        if (!summaryCards) return;

        summaryCards.innerHTML = `
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="text-primary mb-2">
                            <i class="fas fa-boxes fa-2x"></i>
                        </div>
                        <h3 class="mb-1" id="reportTotalItems">0</h3>
                        <p class="text-muted mb-0">Total Items</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="text-warning mb-2">
                            <i class="fas fa-exclamation-triangle fa-2x"></i>
                        </div>
                        <h3 class="mb-1" id="reportLowStockItems">0</h3>
                        <p class="text-muted mb-0">Low Stock Items</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="text-danger mb-2">
                            <i class="fas fa-times-circle fa-2x"></i>
                        </div>
                        <h3 class="mb-1" id="reportOutOfStockItems">0</h3>
                        <p class="text-muted mb-0">Out of Stock</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="text-success mb-2">
                            <i class="fas fa-dollar-sign fa-2x"></i>
                        </div>
                        <h3 class="mb-1" id="reportInventoryValue">$0.00</h3>
                        <p class="text-muted mb-0">Total Value</p>
                    </div>
                </div>
            </div>
        `;
        summaryCards.style.display = 'flex';
    }

    // Create customer-specific summary cards
    createCustomerSummaryCards() {
        const summaryCards = document.getElementById('reportSummaryCards');
        if (!summaryCards) return;

        summaryCards.innerHTML = `
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="text-primary mb-2">
                            <i class="fas fa-users fa-2x"></i>
                        </div>
                        <h3 class="mb-1" id="reportTotalCustomers">0</h3>
                        <p class="text-muted mb-0">Total Customers</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="text-success mb-2">
                            <i class="fas fa-user-check fa-2x"></i>
                        </div>
                        <h3 class="mb-1" id="reportActiveCustomers">0</h3>
                        <p class="text-muted mb-0">Active Customers</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="text-info mb-2">
                            <i class="fas fa-dollar-sign fa-2x"></i>
                        </div>
                        <h3 class="mb-1" id="reportCustomerRevenue">$0.00</h3>
                        <p class="text-muted mb-0">Total Revenue</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="text-warning mb-2">
                            <i class="fas fa-chart-line fa-2x"></i>
                        </div>
                        <h3 class="mb-1" id="reportAvgSpentPerCustomer">$0.00</h3>
                        <p class="text-muted mb-0">Avg per Customer</p>
                    </div>
                </div>
            </div>
        `;
        summaryCards.style.display = 'flex';
    }

    // Update report display for specific type
    updateReportDisplayForType(reportType) {
        switch (reportType) {
            case 'sales':
                this.updateReportsDisplay();
                break;
            case 'inventory':
                this.updateInventoryReportDisplay();
                break;
            case 'customers':
                this.updateCustomerReportDisplay();
                break;
        }
    }

    // Update charts for inventory report
    updateChartsForInventory() {
        if (!this.reportsData.inventory) return;

        const inventoryData = this.reportsData.inventory.data || this.reportsData.inventory;

        // Update sales chart to show inventory trends
        if (this.charts.sales) {
            const ctx = this.charts.sales.canvas.getContext('2d');
            this.charts.sales.destroy();

            // Create inventory trend chart
            this.charts.sales = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: inventoryData.items ? inventoryData.items.slice(0, 10).map(item => item.name) : [],
                    datasets: [{
                        label: 'Stock Quantity',
                        data: inventoryData.items ? inventoryData.items.slice(0, 10).map(item => item.quantity) : [],
                        backgroundColor: 'rgba(0, 123, 255, 0.8)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Inventory Stock Levels'
                        }
                    }
                }
            });
        }

        // Update top products chart to show stock status
        if (this.charts.topProducts && inventoryData.summary) {
            const ctx = this.charts.topProducts.canvas.getContext('2d');
            this.charts.topProducts.destroy();

            this.charts.topProducts = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
                    datasets: [{
                        data: [
                            inventoryData.summary.inStockItems || 0,
                            inventoryData.summary.lowStockItems || 0,
                            inventoryData.summary.outOfStockItems || 0
                        ],
                        backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Stock Status Distribution'
                        }
                    }
                }
            });
        }
    }

    // Update charts for customer report
    updateChartsForCustomers() {
        if (!this.reportsData.customers) return;

        const customerData = this.reportsData.customers.data || this.reportsData.customers;

        // Update sales chart to show customer activity
        if (this.charts.sales) {
            const ctx = this.charts.sales.canvas.getContext('2d');
            this.charts.sales.destroy();

            // Create customer activity chart
            const topCustomers = customerData.customers ? customerData.customers.slice(0, 10) : [];

            this.charts.sales = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: topCustomers.map(customer => customer.name || 'Unknown'),
                    datasets: [{
                        label: 'Total Spent',
                        data: topCustomers.map(customer => customer.totalSpent || 0),
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Top Customers by Spending'
                        }
                    }
                }
            });
        }

        // Update top products chart to show customer types
        if (this.charts.topProducts && customerData.summary) {
            const ctx = this.charts.topProducts.canvas.getContext('2d');
            this.charts.topProducts.destroy();

            this.charts.topProducts = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Active Customers', 'Inactive Customers'],
                    datasets: [{
                        data: [
                            customerData.summary.activeCustomers || 0,
                            (customerData.summary.totalCustomers || 0) - (customerData.summary.activeCustomers || 0)
                        ],
                        backgroundColor: ['#007bff', '#6c757d'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Customer Activity Status'
                        }
                    }
                }
            });
        }
    }

    // Update detailed table headers based on report type
    updateDetailedTableHeaders(reportType) {
        const tableHead = document.querySelector('#detailedReportTable thead tr');
        if (!tableHead) return;

        switch (reportType) {
            case 'sales':
                tableHead.innerHTML = `
                    <th class="sortable" data-sort="orderId">
                        <i class="fas fa-hashtag me-1"></i>Order ID
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="customerName">
                        <i class="fas fa-user me-1"></i>Customer Name
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="customerType">
                        <i class="fas fa-user-tag me-1"></i>Type
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="date">
                        <i class="fas fa-calendar me-1"></i>Order Date
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="productName">
                        <i class="fas fa-birthday-cake me-1"></i>Product
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="quantity">
                        <i class="fas fa-boxes me-1"></i>Qty
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-end" data-sort="itemPrice">
                        <i class="fas fa-tag me-1"></i>Unit Price
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-end" data-sort="itemSubtotal">
                        <i class="fas fa-calculator me-1"></i>Item Total
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="paymentMethod">
                        <i class="fas fa-credit-card me-1"></i>Payment
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="status">
                        <i class="fas fa-info-circle me-1"></i>Status
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                `;
                break;
            case 'inventory':
                tableHead.innerHTML = `
                    <th class="sortable" data-sort="itemName">
                        <i class="fas fa-cube me-1"></i>Item Name
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="category">
                        <i class="fas fa-tags me-1"></i>Category
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="quantity">
                        <i class="fas fa-boxes me-1"></i>Quantity
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="unit">
                        <i class="fas fa-ruler me-1"></i>Unit
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="threshold">
                        <i class="fas fa-exclamation-triangle me-1"></i>Threshold
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="supplier">
                        <i class="fas fa-truck me-1"></i>Supplier
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-end" data-sort="costPerUnit">
                        <i class="fas fa-dollar-sign me-1"></i>Cost/Unit
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-end" data-sort="totalValue">
                        <i class="fas fa-calculator me-1"></i>Total Value
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="status">
                        <i class="fas fa-info-circle me-1"></i>Status
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="lastUpdated">
                        <i class="fas fa-clock me-1"></i>Last Updated
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                `;
                break;
            case 'customers':
                tableHead.innerHTML = `
                    <th class="sortable" data-sort="customerName">
                        <i class="fas fa-user me-1"></i>Customer Name
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="email">
                        <i class="fas fa-envelope me-1"></i>Email
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="phone">
                        <i class="fas fa-phone me-1"></i>Phone
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="orderCount">
                        <i class="fas fa-shopping-bag me-1"></i>Orders
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-end" data-sort="totalSpent">
                        <i class="fas fa-dollar-sign me-1"></i>Total Spent
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="lastOrderDate">
                        <i class="fas fa-calendar me-1"></i>Last Order
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable" data-sort="joinDate">
                        <i class="fas fa-user-plus me-1"></i>Join Date
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                    <th class="sortable text-center" data-sort="customerType">
                        <i class="fas fa-user-tag me-1"></i>Type
                        <i class="fas fa-sort ms-1"></i>
                    </th>
                `;
                break;
        }
    }

    // Update inventory report display
    updateInventoryReportDisplay() {
        if (!this.reportsData.inventory) {
            console.warn('⚠️ No inventory data available for reports display');
            return;
        }

        const inventoryResponse = this.reportsData.inventory;
        console.log('🔍 Raw inventory response structure:', inventoryResponse);

        // Handle the correct data structure from the API
        let inventoryData;
        if (inventoryResponse.data && inventoryResponse.data.summary) {
            inventoryData = inventoryResponse.data;
            console.log('📦 Using inventoryResponse.data:', inventoryData);
        } else if (inventoryResponse.summary) {
            inventoryData = inventoryResponse;
            console.log('📦 Using inventoryResponse directly:', inventoryData);
        } else {
            console.warn('⚠️ Unexpected inventory data structure:', inventoryResponse);
            inventoryData = inventoryResponse.data || inventoryResponse;
            console.log('📦 Using fallback data:', inventoryData);
        }

        const summary = inventoryData.summary || inventoryData;
        console.log('📦 Final inventory summary for display:', summary);

        // Update inventory summary cards
        const totalItems = summary.totalItems || 0;
        const lowStockItems = summary.lowStockItems || 0;
        const outOfStockItems = summary.outOfStockItems || 0;
        const totalValue = summary.totalValue || summary.totalInventoryValue || 0;
        const inStockItems = summary.inStockItems || (totalItems - outOfStockItems);

        console.log('📦 Inventory metrics:', { totalItems, lowStockItems, outOfStockItems, totalValue, inStockItems });

        // Update the report cards
        this.updateElement('reportTotalItems', totalItems);
        this.updateElement('reportLowStockItems', lowStockItems);
        this.updateElement('reportOutOfStockItems', outOfStockItems);
        this.updateElement('reportInventoryValue', `$${totalValue.toFixed(2)}`);

        // Store inventory items for detailed report
        this.inventoryDetailedData = inventoryData.items || inventoryData.inventoryItems || [];
        console.log('📦 Stored inventory items for detailed report:', this.inventoryDetailedData.length, 'items');

        // Update detailed table with inventory data
        this.renderInventoryDetailedReport(this.inventoryDetailedData);
    }

    // Update customer report display
    updateCustomerReportDisplay() {
        if (!this.reportsData.customers) {
            console.warn('⚠️ No customer data available for reports display');
            return;
        }

        const customerResponse = this.reportsData.customers;
        console.log('🔍 Raw customer response structure:', customerResponse);

        // Handle the correct data structure from the API
        let customerData;
        if (customerResponse.data && customerResponse.data.summary) {
            customerData = customerResponse.data;
            console.log('👥 Using customerResponse.data:', customerData);
        } else if (customerResponse.summary) {
            customerData = customerResponse;
            console.log('👥 Using customerResponse directly:', customerData);
        } else {
            console.warn('⚠️ Unexpected customer data structure:', customerResponse);
            customerData = customerResponse.data || customerResponse;
            console.log('👥 Using fallback data:', customerData);
        }

        const summary = customerData.summary || customerData;
        console.log('👥 Final customer summary for display:', summary);

        // Update customer summary cards
        const totalCustomers = summary.totalCustomers || 0;
        const activeCustomers = summary.activeCustomers || summary.registeredCustomers || 0;
        const totalRevenue = summary.totalRevenue || summary.totalSpent || 0;
        const avgSpentPerCustomer = summary.averageSpentPerCustomer || summary.avgOrderValue || 0;
        const guestCustomers = summary.guestCustomers || 0;

        console.log('👥 Customer metrics:', { totalCustomers, activeCustomers, totalRevenue, avgSpentPerCustomer, guestCustomers });

        // Update the report cards
        this.updateElement('reportTotalCustomers', totalCustomers);
        this.updateElement('reportActiveCustomers', activeCustomers);
        this.updateElement('reportCustomerRevenue', `$${totalRevenue.toFixed(2)}`);
        this.updateElement('reportAvgSpentPerCustomer', `$${avgSpentPerCustomer.toFixed(2)}`);

        // Store customer data for detailed report
        this.customerDetailedData = customerData.customers || customerData.customerList || [];
        console.log('👥 Stored customer data for detailed report:', this.customerDetailedData.length, 'customers');

        // Update detailed table with customer data
        this.renderCustomerDetailedReport(this.customerDetailedData);
    }

    // Render inventory detailed report
    renderInventoryDetailedReport(items) {
        const tableBody = document.getElementById('detailedReportTableBody');
        if (!tableBody) return;

        if (!items || items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted py-5">
                        <i class="fas fa-box-open fa-3x mb-3"></i>
                        <h5>No inventory items found</h5>
                        <p>No inventory data available for the selected period</p>
                    </td>
                </tr>
            `;
            return;
        }

        const html = items.map(item => {
            const quantity = item.quantity || 0;
            const threshold = item.threshold || 0;
            const costPerUnit = item.costPerUnit || 0;
            const totalValue = quantity * costPerUnit;

            let statusBadge = 'bg-success';
            let statusText = 'In Stock';

            if (quantity === 0) {
                statusBadge = 'bg-danger';
                statusText = 'Out of Stock';
            } else if (quantity <= threshold) {
                statusBadge = 'bg-warning';
                statusText = 'Low Stock';
            }

            return `
                <tr>
                    <td>${item.name || 'Unknown Item'}</td>
                    <td><span class="badge bg-secondary">${item.category || 'Uncategorized'}</span></td>
                    <td class="text-center">${quantity}</td>
                    <td class="text-center">${item.unit || 'units'}</td>
                    <td class="text-center">${threshold}</td>
                    <td>${item.supplier || 'N/A'}</td>
                    <td class="text-end">$${costPerUnit.toFixed(2)}</td>
                    <td class="text-end">$${totalValue.toFixed(2)}</td>
                    <td class="text-center">
                        <span class="badge ${statusBadge}">${statusText}</span>
                    </td>
                    <td>${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = html;
    }

    // Render customer detailed report
    renderCustomerDetailedReport(customers) {
        const tableBody = document.getElementById('detailedReportTableBody');
        if (!tableBody) return;

        if (!customers || customers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted py-5">
                        <i class="fas fa-users fa-3x mb-3"></i>
                        <h5>No customers found</h5>
                        <p>No customer data available for the selected period</p>
                    </td>
                </tr>
            `;
            return;
        }

        const html = customers.map(customer => {
            const customerType = customer.isGuest ? 'Guest' : 'Registered';
            const badgeClass = customer.isGuest ? 'bg-warning' : 'bg-primary';

            return `
                <tr>
                    <td>${customer.name || 'Unknown Customer'}</td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td class="text-center">${customer.orderCount || 0}</td>
                    <td class="text-end">$${(customer.totalSpent || 0).toFixed(2)}</td>
                    <td>${customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}</td>
                    <td>${customer.joinDate ? new Date(customer.joinDate).toLocaleDateString() : 'N/A'}</td>
                    <td class="text-center">
                        <span class="badge ${badgeClass}">${customerType}</span>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = html;
    }

    // Handle date range change
    handleDateRangeChange() {
        console.log('📅 Date range changed');
        // This will be handled by the apply button
    }

    // Apply date range filter
    async applyDateRangeFilter() {
        try {
            const dateRangeInput = document.getElementById('reportDateRange');
            if (!dateRangeInput) return;

            const dateRange = dateRangeInput.value;
            console.log(`📅 Applying date range filter: ${dateRange}`);

            // Parse date range and reload reports
            const period = this.calculatePeriodFromDateRange(dateRange);
            await this.loadReports(period);

            this.showNotification('Date range applied successfully!', 'success');
        } catch (error) {
            console.error('❌ Error applying date range:', error);
            this.showNotification('Failed to apply date range filter', 'error');
        }
    }

    // Calculate period from date range
    calculatePeriodFromDateRange(dateRange) {
        if (!dateRange || !dateRange.includes(' - ')) {
            return 'month';
        }

        const [startStr, endStr] = dateRange.split(' - ');
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) return 'today';
        if (diffDays <= 7) return 'week';
        if (diffDays <= 31) return 'month';
        if (diffDays <= 93) return 'quarter';
        return 'year';
    }

    // Load reports for specific type
    async loadReportsForType(reportType, period = 'month') {
        try {
            this.currentPeriod = period;
            console.log(`📊 Loading ${reportType} report for period:`, period);

            // Calculate date range based on period
            const dateRange = this.getDateRange(period);
            console.log('📅 Date range:', dateRange);

            // Load data based on report type
            switch (reportType) {
                case 'sales':
                    const salesData = await window.apiClient.getSalesReport(dateRange.start, dateRange.end);
                    console.log('💰 Sales data received:', salesData);
                    this.reportsData = { ...this.reportsData, sales: salesData };

                    // Load detailed order data for sales report
                    const detailedOrderData = await this.loadDetailedOrderData(dateRange);
                    this.detailedReportData = detailedOrderData;

                    this.updateReportsDisplay();
                    this.updateChartsWithRealData();
                    this.renderDetailedReport();
                    break;

                case 'inventory':
                    console.log('📦 Loading inventory report...');
                    const inventoryData = await window.apiClient.getInventoryReport();
                    console.log('📦 Inventory data received:', inventoryData);
                    this.reportsData = { ...this.reportsData, inventory: inventoryData };

                    this.switchReportDisplay('inventory');
                    this.updateInventoryReportDisplay();
                    break;

                case 'customers':
                    console.log('👥 Loading customer report...');
                    const customerData = await window.apiClient.getCustomerReport();
                    console.log('👥 Customer data received:', customerData);
                    this.reportsData = { ...this.reportsData, customers: customerData };

                    this.switchReportDisplay('customers');
                    this.updateCustomerReportDisplay();
                    break;
            }

            this.showNotification(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report loaded successfully`, 'success');
            return this.reportsData;
        } catch (error) {
            console.error(`❌ Error loading ${reportType} report:`, error);
            this.showNotification(`Error loading ${reportType} report: ` + error.message, 'error');
            return null;
        }
    }

    async loadReports(period = 'month') {
        try {
            this.currentPeriod = period;
            console.log('📊 Loading reports for period:', period);

            // Calculate date range based on period
            const dateRange = this.getDateRange(period);
            console.log('📅 Date range:', dateRange);

            // Load sales report with real database data
            const salesData = await window.apiClient.getSalesReport(dateRange.start, dateRange.end);
            console.log('💰 Sales data received:', salesData);
            console.log('💰 Sales data structure check:');
            console.log('  - salesData.data exists:', !!salesData.data);
            console.log('  - salesData.data.summary exists:', !!(salesData.data && salesData.data.summary));
            console.log('  - salesData.summary exists:', !!salesData.summary);
            if (salesData.data && salesData.data.summary) {
                console.log('  - salesData.data.summary content:', salesData.data.summary);
            }



            // Load inventory report
            const inventoryData = await window.apiClient.getInventoryReport();
            console.log('📦 Inventory data received:', inventoryData);

            // Load customer report
            const customerData = await window.apiClient.getCustomerReport();
            console.log('👥 Customer data received:', customerData);

            // Load detailed order data for tabular report
            const detailedOrderData = await this.loadDetailedOrderData(dateRange);
            console.log('📋 Detailed order data loaded:', detailedOrderData.length, 'records');

            // Get orders data for charts
            const ordersData = await this.loadOrdersForCharts(dateRange);
            console.log('📈 Orders data for charts:', ordersData.length, 'orders');

            this.reportsData = {
                sales: salesData,
                inventory: inventoryData,
                customers: customerData,
                orders: ordersData,
                period: period,
                dateRange: dateRange
            };

            this.detailedReportData = detailedOrderData;

            // Update reports display with real data
            this.updateReportsDisplay();
            this.updateChartsWithRealData();
            this.renderDetailedReport();

            return this.reportsData;
        } catch (error) {
            console.error('❌ Error loading reports:', error);
            this.showNotification('Error loading reports: ' + error.message, 'error');
            return null;
        }
    }

    // Show notification method
    showNotification(message, type = 'info') {
        // Create toast notification
        const toastContainer = document.querySelector('.toast-container') || this.createToastContainer();

        const toastId = 'toast-' + Date.now();
        const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';

        const toastHTML = `
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
                <div class="toast-header ${bgColor} text-white">
                    <strong class="me-auto">Report System</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }
        }, 3000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '11';
        document.body.appendChild(container);
        return container;
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Get date range for period
    getDateRange(period) {
        const now = new Date();
        let start, end = new Date();

        switch (period) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    async loadOrdersForCharts(dateRange) {
        try {
            // Use admin dashboard stats to get orders data
            const response = await window.apiClient.getAdminDashboardStats(this.currentPeriod);
            return response.orders || [];
        } catch (error) {
            console.error('Error loading orders for charts:', error);
            return [];
        }
    }

    updateReportsDisplay() {
        if (!this.reportsData.sales) {
            console.warn('⚠️ No sales data available for reports display');
            return;
        }

        const salesResponse = this.reportsData.sales;
        console.log('🔍 Raw sales response structure:', salesResponse);

        // Handle the correct data structure from the API
        // The API returns: { success: true, data: { summary: {...}, chartData: {...}, ... } }
        let salesData;
        if (salesResponse.data && salesResponse.data.summary) {
            salesData = salesResponse.data.summary;
            console.log('📊 Using salesResponse.data.summary:', salesData);
        } else if (salesResponse.summary) {
            salesData = salesResponse.summary;
            console.log('📊 Using salesResponse.summary:', salesData);
        } else {
            console.warn('⚠️ Unexpected sales data structure:', salesResponse);
            salesData = salesResponse.data || salesResponse;
            console.log('📊 Using fallback data:', salesData);
        }

        console.log('📊 Final salesData for display:', salesData);
        console.log('📊 Sales data summary:', salesData.summary);

        // Update summary cards with real database data - check both direct and summary structure
        const summary = salesData.summary || salesData;
        const totalRevenue = summary.totalRevenue || salesData.totalRevenue || 0;
        const totalOrders = summary.totalOrders || salesData.totalOrders || 0;
        const totalCustomers = summary.totalCustomers || salesData.totalCustomers || 0;
        const avgOrderValue = summary.avgOrderValue || summary.averageOrderValue || salesData.averageOrderValue || 0;
        const totalTax = summary.totalTax || salesData.totalTax || 0;
        const totalDeliveryFee = summary.totalDeliveryFee || salesData.totalDeliveryFee || 0;

        console.log('💰 Total Revenue:', totalRevenue, typeof totalRevenue);
        console.log('📦 Total Orders:', totalOrders, typeof totalOrders);
        console.log('👥 Total Customers:', totalCustomers, typeof totalCustomers);
        console.log('📊 Avg Order Value:', avgOrderValue, typeof avgOrderValue);
        console.log('🏷️ Total Tax:', totalTax, typeof totalTax);
        console.log('🚚 Total Delivery Fee:', totalDeliveryFee, typeof totalDeliveryFee);

        // Check if elements exist before updating
        const revenueElement = document.getElementById('reportTotalRevenue');
        const ordersElement = document.getElementById('reportTotalOrders');
        const customersElement = document.getElementById('reportTotalCustomers');

        console.log('🔍 Element check:');
        console.log('reportTotalRevenue element:', revenueElement);
        console.log('reportTotalOrders element:', ordersElement);
        console.log('reportTotalCustomers element:', customersElement);

        // Update the report cards (using correct element IDs from admin-manager.js)
        console.log('🔍 Attempting to update report cards...');
        console.log('🔍 Element reportTotalRevenue exists:', !!document.getElementById('reportTotalRevenue'));

        this.updateElement('reportTotalRevenue', `$${totalRevenue.toFixed(2)}`);
        this.updateElement('reportTotalOrders', totalOrders);
        this.updateElement('reportTotalCustomers', totalCustomers);

        // Update report totals summary section
        this.updateReportTotals(totalRevenue, totalTax, totalDeliveryFee, totalOrders);

        console.log('✅ Reports display updated with real database data');

        // Update detailed report table
        this.updateDetailedReportTable();

        // Update inventory and customer reports if available
        this.updateInventoryReportDisplay();
        this.updateCustomerReportDisplay();

        // Update summary totals section
        this.updateElement('summaryTotalRevenue', `$${totalRevenue.toFixed(2)}`);
        this.updateElement('summaryTotalTax', `$${totalTax.toFixed(2)}`);
        this.updateElement('summaryTotalDeliveryFee', `$${totalDeliveryFee.toFixed(2)}`);
        this.updateElement('summaryTotalOrders', totalOrders);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            console.log(`✅ Updated element ${id} with value: ${value}`);
        } else {
            console.warn(`⚠️ Element with ID '${id}' not found in DOM`);
        }
    }

    updateChangeElement(id, change) {
        const element = document.getElementById(id);
        if (element) {
            const isPositive = change >= 0;
            const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
            const colorClass = isPositive ? 'text-success' : 'text-danger';

            element.className = `small ${colorClass}`;
            element.innerHTML = `<i class="fas ${icon}"></i> ${Math.abs(change)}% from previous period`;
        }
    }

    updateChartsWithRealData() {
        console.log('📈 Updating charts with real database data');

        // Check if we have backend processed data first (preferred)
        if (this.reportsData.sales && this.reportsData.sales.data) {
            const salesData = this.reportsData.sales.data;

            // Use backend processed chart data if available
            if (salesData.chartData) {
                console.log('🏆 Using backend processed chart data');

                // Update sales trend chart with backend data
                if (salesData.chartData.salesTrend) {
                    const salesTrendData = this.prepareSalesTrendDataFromBackend(salesData.chartData.salesTrend);
                    this.updateSalesTrendChart(salesTrendData);
                }

                // Use backend processed top products data (this has better product name resolution)
                if (salesData.topProducts) {
                    const topProductsData = this.prepareTopProductsDataFromBackend(salesData.topProducts);
                    this.updateTopProductsChart(topProductsData);
                } else if (salesData.chartData.topProducts) {
                    const topProductsData = this.prepareTopProductsDataFromBackend(salesData.chartData.topProducts);
                    this.updateTopProductsChart(topProductsData);
                }

                console.log('✅ Charts updated with backend processed data');
                return;
            }
        }

        // Fallback to frontend processing if backend data not available
        if (!this.reportsData.orders || this.reportsData.orders.length === 0) {
            console.warn('⚠️ No orders data available for charts');
            return;
        }

        console.log('📈 Falling back to frontend data processing');

        // Prepare sales trend data from real orders
        const salesTrendData = this.prepareSalesTrendData(this.reportsData.orders);
        this.updateSalesTrendChart(salesTrendData);

        // Prepare top products data from real orders
        const topProductsData = this.prepareTopProductsData(this.reportsData.orders);
        this.updateTopProductsChart(topProductsData);

        console.log('✅ Charts updated with frontend processed data');
    }

    prepareSalesTrendData(orders) {
        // Group orders by date for the current period
        const dateGroups = {};
        const labels = [];
        const revenueData = [];
        const orderCounts = [];

        // Create date labels based on period
        const { start, end } = this.getDateRange(this.currentPeriod);
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Generate date labels based on period
        if (this.currentPeriod === 'today') {
            // Hourly data for today
            for (let hour = 0; hour < 24; hour++) {
                const label = `${hour}:00`;
                labels.push(label);
                dateGroups[label] = { revenue: 0, orders: 0 };
            }
        } else if (this.currentPeriod === 'week') {
            // Daily data for week
            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const label = date.toLocaleDateString('en-US', { weekday: 'short' });
                labels.push(label);
                dateGroups[label] = { revenue: 0, orders: 0 };
            }
        } else {
            // Daily data for month/quarter/year
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                labels.push(label);
                dateGroups[label] = { revenue: 0, orders: 0 };
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // Process orders and group by appropriate time period
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            let label;

            if (this.currentPeriod === 'today') {
                label = `${orderDate.getHours()}:00`;
            } else if (this.currentPeriod === 'week') {
                label = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
            } else {
                label = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            if (dateGroups[label]) {
                const revenue = parseFloat(order.totalAmount || order.total || 0);
                dateGroups[label].revenue += revenue;
                dateGroups[label].orders += 1;
            }
        });

        // Convert to arrays for Chart.js
        labels.forEach(label => {
            revenueData.push(dateGroups[label].revenue);
            orderCounts.push(dateGroups[label].orders);
        });

        return {
            labels,
            revenue: revenueData,
            orders: orderCounts
        };
    }

    prepareTopProductsData(orders) {
        const productCounts = {};
        const productRevenue = {};
        const productColors = {
            'Vanilla Cupcake': '#FFE4B5',
            'Chocolate Cupcake': '#8B4513',
            'Strawberry Cupcake': '#FFB6C1',
            'Red Velvet Cupcake': '#DC143C',
            'Lemon Cupcake': '#FFFF00',
            'Blueberry Cupcake': '#4169E1',
            'Carrot Cupcake': '#FF8C00',
            'Coconut Cupcake': '#F5F5DC',
            'Funfetti Cupcake': '#FF69B4',
            'Peanut Butter Cupcake': '#DEB887'
        };

        // Count products and calculate revenue
        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    // Improved product name resolution
                    const productName = this.getProductName(item);
                    const quantity = parseInt(item.quantity) || 1;
                    const price = parseFloat(item.price || item.unitPrice || 0);

                    if (!productCounts[productName]) {
                        productCounts[productName] = 0;
                        productRevenue[productName] = 0;
                    }

                    productCounts[productName] += quantity;
                    productRevenue[productName] += price * quantity;
                });
            }
        });

        // Sort by quantity and get top 5
        const sortedProducts = Object.entries(productCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            labels: sortedProducts.map(([name]) => name),
            quantities: sortedProducts.map(([,count]) => count),
            revenues: sortedProducts.map(([name]) => Math.round(productRevenue[name] * 100) / 100),
            colors: sortedProducts.map(([name]) => productColors[name] || `#${Math.floor(Math.random()*16777215).toString(16)}`)
        };
    }

    // Helper method to improve product name resolution
    getProductName(item) {
        // Priority order for finding product name
        if (item.product && item.product.name) {
            return item.product.name;
        }
        if (item.productName) {
            return item.productName;
        }
        if (item.name && item.name !== 'Unknown Product') {
            return item.name;
        }
        if (item.productId) {
            // Try to make productId more readable if it's a slug
            if (typeof item.productId === 'string' && item.productId.includes('-')) {
                return item.productId
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
            return `Product: ${item.productId}`;
        }
        return 'Unknown Product';
    }

    prepareTopProductsDataFromBackend(backendTopProducts) {
        console.log('🏆 Processing backend top products data:', backendTopProducts);

        if (!backendTopProducts || !Array.isArray(backendTopProducts)) {
            console.warn('⚠️ Invalid backend top products data');
            return { labels: [], quantities: [], revenues: [], colors: [] };
        }

        const productColors = {
            'Vanilla Cupcake': '#FFE4B5',
            'Chocolate Cupcake': '#8B4513',
            'Strawberry Cupcake': '#FFB6C1',
            'Red Velvet Cupcake': '#DC143C',
            'Lemon Cupcake': '#FFFF00',
            'Blueberry Cupcake': '#4169E1',
            'Carrot Cupcake': '#FF8C00',
            'Coconut Cupcake': '#F5F5DC',
            'Funfetti Cupcake': '#FF69B4',
            'Peanut Butter Cupcake': '#DEB887'
        };

        return {
            labels: backendTopProducts.map(product => product.name || 'Unknown Product'),
            quantities: backendTopProducts.map(product => product.quantity || 0),
            revenues: backendTopProducts.map(product => product.revenue || 0),
            colors: backendTopProducts.map(product =>
                product.color || productColors[product.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`
            )
        };
    }

    prepareSalesTrendDataFromBackend(backendSalesTrend) {
        console.log('📈 Processing backend sales trend data:', backendSalesTrend);

        if (!backendSalesTrend || !Array.isArray(backendSalesTrend)) {
            console.warn('⚠️ Invalid backend sales trend data');
            return { labels: [], revenue: [], orders: [] };
        }

        return {
            labels: backendSalesTrend.map(item => item.period || ''),
            revenue: backendSalesTrend.map(item => item.revenue || 0),
            orders: backendSalesTrend.map(item => item.orders || 0)
        };
    }

    updateSalesTrendChart(salesTrendData) {
        const ctx = document.getElementById('reportSalesChart');
        if (!ctx || !salesTrendData) {
            console.warn('⚠️ Sales trend chart canvas not found or no data');
            return;
        }

        console.log('📈 Updating sales trend chart with data:', salesTrendData);

        // Destroy existing chart if it exists
        if (window.reportSalesChart && typeof window.reportSalesChart.destroy === 'function') {
            try {
                window.reportSalesChart.destroy();
                window.reportSalesChart = null;
            } catch (error) {
                console.warn('Error destroying sales trend chart:', error);
            }
        }

        // Also check for any existing Chart.js instances on this canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            try {
                existingChart.destroy();
            } catch (error) {
                console.warn('Error destroying existing chart instance:', error);
            }
        }

        window.reportSalesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: salesTrendData.labels || [],
                datasets: [{
                    label: 'Revenue ($)',
                    data: salesTrendData.revenue || [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#007bff',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: 'Orders',
                    data: salesTrendData.orders || [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1',
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue ($)',
                            color: '#007bff'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Orders',
                            color: '#28a745'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Sales Trend - ${this.getPeriodDisplayText(this.currentPeriod)}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return 'Revenue: $' + context.raw.toLocaleString();
                                } else {
                                    return 'Orders: ' + context.raw;
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('✅ Sales trend chart updated successfully');
    }

    updateTopProductsChart(topProductsData) {
        const ctx = document.getElementById('reportCategoryChart');
        if (!ctx || !topProductsData) {
            console.warn('⚠️ Top products chart canvas not found or no data');
            return;
        }

        console.log('🏆 Updating top products chart with data:', topProductsData);

        // Destroy existing chart if it exists
        if (window.reportCategoryChart && typeof window.reportCategoryChart.destroy === 'function') {
            try {
                window.reportCategoryChart.destroy();
                window.reportCategoryChart = null;
            } catch (error) {
                console.warn('Error destroying top products chart:', error);
            }
        }

        // Also check for any existing Chart.js instances on this canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            try {
                existingChart.destroy();
            } catch (error) {
                console.warn('Error destroying existing chart instance:', error);
            }
        }

        // Prepare colors and border colors
        const colors = topProductsData.colors || [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'
        ];
        const borderColors = colors.map(color => {
            if (!color || !color.startsWith('#')) return color;
            const hex = color.replace('#', '');
            const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
            const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
            const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        });

        window.reportCategoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: topProductsData.labels || [],
                datasets: [{
                    label: 'Quantity Sold',
                    data: topProductsData.quantities || [],
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Top Products - ${this.getPeriodDisplayText(this.currentPeriod)}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);

                                // Get revenue data if available
                                const revenues = topProductsData.revenues || [];
                                const revenue = revenues[context.dataIndex] || 0;

                                return [
                                    `${label}: ${value} units (${percentage}%)`,
                                    `Revenue: $${revenue.toFixed(2)}`
                                ];
                            }
                        }
                    }
                },
                cutout: '50%'
            }
        });

        console.log('✅ Top products chart updated successfully');
    }

    getPeriodDisplayText(period) {
        switch (period) {
            case 'today': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'quarter': return 'This Quarter';
            case 'year': return 'This Year';
            default: return 'This Month';
        }
    }

    async exportPDF() {
        try {
            this.showNotification('Generating PDF report...', 'info');

            const dateRange = this.getDateRange(this.currentPeriod);
            const blob = await window.apiClient.exportReportPDF('sales', dateRange.start, dateRange.end);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${this.currentPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showNotification('PDF report downloaded successfully', 'success');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showNotification('Error exporting PDF: ' + error.message, 'error');
        }
    }



    async loadDetailedOrderData(dateRange) {
        try {
            // Format dates for API call
            const startDate = dateRange.start instanceof Date
                ? dateRange.start.toISOString().split('T')[0]
                : dateRange.start;
            const endDate = dateRange.end instanceof Date
                ? dateRange.end.toISOString().split('T')[0]
                : dateRange.end;

            console.log('🔍 Loading detailed order data for date range:', { startDate, endDate });

            // Get sales report data which includes detailed orders
            const response = await window.apiClient.getSalesReport(startDate, endDate);

            console.log('🔍 Sales report response received:', response);
            console.log('🔍 Response structure check:');
            console.log('  - response exists:', !!response);
            console.log('  - response.data exists:', !!(response && response.data));
            console.log('  - response.data.detailedOrders exists:', !!(response && response.data && response.data.detailedOrders));
            console.log('  - detailedOrders length:', response?.data?.detailedOrders?.length || 0);

            if (!response || !response.data || !response.data.detailedOrders) {
                console.warn('No detailed orders data in sales report response');
                return [];
            }

            const orders = response.data.detailedOrders;

            // Transform orders into detailed report format
            const detailedData = [];

            for (const order of orders) {
                const customerName = order.customerName || 'Unknown Customer';
                const customerType = order.customerEmail && order.customerEmail !== 'N/A' ? 'registered' : 'guest';
                const orderDate = new Date(order.orderDate).toLocaleDateString();

                // Process each item in the order
                if (order.items && order.items.length > 0) {
                    for (const item of order.items) {
                        detailedData.push({
                            orderId: order.orderId || order._id, // Use consistent order ID
                            orderIdDisplay: (order.orderId || order._id).slice(-8).toUpperCase(), // Standardized display format
                            customerName: customerName,
                            customerType: customerType,
                            date: orderDate,
                            productName: this.getProductName(item),
                            quantity: item.quantity || 1,
                            itemPrice: item.unitPrice || 0,
                            itemSubtotal: item.subtotal || 0,
                            orderSubtotal: order.totalPrice || 0,
                            tax: 0, // Tax calculation would need to be added to backend
                            deliveryFee: 0, // Delivery fee would need to be added to backend
                            totalRevenue: order.totalPrice || 0,
                            paymentMethod: order.paymentMethod || 'N/A',
                            status: order.status || 'pending'
                        });
                    }
                } else {
                    // Order with no items (shouldn't happen, but handle gracefully)
                    detailedData.push({
                        orderId: order.orderNumber || order.orderId,
                        customerName: customerName,
                        customerType: customerType,
                        date: orderDate,
                        productName: 'No items',
                        quantity: 0,
                        itemPrice: 0,
                        itemSubtotal: 0,
                        orderSubtotal: order.totalPrice || 0,
                        tax: 0,
                        deliveryFee: 0,
                        totalRevenue: order.totalPrice || 0,
                        paymentMethod: order.paymentMethod || 'N/A',
                        status: order.status || 'pending'
                    });
                }
            }

            console.log('🔍 Transformed', detailedData.length, 'detailed data items from', orders.length, 'orders');
            return detailedData;
        } catch (error) {
            console.error('❌ Error loading detailed order data:', error);
            return [];
        }
    }

    getCustomerName(order) {
        if (order.customer) {
            return `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || 'Unknown Customer';
        } else if (order.guestInfo) {
            return order.guestInfo.name || 'Guest Customer';
        } else {
            return 'Unknown Customer';
        }
    }

    renderDetailedReport() {
        const tbody = document.getElementById('detailedReportTableBody');
        if (!tbody) {
            console.warn('⚠️ Detailed report table body not found');
            return;
        }

        console.log('📋 Rendering enhanced detailed report with', this.detailedReportData?.length || 0, 'records');

        if (!this.detailedReportData || this.detailedReportData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted py-5">
                        <div class="text-center">
                            <i class="fas fa-chart-bar fa-4x mb-3 text-muted"></i>
                            <h4 class="text-muted">No Data Available</h4>
                            <p class="text-muted mb-0">No orders found for the selected period</p>
                            <small class="text-muted">Try adjusting your date range or filters</small>
                        </div>
                    </td>
                </tr>
            `;
            this.updateEnhancedReportTotals(0, 0, 0, 0);
            this.setupTableEnhancements();
            return;
        }

        // Group data by order to avoid duplicating order-level totals
        const orderGroups = {};
        this.detailedReportData.forEach(row => {
            if (!orderGroups[row.orderId]) {
                orderGroups[row.orderId] = {
                    orderData: row,
                    items: []
                };
            }
            orderGroups[row.orderId].items.push(row);
        });

        let html = '';
        let totalItemPrice = 0;
        let totalItemSubtotal = 0;
        let totalOrderCount = 0;

        Object.values(orderGroups).forEach((orderGroup, groupIndex) => {
            const order = orderGroup.orderData;
            const items = orderGroup.items;

            // Count unique orders
            totalOrderCount++;

            // Render each item in the order with enhanced styling
            items.forEach((item, index) => {
                // Add item-level totals for each item
                totalItemPrice += item.itemPrice * item.quantity;
                totalItemSubtotal += item.itemSubtotal;

                const customerTypeBadge = item.customerType === 'registered'
                    ? '<span class="badge bg-success"><i class="fas fa-user-check me-1"></i>Registered</span>'
                    : '<span class="badge bg-warning text-dark"><i class="fas fa-user-clock me-1"></i>Guest</span>';

                const statusBadge = this.getEnhancedStatusBadge(item.status);
                const rowClass = groupIndex % 2 === 0 ? 'table-row-even' : 'table-row-odd';

                // Format dates nicely
                const formattedDate = index === 0 ? this.formatDateWithTime(item.date) : '';

                // Create action buttons
                const actionButtons = index === 0 ? this.createActionButtons(item.orderId, item.status) : '';

                // Get payment method from the actual order data
                const orderPaymentMethod = index === 0 ? this.getOrderPaymentMethod(order) : '';

                html += `
                    <tr class="${rowClass} searchable-row" data-order-id="${item.orderId}" data-customer="${item.customerName.toLowerCase()}" data-product="${item.productName.toLowerCase()}">
                        <td class="fw-bold text-primary">${index === 0 ? `<span class="order-id-badge">#${item.orderIdDisplay || item.orderId.slice(-8).toUpperCase()}</span>` : ''}</td>
                        <td class="text-nowrap">${index === 0 ? `<div class="customer-info"><strong>${item.customerName}</strong></div>` : ''}</td>
                        <td class="text-center">${index === 0 ? customerTypeBadge : ''}</td>
                        <td class="text-nowrap small">${formattedDate}</td>
                        <td class="fw-medium">
                            <div class="product-info">
                                <i class="fas fa-birthday-cake text-warning me-1"></i>
                                ${item.productName}
                            </div>
                        </td>
                        <td class="text-center">
                            <span class="badge bg-light text-dark">${item.quantity}</span>
                        </td>
                        <td class="text-end">
                            <span class="text-muted">$${item.itemPrice.toFixed(2)}</span>
                        </td>
                        <td class="text-end fw-medium">
                            <span class="text-info">$${item.itemSubtotal.toFixed(2)}</span>
                        </td>
                        <td class="text-center">${orderPaymentMethod}</td>
                        <td class="text-center">${index === 0 ? statusBadge : ''}</td>
                    </tr>
                `;
            });
        });

        tbody.innerHTML = html;
        this.updateEnhancedReportTotals(totalItemPrice, totalItemSubtotal, totalOrderCount, this.detailedReportData.length);
        this.setupTableEnhancements();

        console.log('✅ Enhanced detailed report rendered successfully with', totalOrderCount, 'orders and', this.detailedReportData.length, 'items');
    }

    getStatusBadge(status) {
        const statusClasses = {
            'pending': 'bg-warning text-dark',
            'confirmed': 'bg-info',
            'processing': 'bg-primary',
            'completed': 'bg-success',
            'cancelled': 'bg-danger'
        };

        const className = statusClasses[status] || 'bg-secondary';
        return `<span class="badge ${className}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
    }

    getEnhancedStatusBadge(status) {
        const statusConfig = {
            'pending': { class: 'bg-warning text-dark', icon: 'fas fa-clock', text: 'Pending' },
            'confirmed': { class: 'bg-info', icon: 'fas fa-check-circle', text: 'Confirmed' },
            'processing': { class: 'bg-primary', icon: 'fas fa-cog fa-spin', text: 'Processing' },
            'completed': { class: 'bg-success', icon: 'fas fa-check-double', text: 'Completed' },
            'cancelled': { class: 'bg-danger', icon: 'fas fa-times-circle', text: 'Cancelled' },
            'ready': { class: 'bg-success', icon: 'fas fa-box-open', text: 'Ready' }
        };

        const config = statusConfig[status] || { class: 'bg-secondary', icon: 'fas fa-question', text: 'Unknown' };
        return `<span class="badge ${config.class}"><i class="${config.icon} me-1"></i>${config.text}</span>`;
    }

    getPaymentMethodBadge(paymentMethod) {
        const paymentConfig = {
            // Order schema payment methods
            'integrated': { class: 'bg-primary', icon: 'fas fa-credit-card', text: 'Integrated Payment' },
            'proof_upload': { class: 'bg-warning text-dark', icon: 'fas fa-upload', text: 'Payment Proof' },
            'cash': { class: 'bg-success', icon: 'fas fa-money-bill-wave', text: 'Cash' },
            'card': { class: 'bg-primary', icon: 'fas fa-credit-card', text: 'Card' },
            'mobile_money': { class: 'bg-info', icon: 'fas fa-mobile-alt', text: 'Mobile Money' },
            // Legacy payment methods
            'bank_transfer': { class: 'bg-info', icon: 'fas fa-university', text: 'Bank Transfer' },
            'paypal': { class: 'bg-primary', icon: 'fab fa-paypal', text: 'PayPal' },
            'telebirr': { class: 'bg-warning text-dark', icon: 'fas fa-mobile-alt', text: 'TeleBirr' },
            'cbe': { class: 'bg-info', icon: 'fas fa-university', text: 'CBE' }
        };

        const config = paymentConfig[paymentMethod?.toLowerCase()] || { class: 'bg-secondary', icon: 'fas fa-question', text: 'Unknown' };
        const displayText = paymentMethod === 'N/A' ? 'Not Specified' : (config.text || paymentMethod.replace('_', ' ').toUpperCase());

        return `<span class="badge ${config.class}"><i class="${config.icon} me-1"></i>${displayText}</span>`;
    }

    formatDateWithTime(dateString) {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleDateString('en-US', options);
    }

    createActionButtons(orderId, status) {
        const canEdit = ['pending', 'confirmed'].includes(status);
        const canCancel = ['pending', 'confirmed', 'processing'].includes(status);

        return `
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary btn-sm" onclick="window.AdminManager?.modules?.orderManagement?.viewOrder('${orderId}')" title="View Order">
                    <i class="fas fa-eye"></i>
                </button>
                ${canEdit ? `
                    <button class="btn btn-outline-secondary btn-sm" onclick="window.AdminManager?.modules?.orderManagement?.editOrder('${orderId}')" title="Edit Order">
                        <i class="fas fa-edit"></i>
                    </button>
                ` : ''}
                ${canCancel ? `
                    <button class="btn btn-outline-danger btn-sm" onclick="window.AdminManager?.modules?.orderManagement?.cancelOrder('${orderId}')" title="Cancel Order">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }

    getOrderPaymentMethod(order) {
        // Get payment method from the actual order data
        let paymentMethod = 'N/A';

        // Check various possible locations for payment method
        if (order.payment && order.payment.method) {
            paymentMethod = order.payment.method;
        } else if (order.paymentMethod) {
            paymentMethod = order.paymentMethod;
        } else if (order.paymentInfo && order.paymentInfo.method) {
            paymentMethod = order.paymentInfo.method;
        }

        console.log(`🔍 Payment method for order ${order.orderId}: ${paymentMethod}`, order.payment);

        return this.getPaymentMethodBadge(paymentMethod);
    }

    enhanceTableScrollability() {
        const tableContainer = document.querySelector('#detailedReportTable').closest('.table-responsive');
        if (!tableContainer) return;

        // Add enhanced scrollable styling
        tableContainer.style.maxHeight = '600px';
        tableContainer.style.overflowY = 'auto';
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.border = '1px solid #dee2e6';
        tableContainer.style.borderRadius = '0.375rem';

        // Add custom CSS for better scrolling experience
        if (!document.getElementById('reportTableStyles')) {
            const style = document.createElement('style');
            style.id = 'reportTableStyles';
            style.textContent = `
                .table-responsive {
                    scrollbar-width: thin;
                    scrollbar-color: #6c757d #f8f9fa;
                }

                .table-responsive::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .table-responsive::-webkit-scrollbar-track {
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                .table-responsive::-webkit-scrollbar-thumb {
                    background: #6c757d;
                    border-radius: 4px;
                }

                .table-responsive::-webkit-scrollbar-thumb:hover {
                    background: #495057;
                }

                .table-row-even {
                    background-color: #f8f9fa;
                }

                .table-row-odd {
                    background-color: #ffffff;
                }

                #detailedReportTable thead th {
                    position: sticky;
                    top: 0;
                    background-color: #e9ecef;
                    z-index: 10;
                    border-bottom: 2px solid #dee2e6;
                }

                #detailedReportTable tfoot th {
                    position: sticky;
                    bottom: 0;
                    background-color: #e9ecef;
                    z-index: 10;
                    border-top: 2px solid #dee2e6;
                }
            `;
            document.head.appendChild(style);
        }

        console.log('✅ Table scrollability enhanced');
    }

    updateReportTotals(totalRevenue, totalTax, totalDeliveryFee, totalOrders) {
        // Update the new report summary totals cards
        this.updateElement('reportTotalRevenue', '$' + totalRevenue.toFixed(2));
        this.updateElement('reportTotalTax', '$' + totalTax.toFixed(2));
        this.updateElement('reportTotalDeliveryFee', '$' + totalDeliveryFee.toFixed(2));
        this.updateElement('reportTotalOrders', totalOrders);

        // Also try alternative element IDs in case they exist
        this.updateElement('totalRevenue', '$' + totalRevenue.toFixed(2));
        this.updateElement('totalTax', '$' + totalTax.toFixed(2));
        this.updateElement('totalDeliveryFee', '$' + totalDeliveryFee.toFixed(2));
        this.updateElement('totalOrders', totalOrders);

        console.log('💰 Report totals updated:', {
            tax: totalTax.toFixed(2),
            deliveryFee: totalDeliveryFee.toFixed(2),
            revenue: totalRevenue.toFixed(2),
            orders: totalOrders
        });
    }

    updateEnhancedReportTotals(totalItemPrice, totalItemSubtotal, orderCount, itemCount) {
        this.updateElement('totalItemPrice', '$' + totalItemPrice.toFixed(2));
        this.updateElement('totalItemSubtotal', '$' + totalItemSubtotal.toFixed(2));
        this.updateElement('totalOrderCount', `${orderCount} Orders • ${itemCount} Items`);

        console.log('💰 Enhanced report totals updated:', {
            totalItemPrice: totalItemPrice.toFixed(2),
            totalItemSubtotal: totalItemSubtotal.toFixed(2),
            orderCount,
            itemCount
        });
    }

    setupTableEnhancements() {
        this.setupTableSearch();
        this.setupTableSorting();
        this.setupRowLimitControls();
        this.enhanceTableScrollability();
    }

    setupTableSearch() {
        const searchInput = document.getElementById('tableSearchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.searchable-row');

            rows.forEach(row => {
                const orderId = row.dataset.orderId || '';
                const customer = row.dataset.customer || '';
                const product = row.dataset.product || '';

                const matches = orderId.toLowerCase().includes(searchTerm) ||
                               customer.includes(searchTerm) ||
                               product.includes(searchTerm);

                row.style.display = matches ? '' : 'none';
            });

            // Update visible count
            const visibleRows = document.querySelectorAll('.searchable-row:not([style*="display: none"])').length;
            console.log(`🔍 Search: "${searchTerm}" - ${visibleRows} rows visible`);
        });
    }

    setupTableSorting() {
        const sortableHeaders = document.querySelectorAll('.sortable');

        sortableHeaders.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const sortKey = header.dataset.sort;
                this.sortTable(sortKey);
            });
        });
    }

    sortTable(sortKey) {
        const tbody = document.getElementById('detailedReportTableBody');
        const rows = Array.from(tbody.querySelectorAll('.searchable-row'));

        // Determine sort direction
        const currentSort = tbody.dataset.currentSort;
        const currentDirection = tbody.dataset.sortDirection || 'asc';
        const newDirection = (currentSort === sortKey && currentDirection === 'asc') ? 'desc' : 'asc';

        // Sort rows
        rows.sort((a, b) => {
            let aVal = this.getSortValue(a, sortKey);
            let bVal = this.getSortValue(b, sortKey);

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (newDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // Update DOM
        rows.forEach(row => tbody.appendChild(row));

        // Update sort indicators
        document.querySelectorAll('.sortable i.fa-sort, .sortable i.fa-sort-up, .sortable i.fa-sort-down').forEach(icon => {
            icon.className = 'fas fa-sort ms-1';
        });

        const activeHeader = document.querySelector(`[data-sort="${sortKey}"] i.fa-sort`);
        if (activeHeader) {
            activeHeader.className = `fas fa-sort-${newDirection === 'asc' ? 'up' : 'down'} ms-1`;
        }

        // Store sort state
        tbody.dataset.currentSort = sortKey;
        tbody.dataset.sortDirection = newDirection;

        console.log(`📊 Table sorted by ${sortKey} (${newDirection})`);
    }

    getSortValue(row, sortKey) {
        const cells = row.querySelectorAll('td');
        const cellIndex = this.getSortColumnIndex(sortKey);

        if (cellIndex === -1 || !cells[cellIndex]) return '';

        const cellText = cells[cellIndex].textContent.trim();

        // Handle different data types
        if (sortKey.includes('Price') || sortKey.includes('total') || sortKey.includes('Revenue')) {
            return parseFloat(cellText.replace(/[$,]/g, '')) || 0;
        }

        if (sortKey === 'quantity') {
            return parseInt(cellText) || 0;
        }

        if (sortKey === 'date') {
            return new Date(cellText).getTime() || 0;
        }

        return cellText;
    }

    getSortColumnIndex(sortKey) {
        const columnMap = {
            'orderId': 0,
            'customerName': 1,
            'customerType': 2,
            'date': 3,
            'productName': 4,
            'quantity': 5,
            'itemPrice': 6,
            'itemSubtotal': 7,
            'paymentMethod': 8,
            'status': 9
        };

        return columnMap[sortKey] || -1;
    }

    setupRowLimitControls() {
        const showAllBtn = document.getElementById('showAllRows');
        const showTop50Btn = document.getElementById('showTop50');
        const showTop100Btn = document.getElementById('showTop100');

        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => this.limitTableRows(null));
        }

        if (showTop50Btn) {
            showTop50Btn.addEventListener('click', () => this.limitTableRows(50));
        }

        if (showTop100Btn) {
            showTop100Btn.addEventListener('click', () => this.limitTableRows(100));
        }
    }

    limitTableRows(limit) {
        const rows = document.querySelectorAll('.searchable-row');

        rows.forEach((row, index) => {
            if (limit === null || index < limit) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Update button states
        document.querySelectorAll('#showAllRows, #showTop50, #showTop100').forEach(btn => {
            btn.classList.remove('active');
        });

        if (limit === null) {
            document.getElementById('showAllRows')?.classList.add('active');
        } else if (limit === 50) {
            document.getElementById('showTop50')?.classList.add('active');
        } else if (limit === 100) {
            document.getElementById('showTop100')?.classList.add('active');
        }

        console.log(`📋 Table limited to ${limit || 'all'} rows`);
    }

    updateDetailedReportTable() {
        if (!this.reportsData.sales || !this.reportsData.sales.data || !this.reportsData.sales.data.detailedOrders) {
            console.warn('⚠️ No detailed orders data available for table');
            return;
        }

        const tableBody = document.querySelector('#detailedReportTable tbody');
        if (!tableBody) {
            console.warn('⚠️ Detailed report table body not found');
            return;
        }

        const orders = this.reportsData.sales.data.detailedOrders;
        console.log('📋 Updating detailed report table with', orders.length, 'orders');

        tableBody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderNumber || order.orderId}</td>
                <td>${order.customerName || 'Unknown Customer'}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>$${(order.totalPrice || 0).toFixed(2)}</td>
                <td><span class="badge bg-${this.getStatusColor(order.status)}">${order.status || 'Pending'}</span></td>
                <td>${order.paymentMethod || 'N/A'}</td>
                <td>${order.deliveryMethod || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });

        console.log('✅ Detailed report table updated successfully');
    }

    updateInventoryReportDisplay() {
        if (!this.reportsData.inventory || !this.reportsData.inventory.data) {
            console.warn('⚠️ No inventory data available for display');
            return;
        }

        const inventoryData = this.reportsData.inventory.data;
        console.log('📦 Updating inventory report display:', inventoryData);

        // Update inventory summary cards if they exist
        this.updateElement('inventoryTotalItems', inventoryData.summary?.totalItems || 0);
        this.updateElement('inventoryLowStock', inventoryData.summary?.lowStockItems || 0);
        this.updateElement('inventoryTotalValue', `$${(inventoryData.summary?.totalValue || 0).toFixed(2)}`);

        // Update inventory table if it exists
        const inventoryTableBody = document.querySelector('#inventoryReportTable tbody');
        if (inventoryTableBody && inventoryData.allItems) {
            inventoryTableBody.innerHTML = '';

            inventoryData.allItems.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.category || 'N/A'}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit || 'units'}</td>
                    <td>${item.threshold}</td>
                    <td>$${(item.costPerUnit || 0).toFixed(2)}</td>
                    <td>$${(item.totalValue || 0).toFixed(2)}</td>
                    <td><span class="badge bg-${item.status === 'Low Stock' ? 'warning' : 'success'}">${item.status}</span></td>
                `;
                inventoryTableBody.appendChild(row);
            });
        }

        console.log('✅ Inventory report display updated');
    }

    updateCustomerReportDisplay() {
        if (!this.reportsData.customers || !this.reportsData.customers.data) {
            console.warn('⚠️ No customer data available for display');
            return;
        }

        const customerData = this.reportsData.customers.data;
        console.log('👥 Updating customer report display:', customerData);

        // Update customer summary cards if they exist
        this.updateElement('customerTotalCustomers', customerData.summary?.totalCustomers || 0);
        this.updateElement('customerActiveCustomers', customerData.summary?.activeCustomers || 0);
        this.updateElement('customerTotalRevenue', `$${(customerData.summary?.totalRevenue || 0).toFixed(2)}`);
        this.updateElement('customerAvgSpent', `$${(customerData.summary?.averageSpentPerCustomer || 0).toFixed(2)}`);

        // Update customer table if it exists
        const customerTableBody = document.querySelector('#customerReportTable tbody');
        if (customerTableBody && customerData.customers) {
            customerTableBody.innerHTML = '';

            customerData.customers.forEach(customer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${customer.name || 'Unknown'}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>${customer.orderCount}</td>
                    <td>$${(customer.totalSpent || 0).toFixed(2)}</td>
                    <td>${customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}</td>
                    <td><span class="badge bg-${customer.isGuest ? 'secondary' : 'primary'}">${customer.isGuest ? 'Guest' : 'Registered'}</span></td>
                `;
                customerTableBody.appendChild(row);
            });
        }

        console.log('✅ Customer report display updated');
    }

    getStatusColor(status) {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'delivered':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'danger';
            case 'processing':
                return 'info';
            default:
                return 'secondary';
        }
    }

    showNotification(message, type = 'info') {
        // Use the main notification system
        if (window.AdminManager && window.AdminManager.showNotification) {
            window.AdminManager.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Export for use in other modules
window.ReportsManagement = ReportsManagement;
