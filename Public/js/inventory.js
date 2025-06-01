// inventory.js - Updated to integrate with backend APIs for Sarah's Short Cakes

// Fetch inventory items from backend API
async function fetchInventoryItems() {
    try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const response = await fetch('/api/inventory', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch inventory items');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return null;
    }
}

// Render inventory table with data from backend
async function renderInventoryTable() {
    const data = await fetchInventoryItems();
    if (!data) return;

    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';

    let totalIngredients = 0;
    let lowStockCount = 0;
    let criticalCount = 0;

    data.forEach(ingredient => {
        totalIngredients++;

        const status = getIngredientStatus(ingredient);
        if (status === 'low') lowStockCount++;
        if (status === 'critical') criticalCount++;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="ingredient-image me-3">
                        <i class="fas fa-${getIngredientIcon(ingredient.name.toLowerCase())}"></i>
                    </div>
                    <div>
                        <strong>${ingredient.name}</strong>
                    </div>
                </div>
            </td>
            <td>${ingredient.quantity}</td>
            <td>${ingredient.threshold}</td>
            <td><span class="badge ${getStatusBadgeClass(status)}">${getStatusText(status)}</span></td>
            <td>${ingredient.unit}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" onclick="showRestockModal('${ingredient._id}')">
                    <i class="fas fa-plus"></i> Restock
                </button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="showEditModal('${ingredient._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger me-1" onclick="confirmDelete('${ingredient._id}', '${ingredient.name}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="showIngredientHistory('${ingredient._id}')">
                    <i class="fas fa-history"></i> History
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Update summary cards
    document.getElementById('totalIngredients').textContent = totalIngredients;
    document.getElementById('lowStockItems').textContent = lowStockCount;
    document.getElementById('criticalItems').textContent = criticalCount;
}

// Show restock modal and set ingredient ID
function showRestockModal(ingredientId) {
    const select = document.getElementById('ingredientSelect');
    select.value = ingredientId;

    const modal = new bootstrap.Modal(document.getElementById('restockModal'));
    modal.show();
}

// Confirm restock and call backend API
document.getElementById('confirmRestock').addEventListener('click', async function() {
    const ingredientId = document.getElementById('ingredientSelect').value;
    const quantity = parseFloat(document.getElementById('restockQuantity').value);
    const notes = document.getElementById('restockNotes').value;

    if (!ingredientId || !quantity || quantity <= 0) {
        showAlert('Please select an ingredient and enter a valid quantity', 'danger');
        return;
    }

    try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const response = await fetch(`/api/inventory/${ingredientId}/restock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({ amount: quantity, notes })
        });
        const result = await response.json();
        if (response.ok) {
            showAlert('Ingredient restocked successfully!', 'success');
            renderInventoryTable();
            populateIngredientSelect();
            document.getElementById('restockForm').reset();
            bootstrap.Modal.getInstance(document.getElementById('restockModal')).hide();
        } else {
            showAlert(result.message || 'Failed to restock ingredient', 'danger');
        }
    } catch (error) {
        console.error('Restock error:', error);
        showAlert('Error restocking ingredient', 'danger');
    }
});

// Show edit modal and populate fields
async function showEditModal(ingredientId) {
    try {
        const response = await fetch(`/api/inventory/${ingredientId}`);
        if (!response.ok) throw new Error('Failed to fetch ingredient details');
        const ingredient = await response.json();

        document.getElementById('editIngredientId').value = ingredient._id;
        document.getElementById('editIngredientName').value = ingredient.name;
        document.getElementById('editIngredientQuantity').value = ingredient.quantity;
        document.getElementById('editIngredientUnit').value = ingredient.unit;
        document.getElementById('editIngredientThreshold').value = ingredient.threshold;

        const modal = new bootstrap.Modal(document.getElementById('editIngredientModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading ingredient for edit:', error);
        showAlert('Failed to load ingredient details', 'danger');
    }
}

// Confirm edit and call backend API
document.getElementById('confirmEditIngredient').addEventListener('click', async function() {
    const id = document.getElementById('editIngredientId').value;
    const name = document.getElementById('editIngredientName').value;
    const quantity = parseFloat(document.getElementById('editIngredientQuantity').value);
    const unit = document.getElementById('editIngredientUnit').value;
    const threshold = parseFloat(document.getElementById('editIngredientThreshold').value);

    if (!name || !unit || isNaN(quantity) || isNaN(threshold)) {
        showAlert('Please fill all fields correctly', 'danger');
        return;
    }

    try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const response = await fetch(`/api/inventory/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({ name, quantity, unit, threshold })
        });
        const result = await response.json();
        if (response.ok) {
            showAlert('Ingredient updated successfully!', 'success');
            renderInventoryTable();
            bootstrap.Modal.getInstance(document.getElementById('editIngredientModal')).hide();
        } else {
            showAlert(result.message || 'Failed to update ingredient', 'danger');
        }
    } catch (error) {
        console.error('Update error:', error);
        showAlert('Error updating ingredient', 'danger');
    }
});

// Confirm delete with user and call backend API
function confirmDelete(ingredientId, ingredientName) {
    if (confirm(`Are you sure you want to delete "${ingredientName}"? This action cannot be undone.`)) {
        deleteIngredient(ingredientId);
    }
}

// Delete ingredient API call
async function deleteIngredient(ingredientId) {
    try {
        const response = await fetch(`/api/inventory/${ingredientId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok) {
            showAlert('Ingredient deleted successfully!', 'success');
            renderInventoryTable();
            populateIngredientSelect();
        } else {
            showAlert(result.message || 'Failed to delete ingredient', 'danger');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Error deleting ingredient', 'danger');
    }
}

// Populate ingredient select dropdown for restock modal
async function populateIngredientSelect() {
    const data = await fetchInventoryItems();
    if (!data) return;

    const select = document.getElementById('ingredientSelect');
    select.innerHTML = '<option value="" selected disabled>Select ingredient</option>';

    data.forEach(ingredient => {
        const option = document.createElement('option');
        option.value = ingredient._id;
        option.textContent = `${ingredient.name} (Current: ${ingredient.quantity} ${ingredient.unit})`;
        select.appendChild(option);
    });
}

// Show ingredient history modal (fetch from backend if API available)
async function showIngredientHistory(ingredientId) {
    try {
        const response = await fetch(`/api/inventory/${ingredientId}/history`);
        if (!response.ok) throw new Error('Failed to fetch restock history');
        const history = await response.json();

        const ingredientResponse = await fetch(`/api/inventory/${ingredientId}`);
        const ingredient = await ingredientResponse.json();

        const modalElement = document.createElement('div');
        modalElement.classList.add('modal', 'fade');
        modalElement.tabIndex = -1;
        modalElement.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Restock History for ${ingredient.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Quantity Added</th>
                                    <th>New Total</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.map(item => `
                                    <tr>
                                        <td>${new Date(item.date).toLocaleDateString()}</td>
                                        <td>${item.quantity} ${ingredient.unit}</td>
                                        <td>${item.newQuantity} ${ingredient.unit}</td>
                                        <td>${item.notes || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalElement);
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });
    } catch (error) {
        console.error('Error fetching restock history:', error);
        showAlert('Failed to load restock history', 'danger');
    }
}

// Utility functions for status badges and icons (same as before)
function getIngredientStatus(ingredient) {
    if (ingredient.quantity <= 0) return 'critical';
    if (ingredient.quantity <= ingredient.threshold) return 'low';
    return 'ok';
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'critical': return 'badge-critical';
        case 'low': return 'badge-low';
        default: return 'badge-ok';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'critical': return 'Out of Stock';
        case 'low': return 'Low Stock';
        default: return 'In Stock';
    }
}

function getIngredientIcon(name) {
    const iconMap = {
        'flour': 'wheat-awn',
        'sugar': 'cubes-stacked',
        'butter': 'cow',
        'eggs': 'egg',
        'milk': 'bottle-water',
        'chocolate': 'mug-hot',
        'vanilla': 'leaf',
        'fruit': 'apple-whole',
        'cheese': 'cheese',
        'nut': 'acorn',
        'spice': 'mortar-pestle',
        'coffee': 'coffee',
        'alcohol': 'wine-bottle'
    };

    for (const [key, icon] of Object.entries(iconMap)) {
        if (name.toLowerCase().includes(key)) return icon;
    }

    return 'shapes'; // Default icon
}

// Show alert notification
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show alert-notification`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const notificationArea = document.getElementById('notificationArea');
    notificationArea.appendChild(alert);

    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 5000);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-inventory.html')) {
        renderInventoryTable();
        populateIngredientSelect();
        setupEventListeners();
    }
});

// Setup event listeners for search and logout
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchButton').addEventListener('click', function() {
        const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
        filterInventoryTable(searchTerm);
    });

    document.getElementById('inventorySearch').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.toLowerCase();
            filterInventoryTable(searchTerm);
        }
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            } else {
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout error. Please try again.');
        }
    });
}

// Filter inventory table rows based on search term
function filterInventoryTable(searchTerm) {
    const rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Make functions globally accessible for HTML onclick attributes
window.showRestockModal = showRestockModal;
window.showEditModal = showEditModal;
window.confirmDelete = confirmDelete;
window.showIngredientHistory = showIngredientHistory;
