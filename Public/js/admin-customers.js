const CustomerManager = {
    apiBaseUrl: '/api/customers',

    init() {
        this.loadCustomers();
        this.setupEventListeners();
    },

    setupEventListeners() {
        const tbody = document.querySelector('#customersTable tbody');
        if (!tbody) return;

        tbody.addEventListener('click', (event) => {
            if (event.target.classList.contains('view-customer')) {
                const customerId = event.target.getAttribute('data-id');
                if (customerId) {
                    this.viewCustomer(customerId);
                }
            }
        });
    },

    async loadCustomers() {
        try {
            const response = await fetch(this.apiBaseUrl, {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch customers data: ' + response.statusText);
            }
            const customers = await response.json();
            this.renderCustomers(customers);
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showNotification('Error loading customers: ' + error.message, 'error');
        }
    },

    renderCustomers(customers) {
        const tbody = document.querySelector('#customersTable tbody');
        if (!tbody) return;

        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No customers found</td></tr>';
            return;
        }

        tbody.innerHTML = customers.map(customer => (
            '<tr>' +
                '<td>' + customer.firstName + ' ' + customer.lastName + '</td>' +
                '<td>' + customer.email + '</td>' +
                '<td>' + (customer.phone || 'N/A') + '</td>' +
                '<td>' + (customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A') + '</td>' +
                '<td>' + (customer.isGuest ? 'Guest' : 'Registered') + '</td>' +
                '<td>' +
                    '<button class="btn btn-sm btn-outline-primary view-customer" data-id="' + customer._id + '">' +
                        'View' +
                    '</button>' +
                '</td>' +
            '</tr>'
        )).join('');
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'alert alert-' + type + ' alert-dismissible fade show position-fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.innerHTML =
            message +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 150);
        }, 5000);
    },

    viewCustomer(customerId) {
        // Navigate to the customer detail page
        window.location.href = '/admin/customers/' + customerId;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CustomerManager.init();
});
