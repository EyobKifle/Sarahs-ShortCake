/**
 * Enhanced Inventory Reports Module
 * Provides comprehensive inventory analytics and reporting
 */

class EnhancedInventoryReports {
    constructor() {
        this.currentData = null;
        this.currentFilters = {
            category: 'all',
            status: 'all',
            sortBy: 'name',
            orderBy: 'asc'
        };
        this.charts = {};
        this.init();
    }

    init() {
        console.log('📦 Enhanced Inventory Reports initialized');
        this.setupEventListeners();
        this.loadInventoryReport();
    }

    setupEventListeners() {
        // Filter controls
        document.addEventListener('change', (e) => {
            if (e.target.matches('#inventoryCategoryFilter')) {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#inventoryStatusFilter')) {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#inventorySortBy')) {
                this.currentFilters.sortBy = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#inventoryOrderBy')) {
                this.currentFilters.orderBy = e.target.value;
                this.applyFilters();
            }
        });

        // Search functionality
        document.addEventListener('input', (e) => {
            if (e.target.matches('#inventorySearchInput')) {
                this.searchInventory(e.target.value);
            }
        });

        // Action buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('#refreshInventoryReport')) {
                this.loadInventoryReport();
            }
            if (e.target.matches('#exportInventoryReport')) {
                this.exportReport();
            }
        });
    }

    async loadInventoryReport() {
        try {
            this.showLoading(true);

            const params = new URLSearchParams(this.currentFilters);
            const response = await window.apiClient.getInventoryReport(params.toString());

            if (response && response.data) {
                this.currentData = response.data;
                this.renderInventoryReport();
                this.renderInventoryCharts();
                this.showNotification('Inventory report loaded successfully', 'success');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error loading inventory report:', error);
            this.showNotification('Error loading inventory report: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderInventoryReport() {
        if (!this.currentData) return;

        // Render basic summary cards
        this.renderBasicSummaryCards();

        // Render inventory table
        this.renderInventoryTable();

        // Render category breakdown
        this.renderCategoryBreakdown();
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
                                    <h6 class="card-title">Total Items</h6>
                                    <h3 class="mb-0">${summary.totalItems}</h3>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-boxes fa-2x opacity-75"></i>
                                </div>
                            </div>
                            <small class="mt-2 d-block">
                                <i class="fas fa-chart-line me-1"></i>
                                Inventory items tracked
                            </small>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card bg-success text-white h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h6 class="card-title">In Stock</h6>
                                    <h3 class="mb-0">${summary.inStockItems}</h3>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-check-circle fa-2x opacity-75"></i>
                                </div>
                            </div>
                            <small class="mt-2 d-block">
                                <i class="fas fa-percentage me-1"></i>
                                ${((summary.inStockItems / summary.totalItems) * 100).toFixed(1)}% healthy stock
                            </small>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card bg-warning text-white h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h6 class="card-title">Low Stock</h6>
                                    <h3 class="mb-0">${summary.lowStockItems}</h3>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-exclamation-triangle fa-2x opacity-75"></i>
                                </div>
                            </div>
                            <small class="mt-2 d-block">
                                <i class="fas fa-info-circle me-1"></i>
                                Need attention
                            </small>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card bg-info text-white h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <h6 class="card-title">Total Value</h6>
                                    <h3 class="mb-0">$${summary.totalValue.toFixed(2)}</h3>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-dollar-sign fa-2x opacity-75"></i>
                                </div>
                            </div>
                            <small class="mt-2 d-block">
                                <i class="fas fa-calculator me-1"></i>
                                Total inventory value
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const summaryContainer = document.getElementById('inventorySummaryCards');
        if (summaryContainer) {
            summaryContainer.innerHTML = summaryHTML;
        }
    }

    renderInventoryTable() {
        const { items } = this.currentData;

        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Item</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Value</th>
                            <th>Supplier</th>
                            <th>Location</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr class="${this.getRowClass(item.status)}">
                                <td>
                                    <div>
                                        <strong>${item.name}</strong>
                                        <br>
                                        <small class="text-muted">${item.unit}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-secondary">${item.category}</span>
                                </td>
                                <td>
                                    <div>
                                        <strong>${item.quantity}</strong>
                                        <br>
                                        <small class="text-muted">Threshold: ${item.threshold}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge ${this.getStatusBadgeClass(item.status)}">
                                        ${item.status}
                                    </span>
                                </td>
                                <td>
                                    <div>
                                        <strong>$${item.totalValue.toFixed(2)}</strong>
                                        <br>
                                        <small class="text-muted">$${item.costPerUnit.toFixed(2)}/${item.unit}</small>
                                    </div>
                                </td>
                                <td>${item.supplier || 'N/A'}</td>
                                <td>
                                    <small class="text-muted">${item.location || 'N/A'}</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="inventoryReports.viewItemDetails('${item._id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="inventoryReports.restockItem('${item._id}')">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="inventoryReports.viewHistory('${item._id}')">
                                            <i class="fas fa-history"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const tableContainer = document.getElementById('inventoryTableContainer');
        if (tableContainer) {
            tableContainer.innerHTML = tableHTML;
        }
    }



    renderCategoryBreakdown() {
        const { categories } = this.currentData;

        const categoryHTML = `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-layer-group me-2"></i>Category Breakdown</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${Object.entries(categories).map(([category, data]) => `
                            <div class="col-md-6 mb-3">
                                <div class="border rounded p-3">
                                    <h6 class="mb-2">${category}</h6>
                                    <div class="row text-center">
                                        <div class="col-3">
                                            <small class="text-muted">Items</small>
                                            <div><strong>${data.count}</strong></div>
                                        </div>
                                        <div class="col-3">
                                            <small class="text-muted">Value</small>
                                            <div><strong>$${data.value.toFixed(0)}</strong></div>
                                        </div>
                                        <div class="col-3">
                                            <small class="text-muted">Low</small>
                                            <div class="text-warning"><strong>${data.lowStock}</strong></div>
                                        </div>
                                        <div class="col-3">
                                            <small class="text-muted">Out</small>
                                            <div class="text-danger"><strong>${data.outOfStock}</strong></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const categoryContainer = document.getElementById('categoryBreakdownContainer');
        if (categoryContainer) {
            categoryContainer.innerHTML = categoryHTML;
        }
    }



    // Utility methods

    getStatusBadgeClass(status) {
        const classes = {
            'In Stock': 'bg-success',
            'Low Stock': 'bg-warning',
            'Out of Stock': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    getRowClass(status) {
        if (status === 'Out of Stock') return 'table-danger';
        if (status === 'Low Stock') return 'table-warning';
        return '';
    }

    showLoading(show) {
        const loader = document.getElementById('inventoryReportLoader');
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
        this.loadInventoryReport();
    }

    searchInventory(searchTerm) {
        if (!this.currentData || !this.currentData.items) return;

        const filteredItems = this.currentData.items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Update table with filtered results
        this.renderInventoryTableWithData(filteredItems);
    }

    renderInventoryTableWithData(items) {
        const tableHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>Item</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Value</th>
                            <th>Supplier</th>
                            <th>Days Until Empty</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr class="${this.getRowClass(item.status)}">
                                <td>
                                    <div>
                                        <strong>${item.name}</strong>
                                        <br>
                                        <small class="text-muted">${item.unit}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-secondary">${item.category}</span>
                                </td>
                                <td>
                                    <div>
                                        <strong>${item.quantity}</strong>
                                        <br>
                                        <small class="text-muted">Threshold: ${item.threshold}</small>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge ${this.getStatusBadgeClass(item.status)}">
                                        ${item.status}
                                    </span>
                                </td>
                                <td>
                                    <div>
                                        <strong>$${item.totalValue.toFixed(2)}</strong>
                                        <br>
                                        <small class="text-muted">$${item.costPerUnit.toFixed(2)}/${item.unit}</small>
                                    </div>
                                </td>
                                <td>${item.supplier || 'N/A'}</td>
                                <td>
                                    ${item.daysUntilEmpty ?
                                        `<span class="badge ${item.daysUntilEmpty < 7 ? 'bg-danger' : item.daysUntilEmpty < 14 ? 'bg-warning' : 'bg-success'}">
                                            ${item.daysUntilEmpty} days
                                        </span>` :
                                        '<span class="text-muted">N/A</span>'
                                    }
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="inventoryReports.viewItemDetails('${item._id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="inventoryReports.restockItem('${item._id}')">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="inventoryReports.viewHistory('${item._id}')">
                                            <i class="fas fa-history"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const tableContainer = document.getElementById('inventoryTableContainer');
        if (tableContainer) {
            tableContainer.innerHTML = tableHTML;
        }
    }

    viewItemDetails(itemId) {
        // Implementation for viewing item details
        console.log('View item details:', itemId);
        this.showNotification('Item details feature coming soon', 'info');
    }

    restockItem(itemId) {
        // Implementation for restocking item
        console.log('Restock item:', itemId);
        this.showNotification('Restock feature coming soon', 'info');
    }

    viewHistory(itemId) {
        // Implementation for viewing item history
        console.log('View item history:', itemId);
        this.showNotification('History feature coming soon', 'info');
    }

    showAllRestockAlerts() {
        // Implementation for showing all restock alerts
        console.log('Show all restock alerts');
        this.showNotification('Full restock alerts view coming soon', 'info');
    }

    async exportReport() {
        try {
            this.showNotification('Preparing inventory report export...', 'info');

            if (!this.currentData || !this.currentData.items) {
                this.showNotification('No data available to export', 'warning');
                return;
            }

            // Create CSV content
            const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Status', 'Cost Per Unit', 'Total Value', 'Supplier', 'Location'];
            const csvContent = [
                headers.join(','),
                ...this.currentData.items.map(item => [
                    `"${item.name}"`,
                    `"${item.category}"`,
                    item.quantity,
                    `"${item.unit}"`,
                    `"${item.status}"`,
                    item.costPerUnit.toFixed(2),
                    item.totalValue.toFixed(2),
                    `"${item.supplier || ''}"`,
                    `"${item.location || ''}"`
                ].join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Inventory report exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Error exporting report: ' + error.message, 'error');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.inventoryReports === 'undefined') {
        window.inventoryReports = new EnhancedInventoryReports();
    }
});
