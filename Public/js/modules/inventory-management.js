// Inventory Management Module
class InventoryManagement {
    constructor() {
        this.inventory = [];
        this.filteredInventory = [];
    }

    async loadInventory() {
        try {
            console.log('🔄 Loading inventory from backend API...');

            // Add custom CSS for better table styling
            this.addInventoryTableStyles();

            // Use API client to get all inventory items
            const data = await window.apiClient.getAllInventoryItems();
            this.inventory = data.data || data || [];
            this.filteredInventory = [...this.inventory];

            console.log(`📦 Loaded ${this.inventory.length} inventory items`);

            // Update inventory statistics
            this.updateInventoryStats();
            this.renderInventoryTable();

            return this.inventory;
        } catch (error) {
            console.error('❌ Error loading inventory:', error);
            this.showNotification('Error loading inventory: ' + error.message, 'error');
            return [];
        }
    }

    addInventoryTableStyles() {
        // Add custom styles for inventory table if not already added
        if (!document.getElementById('inventoryTableStyles')) {
            const style = document.createElement('style');
            style.id = 'inventoryTableStyles';
            style.textContent = `
                #inventoryTable {
                    font-size: 0.9rem;
                    border-collapse: separate;
                    border-spacing: 0;
                }

                #inventoryTable thead th {
                    background-color: #f8f9fa !important;
                    border-bottom: 2px solid #dee2e6;
                    font-weight: 600;
                    font-size: 0.85rem;
                    padding: 12px 8px;
                    vertical-align: middle;
                    white-space: nowrap;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                #inventoryTable tbody td {
                    padding: 12px 8px;
                    vertical-align: middle;
                    border-bottom: 1px solid #f0f0f0;
                }

                #inventoryTable tbody tr:hover {
                    background-color: #f8f9fa;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: all 0.2s ease;
                }

                #inventoryTable .btn-group-sm .btn {
                    padding: 0.25rem 0.4rem;
                    font-size: 0.75rem;
                    margin: 0 1px;
                    border-radius: 4px;
                }

                #inventoryTable .progress {
                    height: 6px;
                    border-radius: 3px;
                    background-color: #e9ecef;
                }

                #inventoryTable .badge {
                    font-size: 0.75rem;
                    padding: 0.35em 0.65em;
                    border-radius: 6px;
                }

                .table-responsive {
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    max-height: 70vh;
                    overflow-y: auto;
                }

                .form-check-input:checked {
                    background-color: #0d6efd;
                    border-color: #0d6efd;
                }

                /* Improve button spacing and alignment */
                .btn-group-sm .btn + .btn {
                    margin-left: 2px;
                }

                /* Better text alignment for numeric columns */
                #inventoryTable td:nth-child(8),
                #inventoryTable td:nth-child(9) {
                    text-align: right;
                }

                #inventoryTable td:nth-child(3),
                #inventoryTable td:nth-child(5),
                #inventoryTable td:nth-child(6),
                #inventoryTable td:nth-child(7),
                #inventoryTable td:nth-child(10) {
                    text-align: center;
                }
            `;
            document.head.appendChild(style);
        }
    }

    updateInventoryStats() {
        const totalItems = this.inventory.length;
        const lowStockItems = this.inventory.filter(item =>
            item.quantity <= item.threshold && item.threshold > 0 && item.quantity > 0
        );
        const outOfStockItems = this.inventory.filter(item => item.quantity === 0);
        const totalValue = this.inventory.reduce((sum, item) =>
            sum + (item.quantity * (item.costPerUnit || 0)), 0
        );

        // Update stats in the UI
        this.updateElement('totalInventoryItems', totalItems);
        this.updateElement('lowStockItems', lowStockItems.length);
        this.updateElement('outOfStockItems', outOfStockItems.length);
        this.updateElement('totalInventoryValue', `$${totalValue.toFixed(2)}`);

        console.log(`📊 Inventory Stats: ${totalItems} total, ${lowStockItems.length} low stock, ${outOfStockItems.length} out of stock`);

        // Store low stock items for alerts
        this.lowStockItems = lowStockItems;
        this.outOfStockItems = outOfStockItems;
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    async addInventoryItem(itemData) {
        try {
            console.log('➕ Adding new inventory item:', itemData);

            const response = await window.apiClient.createInventoryItem(itemData);

            if (response.success) {
                this.showNotification('Inventory item added successfully', 'success');
                await this.loadInventory(); // Reload to get updated data
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to add inventory item');
            }
        } catch (error) {
            console.error('❌ Error adding inventory item:', error);
            this.showNotification('Error adding inventory item: ' + error.message, 'error');
            throw error;
        }
    }

    async updateInventoryItem(id, itemData) {
        try {
            console.log('✏️ Updating inventory item:', id, itemData);

            const response = await window.apiClient.updateInventoryItem(id, itemData);

            if (response.success) {
                this.showNotification('Inventory item updated successfully', 'success');
                await this.loadInventory(); // Reload to get updated data
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to update inventory item');
            }
        } catch (error) {
            console.error('❌ Error updating inventory item:', error);
            this.showNotification('Error updating inventory item: ' + error.message, 'error');
            throw error;
        }
    }

    async deleteInventoryItem(id) {
        try {
            console.log('🗑️ Deleting inventory item:', id);

            const response = await window.apiClient.deleteInventoryItem(id);

            if (response.success) {
                this.showNotification('Inventory item deleted successfully', 'success');
                await this.loadInventory(); // Reload to get updated data
                return true;
            } else {
                throw new Error(response.message || 'Failed to delete inventory item');
            }
        } catch (error) {
            console.error('❌ Error deleting inventory item:', error);
            this.showNotification('Error deleting inventory item: ' + error.message, 'error');
            throw error;
        }
    }

    async restockInventoryItem(id, quantity, notes = '') {
        try {
            console.log('📦 Restocking inventory item:', id, 'quantity:', quantity);

            const response = await window.apiClient.restockInventoryItem(id, { quantity, notes });

            if (response.success) {
                this.showNotification(`Successfully restocked ${quantity} units`, 'success');
                await this.loadInventory(); // Reload to get updated data
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to restock inventory item');
            }
        } catch (error) {
            console.error('❌ Error restocking inventory item:', error);
            this.showNotification('Error restocking inventory item: ' + error.message, 'error');
            throw error;
        }
    }

    renderInventoryTable() {
        const tbody = document.querySelector('#inventoryTable tbody');
        if (!tbody) return;

        if (this.filteredInventory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-5">
                        <i class="fas fa-box-open text-muted fs-1"></i>
                        <p class="text-muted mt-3 mb-0">No inventory items found</p>
                        <small class="text-muted">Try adjusting your search or filters</small>
                    </td>
                </tr>
            `;
            return;
        }

        const html = this.filteredInventory.map(item => {
            const stockStatus = this.getStockStatus(item);
            const lastUpdated = item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A';
            const totalValue = (item.quantity || 0) * (item.costPerUnit || 0);

            return `
                <tr class="${stockStatus.rowClass}">
                    <td>
                        <input type="checkbox" class="form-check-input item-checkbox" value="${item._id}">
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                <div class="bg-primary bg-opacity-10 p-2 rounded">
                                    <i class="fas fa-cube text-primary"></i>
                                </div>
                            </div>
                            <div>
                                <h6 class="mb-0 fw-semibold">${item.name || 'Unknown Item'}</h6>
                                <small class="text-muted">${item.description || 'No description available'}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-secondary bg-opacity-10 text-dark px-2 py-1">
                            ${item.category || 'Uncategorized'}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="fw-bold fs-5 me-2 ${stockStatus.quantityClass}">${item.quantity || 0}</span>
                            <small class="text-muted">${item.unit || 'units'}</small>
                        </div>
                    </td>
                    <td><small class="text-muted">${item.unit || 'units'}</small></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="me-2">${item.threshold || 10}</span>
                            <div class="progress" style="width: 50px; height: 4px;">
                                <div class="progress-bar ${stockStatus.status === 'out-of-stock' ? 'bg-danger' : stockStatus.status === 'low-stock' ? 'bg-warning' : 'bg-success'}"
                                     style="width: ${Math.min(100, ((item.quantity || 0) / (item.threshold || 1)) * 100)}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <small class="text-muted">${item.supplier || 'Not specified'}</small>
                    </td>
                    <td>
                        <span class="text-success fw-semibold">$${(item.costPerUnit || 0).toFixed(2)}</span>
                    </td>
                    <td>
                        <span class="text-primary fw-bold">$${totalValue.toFixed(2)}</span>
                    </td>
                    <td>
                        <small class="text-muted">${lastUpdated}</small>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-sm" onclick="inventoryManager.editItem('${item._id}')" title="Edit Item">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="inventoryManager.restockItem('${item._id}')" title="Restock">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="inventoryManager.viewHistory('${item._id}')" title="View History">
                                <i class="fas fa-history"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="inventoryManager.deleteItem('${item._id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
        this.updateCheckboxListeners();
        this.updateInventoryCount();
    }

    getStockStatus(item) {
        const quantity = item.quantity || 0;
        const threshold = item.threshold || 10;

        if (quantity <= 0) {
            return {
                status: 'out-of-stock',
                rowClass: 'table-danger',
                quantityClass: 'text-danger fw-bold'
            };
        } else if (quantity <= threshold) {
            return {
                status: 'low-stock',
                rowClass: 'table-warning',
                quantityClass: 'text-warning fw-bold'
            };
        } else {
            return {
                status: 'in-stock',
                rowClass: '',
                quantityClass: 'text-success'
            };
        }
    }

    filterInventory(searchTerm, categoryFilter, stockFilter) {
        // Get filter values from UI if not provided
        if (arguments.length === 0) {
            searchTerm = document.getElementById('inventorySearch')?.value || '';
            categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
            stockFilter = document.getElementById('stockFilter')?.value || 'all';
        }

        this.filteredInventory = this.inventory.filter(item => {
            // Search filter
            const searchMatch = !searchTerm ||
                (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Category filter
            const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;

            // Stock filter
            let stockMatch = true;
            if (stockFilter !== 'all') {
                const stockStatus = this.getStockStatus(item);
                stockMatch = stockStatus.status === stockFilter;
            }

            return searchMatch && categoryMatch && stockMatch;
        });

        this.renderInventoryTable();
        this.updateInventoryCount();
    }

    clearFilters() {
        // Reset all filter controls
        const searchInput = document.getElementById('inventorySearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const stockFilter = document.getElementById('stockFilter');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (stockFilter) stockFilter.value = 'all';

        // Reset filtered inventory to show all items
        this.filteredInventory = [...this.inventory];
        this.renderInventoryTable();
        this.updateInventoryCount();
        this.showNotification('Filters cleared', 'info');
    }

    updateInventoryCount() {
        const countElement = document.getElementById('inventoryCount');
        const lastUpdatedElement = document.getElementById('inventoryLastUpdated');

        if (countElement) {
            countElement.textContent = this.filteredInventory.length;
        }

        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    async restockItem(itemId) {
        const item = this.inventory.find(i => i._id === itemId);
        if (!item) {
            this.showNotification('Item not found', 'error');
            return;
        }

        this.showRestockModal(item);
    }

    editItem(itemId) {
        const item = this.inventory.find(i => i._id === itemId);
        if (!item) {
            this.showNotification('Item not found', 'error');
            return;
        }

        this.showEditModal(item);
    }

    async deleteItem(itemId) {
        const item = this.inventory.find(i => i._id === itemId);
        if (!item) {
            this.showNotification('Item not found', 'error');
            return;
        }

        this.showDeleteModal(item);
    }

    showLowStockItems() {
        this.filterInventory('', 'all', 'low-stock');
        this.showNotification('Showing low stock items', 'info');
    }

    updateCheckboxListeners() {
        // Select all checkbox functionality
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                itemCheckboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
                this.updateBulkActions();
            });
        }

        itemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateBulkActions();
            });
        });
    }

    updateBulkActions() {
        const selectedItems = document.querySelectorAll('.item-checkbox:checked');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = selectedItems.length === 0;
            bulkDeleteBtn.textContent = selectedItems.length > 0
                ? `Delete Selected (${selectedItems.length})`
                : 'Delete Selected';
        }
    }

    async bulkDeleteItems() {
        const selectedItems = document.querySelectorAll('.item-checkbox:checked');
        if (selectedItems.length === 0) return;

        const itemIds = Array.from(selectedItems).map(checkbox => checkbox.value);
        const confirmMessage = `Are you sure you want to delete ${itemIds.length} item(s)? This action cannot be undone.`;

        if (!confirm(confirmMessage)) return;

        try {
            for (const itemId of itemIds) {
                await window.apiClient.deleteInventoryItem(itemId);
            }

            this.showNotification(`Successfully deleted ${itemIds.length} item(s)`, 'success');
            this.loadInventory();
        } catch (error) {
            console.error('Error deleting items:', error);
            this.showNotification('Error deleting items: ' + error.message, 'error');
        }
    }

    async viewHistory(itemId) {
        const item = this.inventory.find(i => i._id === itemId);
        if (!item) {
            this.showNotification('Item not found', 'error');
            return;
        }

        try {
            const response = await window.apiClient.getInventoryItemHistory(itemId);
            if (response.success) {
                this.showHistoryModal(response.data);
            } else {
                throw new Error(response.message || 'Failed to load history');
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this.showNotification('Error loading history: ' + error.message, 'error');
        }
    }

    showLowStockAlert() {
        const lowStockModal = new bootstrap.Modal(document.getElementById('lowStockModal'));
        const lowStockTableBody = document.getElementById('lowStockTableBody');

        if (this.lowStockItems && this.lowStockItems.length > 0) {
            lowStockTableBody.innerHTML = this.lowStockItems.map(item => {
                const stockStatus = this.getStockStatus(item);
                return `
                    <tr>
                        <td>${item.name}</td>
                        <td class="${stockStatus.quantityClass}">${item.quantity} ${item.unit}</td>
                        <td>${item.threshold}</td>
                        <td>
                            <span class="badge ${stockStatus.status === 'out-of-stock' ? 'bg-danger' : 'bg-warning'}">
                                ${stockStatus.status === 'out-of-stock' ? 'Out of Stock' : 'Low Stock'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-success" onclick="inventoryManager.restockItem('${item._id}')">
                                <i class="fas fa-plus me-1"></i> Restock
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            lowStockTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No low stock items found</td></tr>';
        }

        lowStockModal.show();
    }

    showAddItemModal() {
        const modalHtml = `
            <div class="modal fade" id="addItemModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-plus-circle text-success me-2"></i>
                                Add New Inventory Item
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addItemForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="addItemName" class="form-label">Item Name *</label>
                                        <input type="text" class="form-control" id="addItemName" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="addItemCategory" class="form-label">Category</label>
                                        <select class="form-select" id="addItemCategory">
                                            <option value="">Select Category</option>
                                            <option value="Flour">Flour</option>
                                            <option value="Sugar">Sugar</option>
                                            <option value="Dairy">Dairy</option>
                                            <option value="Eggs">Eggs</option>
                                            <option value="Flavoring">Flavoring</option>
                                            <option value="Decoration">Decoration</option>
                                            <option value="Packaging">Packaging</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="addItemDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="addItemDescription" rows="2" placeholder="Enter item description..."></textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label for="addItemQuantity" class="form-label">Initial Quantity *</label>
                                        <input type="number" class="form-control" id="addItemQuantity" min="0" step="0.01" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="addItemUnit" class="form-label">Unit *</label>
                                        <select class="form-select" id="addItemUnit" required>
                                            <option value="">Select Unit</option>
                                            <option value="kg">Kilograms (kg)</option>
                                            <option value="g">Grams (g)</option>
                                            <option value="L">Liters (L)</option>
                                            <option value="ml">Milliliters (ml)</option>
                                            <option value="pieces">Pieces</option>
                                            <option value="dozen">Dozen</option>
                                            <option value="cups">Cups</option>
                                            <option value="tbsp">Tablespoons</option>
                                            <option value="tsp">Teaspoons</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="addItemThreshold" class="form-label">Low Stock Threshold *</label>
                                        <input type="number" class="form-control" id="addItemThreshold" min="0" step="0.01" required>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="addItemSupplier" class="form-label">Supplier</label>
                                        <input type="text" class="form-control" id="addItemSupplier" placeholder="Enter supplier name">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="addItemCostPerUnit" class="form-label">Cost per Unit</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="addItemCostPerUnit" min="0" step="0.01">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="addItemLocation" class="form-label">Storage Location</label>
                                    <input type="text" class="form-control" id="addItemLocation" placeholder="Enter storage location">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-success" onclick="inventoryManager.processAddItem()">
                                <i class="fas fa-plus-circle me-1"></i> Add Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('addItemModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addItemModal'));
        modal.show();

        // Focus on name input
        setTimeout(() => {
            document.getElementById('addItemName').focus();
        }, 500);
    }

    async processAddItem() {
        const name = document.getElementById('addItemName').value.trim();
        const category = document.getElementById('addItemCategory').value;
        const description = document.getElementById('addItemDescription').value.trim();
        const quantity = document.getElementById('addItemQuantity').value;
        const unit = document.getElementById('addItemUnit').value;
        const threshold = document.getElementById('addItemThreshold').value;
        const supplier = document.getElementById('addItemSupplier').value.trim();
        const costPerUnit = document.getElementById('addItemCostPerUnit').value;
        const location = document.getElementById('addItemLocation').value.trim();

        // Validation
        if (!name) {
            this.showNotification('Please enter an item name', 'error');
            return;
        }
        if (!quantity || parseFloat(quantity) < 0) {
            this.showNotification('Please enter a valid quantity', 'error');
            return;
        }
        if (!unit) {
            this.showNotification('Please select a unit', 'error');
            return;
        }
        if (!threshold || parseFloat(threshold) < 0) {
            this.showNotification('Please enter a valid threshold', 'error');
            return;
        }

        try {
            const itemData = {
                name,
                category: category || 'Other',
                description,
                quantity: parseFloat(quantity),
                unit,
                threshold: parseFloat(threshold),
                supplier: supplier || undefined,
                costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined,
                location: location || undefined
            };

            const response = await window.apiClient.createInventoryItem(itemData);

            if (response.success) {
                this.showNotification(`Successfully added ${name} to inventory`, 'success');

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
                modal.hide();

                // Refresh inventory
                this.loadInventory();
            } else {
                throw new Error(response.message || 'Failed to add item');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            this.showNotification('Error adding item: ' + error.message, 'error');
        }
    }

    openAddItemModal() {
        const modal = new bootstrap.Modal(document.getElementById('inventoryItemModal'));
        const form = document.getElementById('inventoryItemForm');
        const title = document.getElementById('inventoryItemModalTitle');

        // Reset form for new item
        form.reset();
        document.getElementById('itemId').value = '';
        title.textContent = 'Add New Inventory Item';

        modal.show();
    }

    async saveInventoryItem() {
        const form = document.getElementById('inventoryItemForm');
        const formData = new FormData(form);
        const itemData = Object.fromEntries(formData.entries());

        // Convert numeric fields
        itemData.quantity = parseFloat(itemData.quantity) || 0;
        itemData.threshold = parseFloat(itemData.threshold) || 0;
        itemData.costPerUnit = parseFloat(itemData.costPerUnit) || 0;

        try {
            const itemId = itemData.itemId;
            delete itemData.itemId;

            if (itemId) {
                // Update existing item
                await window.apiClient.updateInventoryItem(itemId, itemData);
                this.showNotification('Item updated successfully', 'success');
            } else {
                // Create new item
                await window.apiClient.createInventoryItem(itemData);
                this.showNotification('Item added successfully', 'success');
            }

            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('inventoryItemModal'));
            modal.hide();
            this.loadInventory();

        } catch (error) {
            console.error('Error saving item:', error);
            this.showNotification('Error saving item: ' + error.message, 'error');
        }
    }

    exportInventory() {
        try {
            // Prepare data for export
            const exportData = this.inventory.map(item => ({
                'Ingredient Name': item.name || '',
                'Category': item.category || '',
                'Description': item.description || '',
                'Current Stock': item.quantity || 0,
                'Unit': item.unit || '',
                'Threshold': item.threshold || 0,
                'Supplier': item.supplier || '',
                'Cost per Unit': item.costPerUnit || 0,
                'Total Value': (item.quantity || 0) * (item.costPerUnit || 0),
                'Last Updated': item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : ''
            }));

            // Convert to CSV
            const headers = Object.keys(exportData[0] || {});
            const csvContent = [
                headers.join(','),
                ...exportData.map(row =>
                    headers.map(header => `"${row[header]}"`).join(',')
                )
            ].join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification('Inventory exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting inventory:', error);
            this.showNotification('Error exporting inventory: ' + error.message, 'error');
        }
    }

    // Enhanced Modal Methods
    showRestockModal(item) {
        const modalHtml = `
            <div class="modal fade" id="restockModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-plus-circle text-success me-2"></i>
                                Restock ${item.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="restockForm">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Current Stock</label>
                                        <div class="input-group">
                                            <span class="input-group-text">${item.quantity || 0}</span>
                                            <span class="input-group-text">${item.unit || 'units'}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Threshold</label>
                                        <div class="input-group">
                                            <span class="input-group-text">${item.threshold || 0}</span>
                                            <span class="input-group-text">${item.unit || 'units'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="restockAmount" class="form-label">Amount to Add *</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control" id="restockAmount"
                                               min="0.01" step="0.01" required>
                                        <span class="input-group-text">${item.unit || 'units'}</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="restockSupplier" class="form-label">Supplier</label>
                                    <input type="text" class="form-control" id="restockSupplier"
                                           value="${item.supplier || ''}" placeholder="Enter supplier name">
                                </div>
                                <div class="mb-3">
                                    <label for="restockCostPerUnit" class="form-label">Cost per Unit</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" id="restockCostPerUnit"
                                               min="0" step="0.01" value="${item.costPerUnit || ''}">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="restockNotes" class="form-label">Notes</label>
                                    <textarea class="form-control" id="restockNotes" rows="3"
                                              placeholder="Add any notes about this restock..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-success" onclick="inventoryManager.processRestock('${item._id}')">
                                <i class="fas fa-plus-circle me-1"></i> Add to Stock
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('restockModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('restockModal'));
        modal.show();

        // Focus on amount input
        setTimeout(() => {
            document.getElementById('restockAmount').focus();
        }, 500);
    }

    async processRestock(itemId) {
        const amount = document.getElementById('restockAmount').value;
        const supplier = document.getElementById('restockSupplier').value;
        const costPerUnit = document.getElementById('restockCostPerUnit').value;
        const notes = document.getElementById('restockNotes').value;

        if (!amount || parseFloat(amount) <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }

        try {
            const restockData = {
                amount: parseFloat(amount),
                notes: notes || `Restocked ${amount} units`,
                supplier: supplier || undefined,
                costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined
            };

            const response = await window.apiClient.restockInventoryItem(itemId, restockData);

            if (response.success) {
                this.showNotification(response.message || 'Item restocked successfully', 'success');

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('restockModal'));
                modal.hide();

                // Refresh inventory
                this.loadInventory();
            } else {
                throw new Error(response.message || 'Failed to restock item');
            }
        } catch (error) {
            console.error('Error restocking item:', error);
            this.showNotification('Error restocking item: ' + error.message, 'error');
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

    showEditModal(item) {
        const modalHtml = `
            <div class="modal fade" id="editItemModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-edit text-primary me-2"></i>
                                Edit ${item.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editItemForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="editItemName" class="form-label">Item Name *</label>
                                        <input type="text" class="form-control" id="editItemName"
                                               value="${item.name || ''}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="editItemCategory" class="form-label">Category</label>
                                        <select class="form-select" id="editItemCategory">
                                            <option value="">Select Category</option>
                                            <option value="Flour" ${item.category === 'Flour' ? 'selected' : ''}>Flour</option>
                                            <option value="Sugar" ${item.category === 'Sugar' ? 'selected' : ''}>Sugar</option>
                                            <option value="Dairy" ${item.category === 'Dairy' ? 'selected' : ''}>Dairy</option>
                                            <option value="Eggs" ${item.category === 'Eggs' ? 'selected' : ''}>Eggs</option>
                                            <option value="Flavoring" ${item.category === 'Flavoring' ? 'selected' : ''}>Flavoring</option>
                                            <option value="Decoration" ${item.category === 'Decoration' ? 'selected' : ''}>Decoration</option>
                                            <option value="Packaging" ${item.category === 'Packaging' ? 'selected' : ''}>Packaging</option>
                                            <option value="Other" ${item.category === 'Other' ? 'selected' : ''}>Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="editItemDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="editItemDescription" rows="2">${item.description || ''}</textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label for="editItemQuantity" class="form-label">Current Quantity *</label>
                                        <input type="number" class="form-control" id="editItemQuantity"
                                               value="${item.quantity || 0}" min="0" step="0.01" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="editItemUnit" class="form-label">Unit *</label>
                                        <select class="form-select" id="editItemUnit" required>
                                            <option value="">Select Unit</option>
                                            <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>Kilograms (kg)</option>
                                            <option value="g" ${item.unit === 'g' ? 'selected' : ''}>Grams (g)</option>
                                            <option value="lbs" ${item.unit === 'lbs' ? 'selected' : ''}>Pounds (lbs)</option>
                                            <option value="oz" ${item.unit === 'oz' ? 'selected' : ''}>Ounces (oz)</option>
                                            <option value="L" ${item.unit === 'L' ? 'selected' : ''}>Liters (L)</option>
                                            <option value="ml" ${item.unit === 'ml' ? 'selected' : ''}>Milliliters (ml)</option>
                                            <option value="cups" ${item.unit === 'cups' ? 'selected' : ''}>Cups</option>
                                            <option value="pieces" ${item.unit === 'pieces' ? 'selected' : ''}>Pieces</option>
                                            <option value="dozen" ${item.unit === 'dozen' ? 'selected' : ''}>Dozen</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="editItemThreshold" class="form-label">Low Stock Threshold</label>
                                        <input type="number" class="form-control" id="editItemThreshold"
                                               value="${item.threshold || 0}" min="0" step="0.01">
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="editItemSupplier" class="form-label">Supplier</label>
                                        <input type="text" class="form-control" id="editItemSupplier"
                                               value="${item.supplier || ''}" placeholder="Enter supplier name">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="editItemCostPerUnit" class="form-label">Cost per Unit</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="editItemCostPerUnit"
                                                   value="${item.costPerUnit || ''}" min="0" step="0.01">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="editItemLocation" class="form-label">Storage Location</label>
                                    <input type="text" class="form-control" id="editItemLocation"
                                           value="${item.location || ''}" placeholder="e.g., Pantry Shelf A, Refrigerator">
                                </div>
                                <div class="mb-3">
                                    <label for="editItemNotes" class="form-label">Update Notes</label>
                                    <textarea class="form-control" id="editItemNotes" rows="2"
                                              placeholder="Add notes about this update..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="inventoryManager.processEdit('${item._id}')">
                                <i class="fas fa-save me-1"></i> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('editItemModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
        modal.show();
    }

    async processEdit(itemId) {
        const formData = {
            name: document.getElementById('editItemName').value,
            category: document.getElementById('editItemCategory').value,
            description: document.getElementById('editItemDescription').value,
            quantity: parseFloat(document.getElementById('editItemQuantity').value),
            unit: document.getElementById('editItemUnit').value,
            threshold: parseFloat(document.getElementById('editItemThreshold').value) || 0,
            supplier: document.getElementById('editItemSupplier').value,
            costPerUnit: parseFloat(document.getElementById('editItemCostPerUnit').value) || 0,
            location: document.getElementById('editItemLocation').value,
            notes: document.getElementById('editItemNotes').value
        };

        // Validation
        if (!formData.name || !formData.unit) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            const response = await window.apiClient.updateInventoryItem(itemId, formData);

            if (response.success) {
                this.showNotification(response.message || 'Item updated successfully', 'success');

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
                modal.hide();

                // Refresh inventory
                this.loadInventory();
            } else {
                throw new Error(response.message || 'Failed to update item');
            }
        } catch (error) {
            console.error('Error updating item:', error);
            this.showNotification('Error updating item: ' + error.message, 'error');
        }
    }

    showDeleteModal(item) {
        const modalHtml = `
            <div class="modal fade" id="deleteItemModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-trash text-danger me-2"></i>
                                Delete ${item.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <strong>Warning:</strong> This action cannot be undone.
                            </div>
                            <p>Are you sure you want to delete <strong>${item.name}</strong>?</p>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <small class="text-muted">Current Stock:</small><br>
                                    <strong>${item.quantity || 0} ${item.unit || 'units'}</strong>
                                </div>
                                <div class="col-md-6">
                                    <small class="text-muted">Category:</small><br>
                                    <strong>${item.category || 'N/A'}</strong>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="deleteReason" class="form-label">Reason for deletion (optional)</label>
                                <textarea class="form-control" id="deleteReason" rows="3"
                                          placeholder="Enter reason for deleting this item..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" onclick="inventoryManager.processDelete('${item._id}')">
                                <i class="fas fa-trash me-1"></i> Delete Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('deleteItemModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('deleteItemModal'));
        modal.show();
    }

    async processDelete(itemId) {
        const reason = document.getElementById('deleteReason').value;

        try {
            const response = await window.apiClient.deleteInventoryItem(itemId, { reason });

            if (response.success) {
                this.showNotification(response.message || 'Item deleted successfully', 'success');

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteItemModal'));
                modal.hide();

                // Refresh inventory
                this.loadInventory();
            } else {
                throw new Error(response.message || 'Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showNotification('Error deleting item: ' + error.message, 'error');
        }
    }

    showHistoryModal(data) {
        const { item, history, pagination } = data;

        const historyRows = history.map(record => {
            const actionIcon = {
                'create': 'fas fa-plus-circle text-success',
                'update': 'fas fa-edit text-primary',
                'restock': 'fas fa-arrow-up text-info',
                'use': 'fas fa-arrow-down text-warning',
                'delete': 'fas fa-trash text-danger'
            }[record.action] || 'fas fa-circle';

            const changeAmount = record.changeAmount || 0;
            const changeDisplay = changeAmount > 0 ? `+${changeAmount}` : changeAmount;
            const changeClass = changeAmount > 0 ? 'text-success' : changeAmount < 0 ? 'text-danger' : 'text-muted';

            return `
                <tr>
                    <td>
                        <i class="${actionIcon} me-2"></i>
                        ${record.action.charAt(0).toUpperCase() + record.action.slice(1)}
                    </td>
                    <td>${new Date(record.date).toLocaleString()}</td>
                    <td class="text-center">${record.previousQuantity || 0}</td>
                    <td class="text-center">${record.newQuantity || 0}</td>
                    <td class="text-center">
                        <span class="${changeClass}">${changeDisplay}</span>
                    </td>
                    <td>
                        <small class="text-muted">${record.notes || 'No notes'}</small>
                        ${record.supplier ? `<br><small class="text-info">Supplier: ${record.supplier}</small>` : ''}
                        ${record.costPerUnit ? `<br><small class="text-success">Cost: $${record.costPerUnit}</small>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        const modalHtml = `
            <div class="modal fade" id="historyModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-history text-info me-2"></i>
                                History for ${item.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <small class="text-muted">Current Stock:</small><br>
                                    <strong>${item.currentQuantity || 0} ${item.unit || 'units'}</strong>
                                </div>
                                <div class="col-md-3">
                                    <small class="text-muted">Category:</small><br>
                                    <strong>${item.category || 'N/A'}</strong>
                                </div>
                                <div class="col-md-3">
                                    <small class="text-muted">Total Records:</small><br>
                                    <strong>${pagination.totalRecords}</strong>
                                </div>
                                <div class="col-md-3">
                                    <small class="text-muted">Page:</small><br>
                                    <strong>${pagination.currentPage} of ${pagination.totalPages}</strong>
                                </div>
                            </div>

                            ${history.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>Action</th>
                                                <th>Date</th>
                                                <th class="text-center">Previous Qty</th>
                                                <th class="text-center">New Qty</th>
                                                <th class="text-center">Change</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${historyRows}
                                        </tbody>
                                    </table>
                                </div>

                                ${pagination.totalPages > 1 ? `
                                    <nav aria-label="History pagination">
                                        <ul class="pagination justify-content-center">
                                            <li class="page-item ${!pagination.hasPrev ? 'disabled' : ''}">
                                                <button class="page-link" onclick="inventoryManager.loadHistoryPage('${item._id}', ${pagination.currentPage - 1})"
                                                        ${!pagination.hasPrev ? 'disabled' : ''}>Previous</button>
                                            </li>
                                            <li class="page-item active">
                                                <span class="page-link">${pagination.currentPage}</span>
                                            </li>
                                            <li class="page-item ${!pagination.hasNext ? 'disabled' : ''}">
                                                <button class="page-link" onclick="inventoryManager.loadHistoryPage('${item._id}', ${pagination.currentPage + 1})"
                                                        ${!pagination.hasNext ? 'disabled' : ''}>Next</button>
                                            </li>
                                        </ul>
                                    </nav>
                                ` : ''}
                            ` : `
                                <div class="text-center py-4">
                                    <i class="fas fa-history fa-3x text-muted mb-3"></i>
                                    <p class="text-muted">No history records found for this item.</p>
                                </div>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="inventoryManager.exportHistory('${item._id}')">
                                <i class="fas fa-download me-1"></i> Export History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('historyModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('historyModal'));
        modal.show();
    }

    async loadHistoryPage(itemId, page) {
        try {
            const response = await window.apiClient.getInventoryItemHistory(itemId, { page });
            if (response.success) {
                // Close current modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
                modal.hide();

                // Show new modal with updated data
                setTimeout(() => {
                    this.showHistoryModal(response.data);
                }, 300);
            } else {
                throw new Error(response.message || 'Failed to load history page');
            }
        } catch (error) {
            console.error('Error loading history page:', error);
            this.showNotification('Error loading history page: ' + error.message, 'error');
        }
    }

    async exportHistory(itemId) {
        try {
            // This would typically generate and download a CSV/Excel file
            this.showNotification('Export history feature will be implemented soon', 'info');
        } catch (error) {
            console.error('Error exporting history:', error);
            this.showNotification('Error exporting history: ' + error.message, 'error');
        }
    }
}

// Export for use in other modules
window.InventoryManagement = InventoryManagement;

// Initialize enhanced inventory management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize inventory manager
    window.inventoryManager = new InventoryManagement();

    // Set up event listeners for enhanced features
    setupInventoryEventListeners();
});

function setupInventoryEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('inventorySearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter = document.getElementById('stockFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            window.inventoryManager.filterInventory(
                searchInput.value,
                categoryFilter?.value || 'all',
                stockFilter?.value || 'all'
            );
        }, 300));
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            window.inventoryManager.filterInventory(
                searchInput?.value || '',
                categoryFilter.value,
                stockFilter?.value || 'all'
            );
        });
    }

    if (stockFilter) {
        stockFilter.addEventListener('change', () => {
            window.inventoryManager.filterInventory(
                searchInput?.value || '',
                categoryFilter?.value || 'all',
                stockFilter.value
            );
        });
    }

    // Button event listeners
    const addItemBtn = document.getElementById('addInventoryItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            window.inventoryManager.openAddItemModal();
        });
    }

    const saveItemBtn = document.getElementById('saveInventoryItemBtn');
    if (saveItemBtn) {
        saveItemBtn.addEventListener('click', () => {
            window.inventoryManager.saveInventoryItem();
        });
    }

    const lowStockAlertBtn = document.getElementById('lowStockAlertBtn');
    if (lowStockAlertBtn) {
        lowStockAlertBtn.addEventListener('click', () => {
            window.inventoryManager.showLowStockAlert();
        });
    }

    const refreshBtn = document.getElementById('refreshInventoryBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.inventoryManager.loadInventory();
        });
    }

    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', () => {
            window.inventoryManager.bulkDeleteItems();
        });
    }

    // Export button removed as requested
}

// Utility function for debouncing search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
