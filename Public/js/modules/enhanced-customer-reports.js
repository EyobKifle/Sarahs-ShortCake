/**
 * Enhanced Customer Reports Module
 * Provides comprehensive customer analytics and reporting
 */

class EnhancedCustomerReports {
    constructor() {
        this.currentData = null;
        this.currentFilters = {
            segment: 'all',
            sortBy: 'totalSpent',
            orderBy: 'desc',
            dateRange: 'all'
        };
        this.charts = {};
        this.init();
    }

    init() {
        console.log('🎯 Enhanced Customer Reports initialized');
        this.setupEventListeners();
        this.loadCustomerReport();
    }

    setupEventListeners() {
        // Filter controls
        document.addEventListener('change', (e) => {
            if (e.target.matches('#customerSegmentFilter')) {
                this.currentFilters.segment = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#customerSortBy')) {
                this.currentFilters.sortBy = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#customerOrderBy')) {
                this.currentFilters.orderBy = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#customerDateRange')) {
                this.currentFilters.dateRange = e.target.value;
                this.loadCustomerReport();
            }
        });

        // Search functionality
        document.addEventListener('input', (e) => {
            if (e.target.matches('#customerSearchInput')) {
                this.searchCustomers(e.target.value);
            }
        });

        // Export functionality
        document.addEventListener('click', (e) => {
            if (e.target.matches('#exportCustomerReport')) {
                this.exportReport();
            }
            if (e.target.matches('#refreshCustomerReport')) {
                this.loadCustomerReport();
            }
        });
    }

    async loadCustomerReport() {
        try {
            this.showLoading(true);

            // Calculate date range
            const dateRange = this.getDateRange(this.currentFilters.dateRange);

            const params = new URLSearchParams({
                segment: this.currentFilters.segment,
                sortBy: this.currentFilters.sortBy,
                orderBy: this.currentFilters.orderBy,
                ...dateRange
            });

            const response = await window.apiClient.getCustomerReport(params.toString());

            if (response && response.data) {
                this.currentData = response.data;
                this.renderCustomerReport();
                this.renderCustomerCharts();
                this.showNotification('Customer report loaded successfully', 'success');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error loading customer report:', error);
            this.showNotification('Error loading customer report: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderCustomerReport() {
        if (!this.currentData) return;

        // Render basic summary cards
        this.renderBasicSummaryCards();

        // Render customer table
        this.renderCustomerTable();

        // Render top customers
        this.renderTopCustomers();
    }

    renderBasicSummaryCards() {
        const { summary } = this.currentData;

        const summaryHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h6 class="card-title">Total Customers</h6>
                                    <h3 class="mb-0">${summary.totalCustomers}</h3>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-users fa-2x opacity-75"></i>
                                </div>
                            </div>
                            <small class="mt-2 d-block">
                                <i class="fas fa-user-plus me-1"></i>
                                ${summary.registeredCustomers} registered
                            </small>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card bg-success text-white h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h6 class="card-title">Active Customers</h6>
                                    <h3 class="mb-0">${summary.activeCustomers}</h3>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-user-check fa-2x opacity-75"></i>
                                </div>
                            </div>
                            <small class="mt-2 d-block">
                                <i class="fas fa-percentage me-1"></i>
                                ${((summary.activeCustomers / summary.totalCustomers) * 100).toFixed(1)}% active rate
                            </small>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card bg-warning text-white h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h6 class="card-title">Average Order</h6>
                                    <h3 class="mb-0">$${summary.averageOrderValue.toFixed(2)}</h3>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-shopping-cart fa-2x opacity-75"></i>
                                </div>
                            </div>
                            <small class="mt-2 d-block">
                                <i class="fas fa-calculator me-1"></i>
                                Average order value
                            </small>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card bg-info text-white h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h6 class="card-title">Total Revenue</h6>
                                    <h3 class="mb-0">$${summary.totalRevenue.toFixed(2)}</h3>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-dollar-sign fa-2x opacity-75"></i>
                                </div>
                            </div>
                            <small class="mt-2 d-block">
                                <i class="fas fa-chart-line me-1"></i>
                                $${summary.averageSpentPerCustomer.toFixed(2)} avg per customer
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const summaryContainer = document.getElementById('customerSummaryCards');
        if (summaryContainer) {
            summaryContainer.innerHTML = summaryHTML;
        }
    }

    renderCustomerTable() {
        const { customers } = this.currentData;

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Customer</th>
                            <th>Segment</th>
                            <th>Status</th>
                            <th>Orders</th>
                            <th>Total Spent</th>
                            <th>Avg Order</th>
                            <th>Last Order</th>
                            <th>Frequency</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(customer => `
                            <tr>
                                <td>
                                    <div>
                                        <strong>${customer.name}</strong>
                                        <br>
                                        <small class="text-muted">${customer.email}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge ${this.getSegmentBadgeClass(customer.segment)}">
                                        ${customer.segment}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge ${this.getStatusBadgeClass(customer.status)}">
                                        ${customer.status}
                                    </span>
                                </td>
                                <td>${customer.orderCount}</td>
                                <td>$${customer.totalSpent.toFixed(2)}</td>
                                <td>$${customer.avgOrderValue.toFixed(2)}</td>
                                <td>
                                    ${customer.lastOrderDate ?
                                        new Date(customer.lastOrderDate).toLocaleDateString() :
                                        'Never'
                                    }
                                    ${customer.daysSinceLastOrder ?
                                        `<br><small class="text-muted">${customer.daysSinceLastOrder} days ago</small>` :
                                        ''
                                    }
                                </td>
                                <td>${customer.orderFrequency.toFixed(2)}/month</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="customerReports.viewCustomerDetails('${customer._id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="customerReports.contactCustomer('${customer._id}')">
                                            <i class="fas fa-envelope"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const tableContainer = document.getElementById('customerTableContainer');
        if (tableContainer) {
            tableContainer.innerHTML = tableHTML;
        }
    }

    getSegmentBadgeClass(segment) {
        const classes = {
            'VIP': 'bg-danger',
            'Loyal': 'bg-warning',
            'Regular': 'bg-info',
            'New': 'bg-success',
            'Inactive': 'bg-secondary'
        };
        return classes[segment] || 'bg-secondary';
    }

    getStatusBadgeClass(status) {
        const classes = {
            'Active': 'bg-success',
            'At Risk': 'bg-warning',
            'Inactive': 'bg-danger',
            'Never Ordered': 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    }

    renderTopCustomers() {
        const { topCustomers } = this.currentData;

        const topCustomersHTML = `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-crown me-2"></i>Top Customers</h6>
                </div>
                <div class="card-body">
                    <div class="list-group list-group-flush">
                        ${topCustomers.map((customer, index) => `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="badge bg-primary rounded-pill me-2">${index + 1}</span>
                                    <strong>${customer.name}</strong>
                                    <br>
                                    <small class="text-muted">${customer.orderCount} orders</small>
                                </div>
                                <div class="text-end">
                                    <h6 class="mb-0 text-success">$${customer.totalSpent.toFixed(2)}</h6>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const topCustomersContainer = document.getElementById('topCustomersContainer');
        if (topCustomersContainer) {
            topCustomersContainer.innerHTML = topCustomersHTML;
        }
    }



    // Utility methods
    getDateRange(range) {
        const end = new Date();
        let start = new Date();

        switch (range) {
            case 'week':
                start.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setMonth(end.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(end.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(end.getFullYear() - 1);
                break;
            default:
                return {};
        }

        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    }

    showLoading(show) {
        const loader = document.getElementById('customerReportLoader');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    showNotification(message, type) {
        // Implementation depends on your notification system
        console.log(`${type.toUpperCase()}: ${message}`);

        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    applyFilters() {
        this.loadCustomerReport();
    }

    searchCustomers(searchTerm) {
        if (!this.currentData || !this.currentData.customers) return;

        const filteredCustomers = this.currentData.customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Update table with filtered results
        this.renderCustomerTableWithData(filteredCustomers);
    }

    renderCustomerTableWithData(customers) {
        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Customer</th>
                            <th>Segment</th>
                            <th>Status</th>
                            <th>Orders</th>
                            <th>Total Spent</th>
                            <th>Avg Order</th>
                            <th>Last Order</th>
                            <th>Frequency</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(customer => `
                            <tr>
                                <td>
                                    <div>
                                        <strong>${customer.name}</strong>
                                        <br>
                                        <small class="text-muted">${customer.email}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge ${this.getSegmentBadgeClass(customer.segment)}">
                                        ${customer.segment}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge ${this.getStatusBadgeClass(customer.status)}">
                                        ${customer.status}
                                    </span>
                                </td>
                                <td>${customer.orderCount}</td>
                                <td>$${customer.totalSpent.toFixed(2)}</td>
                                <td>$${customer.avgOrderValue.toFixed(2)}</td>
                                <td>
                                    ${customer.lastOrderDate ?
                                        new Date(customer.lastOrderDate).toLocaleDateString() :
                                        'Never'
                                    }
                                    ${customer.daysSinceLastOrder ?
                                        `<br><small class="text-muted">${customer.daysSinceLastOrder} days ago</small>` :
                                        ''
                                    }
                                </td>
                                <td>${customer.orderFrequency.toFixed(2)}/month</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="customerReports.viewCustomerDetails('${customer._id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="customerReports.contactCustomer('${customer._id}')">
                                            <i class="fas fa-envelope"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const tableContainer = document.getElementById('customerTableContainer');
        if (tableContainer) {
            tableContainer.innerHTML = tableHTML;
        }
    }

    viewCustomerDetails(customerId) {
        // Implementation for viewing customer details
        console.log('View customer details:', customerId);
        this.showNotification('Customer details feature coming soon', 'info');
    }

    contactCustomer(customerId) {
        // Implementation for contacting customer
        console.log('Contact customer:', customerId);
        this.showNotification('Contact customer feature coming soon', 'info');
    }

    async exportReport() {
        try {
            this.showNotification('Preparing customer report export...', 'info');

            if (!this.currentData || !this.currentData.customers) {
                this.showNotification('No data available to export', 'warning');
                return;
            }

            // Create CSV content
            const headers = ['Name', 'Email', 'Segment', 'Status', 'Order Count', 'Total Spent', 'Avg Order Value', 'Last Order Date', 'Order Frequency'];
            const csvContent = [
                headers.join(','),
                ...this.currentData.customers.map(customer => [
                    `"${customer.name}"`,
                    `"${customer.email}"`,
                    `"${customer.segment}"`,
                    `"${customer.status}"`,
                    customer.orderCount,
                    customer.totalSpent.toFixed(2),
                    customer.avgOrderValue.toFixed(2),
                    customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never',
                    customer.orderFrequency.toFixed(2)
                ].join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `customer-report-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Customer report exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Error exporting report: ' + error.message, 'error');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.customerReports === 'undefined') {
        window.customerReports = new EnhancedCustomerReports();
    }
});
