// Customer Management Module
class CustomerManagement {
    constructor() {
        this.customers = [];
        this.filteredCustomers = [];
    }

    async loadCustomers() {
        try {
            // Use API client to get all customers
            const data = await window.apiClient.getAllCustomers();
            this.customers = data.data || data || [];
            this.filteredCustomers = [...this.customers];

            // Update customer statistics
            this.updateCustomerStats(data.summary || {});
            this.renderCustomersTable();

            return this.customers;
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showNotification('Error loading customers: ' + error.message, 'error');
            return [];
        }
    }

    updateCustomerStats(summary) {
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };

        updateElement('totalCustomersCount', summary.totalCustomers || 0);
        updateElement('newCustomersMonth', summary.newThisMonth || 0);
        updateElement('registeredCustomers', summary.registeredCustomers || 0);
        updateElement('guestCustomers', summary.guestCustomers || 0);
    }

    renderCustomersTable() {
        const tbody = document.querySelector('#customersTable tbody');
        if (!tbody) return;

        if (this.filteredCustomers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No customers found</td></tr>';
            return;
        }

        const html = this.filteredCustomers.map(customer => {
            const customerType = customer.isGuest ? 'Guest' : 'Registered';
            // Calculate total spent from customer's orders or use provided totalSpent
            const totalSpent = this.calculateCustomerTotalSpent(customer);
            const orderCount = customer.orderCount || (customer.orders ? customer.orders.length : 0);

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-sm me-2">
                                <div class="avatar-title ${customer.isGuest ? 'bg-secondary' : 'bg-primary'} rounded-circle">
                                    ${(customer.firstName || 'G').charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div>
                                <div class="fw-semibold">${customer.firstName || ''} ${customer.lastName || ''}</div>
                                ${customer.isGuest ? '<small class="text-muted">Guest Customer</small>' : '<small class="text-muted">Registered Customer</small>'}
                            </div>
                        </div>
                    </td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${customer.phone || 'N/A'}</td>
                    <td>
                        <span class="badge ${customer.isGuest ? 'bg-warning text-dark' : 'bg-success'}">
                            <i class="fas ${customer.isGuest ? 'fa-user-clock' : 'fa-user-check'}"></i>
                            ${customerType}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-info">${orderCount}</span>
                    </td>
                    <td>
                        <span class="fw-semibold text-success">$${totalSpent.toFixed(2)}</span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.AdminManager.viewCustomer('${customer._id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    }

    /**
     * Calculate total spent by customer from their orders
     * @param {Object} customer - Customer object
     * @returns {number} Total amount spent by customer
     */
    calculateCustomerTotalSpent(customer) {
        // If totalSpent is already calculated and provided, use it
        if (customer.totalSpent !== undefined && customer.totalSpent !== null) {
            return parseFloat(customer.totalSpent) || 0;
        }

        // If customer has orders array, calculate from orders
        if (customer.orders && Array.isArray(customer.orders)) {
            return customer.orders.reduce((total, order) => {
                // Try different fields for order total
                let orderTotal = 0;

                if (order.totalAmount) {
                    orderTotal = parseFloat(order.totalAmount);
                } else if (order.total) {
                    orderTotal = parseFloat(order.total);
                } else if (order.amount) {
                    orderTotal = parseFloat(order.amount);
                } else if (order.payment && order.payment.amount) {
                    orderTotal = parseFloat(order.payment.amount);
                } else if (order.items && Array.isArray(order.items)) {
                    // Calculate from items if no total is available
                    orderTotal = order.items.reduce((sum, item) => {
                        const price = parseFloat(item.price) || parseFloat(item.unitPrice) || 0;
                        const quantity = parseInt(item.quantity) || 1;
                        return sum + (price * quantity);
                    }, 0);
                }

                return total + (orderTotal || 0);
            }, 0);
        }

        // Default to 0 if no orders or totalSpent
        return 0;
    }

    /**
     * Calculate average order value for customer
     * @param {Object} customer - Customer object
     * @returns {number} Average order value
     */
    calculateAverageOrderValue(customer) {
        const totalSpent = this.calculateCustomerTotalSpent(customer);
        const orderCount = customer.orderCount || (customer.orders ? customer.orders.length : 0);

        if (orderCount === 0) {
            return 0;
        }

        return totalSpent / orderCount;
    }

    filterCustomers(searchTerm, typeFilter, sortBy) {
        this.filteredCustomers = this.customers.filter(customer => {
            // Search filter
            const searchMatch = !searchTerm ||
                (customer.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (customer.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

            // Type filter
            const typeMatch = typeFilter === 'all' ||
                (typeFilter === 'registered' && !customer.isGuest) ||
                (typeFilter === 'guest' && customer.isGuest);

            return searchMatch && typeMatch;
        });

        // Sort customers
        this.filteredCustomers.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt || b.customerSince) - new Date(a.createdAt || a.customerSince);
                case 'oldest':
                    return new Date(a.createdAt || a.customerSince) - new Date(b.createdAt || b.customerSince);
                case 'name':
                    return (a.firstName || '').localeCompare(b.firstName || '');
                case 'email':
                    return (a.email || '').localeCompare(b.email || '');
                default:
                    return 0;
            }
        });

        this.renderCustomersTable();
    }

    viewCustomer(customerId) {
        const customer = this.customers.find(c => c._id === customerId);
        if (!customer) {
            this.showNotification('Customer not found', 'error');
            return;
        }

        this.showCustomerModal(customer);
    }

    showCustomerModal(customer) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('customerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'customerModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="customerModalTitle">Customer Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="customerModalBody">
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const modalTitle = document.getElementById('customerModalTitle');
        const modalBody = document.getElementById('customerModalBody');

        modalTitle.textContent = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer Details';

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-user"></i> Personal Information</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Name:</strong></div>
                                <div class="col-sm-8">${customer.firstName || ''} ${customer.lastName || ''}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Email:</strong></div>
                                <div class="col-sm-8">${customer.email || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Phone:</strong></div>
                                <div class="col-sm-8">${customer.phone || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Type:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge ${customer.isGuest ? 'bg-secondary' : 'bg-primary'}">
                                        ${customer.isGuest ? 'Guest' : 'Registered'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-chart-bar"></i> Order Statistics</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Total Orders:</strong></div>
                                <div class="col-sm-6">${customer.orderCount || 0}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Total Spent:</strong></div>
                                <div class="col-sm-6 text-success fw-semibold">$${this.calculateCustomerTotalSpent(customer).toFixed(2)}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Average Order:</strong></div>
                                <div class="col-sm-6">$${this.calculateAverageOrderValue(customer).toFixed(2)}</div>
                            </div>
                            ${customer.lastOrderDate ? `
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Last Order:</strong></div>
                                <div class="col-sm-6">${new Date(customer.lastOrderDate).toLocaleDateString()}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            ${customer.orders && customer.orders.length > 0 ? `
            <div class="card mt-3">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-shopping-bag"></i> Recent Orders</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${customer.orders.slice(0, 5).map(order => `
                                    <tr>
                                        <td>${order.orderId.toString().slice(-8).toUpperCase()}</td>
                                        <td>${new Date(order.date).toLocaleDateString()}</td>
                                        <td>$${(order.amount || 0).toFixed(2)}</td>
                                        <td><span class="badge bg-${order.status === 'completed' ? 'success' : 'warning'}">${order.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="d-flex justify-content-end mt-3">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        `;

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    editCustomer(customerId) {
        this.showNotification('Edit customer feature will be implemented soon', 'info');
    }

    emailCustomer(customerId) {
        this.showNotification('Email customer feature will be implemented soon', 'info');
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
window.CustomerManagement = CustomerManagement;
