const InventoryManager = {
    apiBaseUrl: '/api/inventory',

    init() {
        this.loadInventory();
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Add event listeners for inventory page if needed
    },

    async loadInventory() {
        try {
            const response = await fetch(this.apiBaseUrl, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch inventory data: ${response.statusText}`);
            }
            const inventoryItems = await response.json();
            this.renderInventory(inventoryItems);
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showNotification(`Error loading inventory: ${error.message}`, 'error');
        }
    },

    renderInventory(items) {
        const tbody = document.querySelector('#inventoryTable tbody');
        if (!tbody) return;

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No inventory items found</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${item.location || 'N/A'}</td>
                <td>${item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}</td>
            </tr>
        `).join('');
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = \`alert alert-\${type} alert-dismissible fade show position-fixed\`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.innerHTML = \`
            \${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        \`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 150);
        }, 5000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    InventoryManager.init();
});
