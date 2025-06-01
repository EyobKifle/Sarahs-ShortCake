// Order Management Module
class OrderManagement {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
    }

    async loadAllOrders(forceRefresh = false) {
        try {
            // Force refresh or load if no cached data
            if (forceRefresh || this.orders.length === 0) {
                console.log('Loading orders from database...');

                // Use API client to get all orders
                const data = await window.apiClient.getAllOrders();
                this.orders = data.data || data || [];
                console.log('Loaded orders from database:', this.orders.length);
                console.log('Sample order data:', this.orders[0]);
            }

            this.filteredOrders = [...this.orders];
            this.renderOrdersTable();
            return this.orders;
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Error loading orders: ' + error.message, 'error');
            return [];
        }
    }

    async loadRecentOrders() {
        try {
            // Sort orders by creation date (newest first) and take the first 10
            const recentOrders = this.orders
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10);

            this.renderRecentOrdersTable(recentOrders);
            return recentOrders;
        } catch (error) {
            console.error('Error loading recent orders:', error);
            this.showNotification('Error loading recent orders', 'error');
            return [];
        }
    }

    renderOrdersTable() {
        const tbody = document.querySelector('#ordersTable tbody');
        if (!tbody) return;

        if (this.filteredOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
            return;
        }

        const html = this.filteredOrders.map(order => {
            const customerName = this.getCustomerName(order);
            const orderDate = new Date(order.createdAt).toLocaleDateString();
            const itemCount = order.items ? order.items.length : 0;
            const totalAmount = this.calculateOrderTotal(order);
            const statusBadge = this.getStatusBadge(order.status);

            return `
                <tr>
                    <td>${order._id.slice(-8).toUpperCase()}</td>
                    <td>${customerName}</td>
                    <td>${orderDate}</td>
                    <td>${itemCount} items</td>
                    <td>$${totalAmount.toFixed(2)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="OrderManager.editOrder('${order._id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${order.status === 'pending' ? `
                                <button class="btn btn-outline-success" onclick="OrderManager.acceptOrder('${order._id}')" title="Accept Order">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            ${order.status !== 'cancelled' && order.status !== 'completed' ? `
                                <button class="btn btn-outline-danger" onclick="OrderManager.showCancelOrderModal('${order._id}')" title="Cancel Order">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    }

    renderRecentOrdersTable(orders) {
        const tbody = document.querySelector('#recentOrdersTable tbody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No recent orders</td></tr>';
            return;
        }

        const html = orders.map(order => {
            const customerName = this.getCustomerName(order);
            const orderDate = new Date(order.createdAt).toLocaleDateString();
            const totalAmount = this.calculateOrderTotal(order);
            const statusBadge = this.getStatusBadge(order.status);

            return `
                <tr>
                    <td>${order._id.slice(-8).toUpperCase()}</td>
                    <td>${customerName}</td>
                    <td>${orderDate}</td>
                    <td>$${totalAmount.toFixed(2)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="OrderManager.editOrder('${order._id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${order.status === 'pending' ? `
                                <button class="btn btn-outline-success" onclick="OrderManager.acceptOrder('${order._id}')" title="Accept Order">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = html;
    }

    getCustomerName(order) {
        // Use customerType if available for better classification
        if (order.customerType === 'registered') {
            // Check if customer data is populated from customerId
            if (order.customerId && typeof order.customerId === 'object' && order.customerId.firstName) {
                return `${order.customerId.firstName} ${order.customerId.lastName || ''}`.trim();
            }
            // Check if customer data is in the customer field
            else if (order.customer && order.customer.firstName && order.customer.firstName !== 'Unknown') {
                return `${order.customer.firstName} ${order.customer.lastName || ''}`.trim();
            }
            // Fallback for registered customers
            else {
                return 'Registered Customer';
            }
        } else if (order.customerType === 'guest') {
            // Guest customer with name
            if (order.guestInfo && order.guestInfo.name) {
                return order.guestInfo.name;
            } else {
                return 'Guest Customer';
            }
        }

        // Legacy fallback for orders without customerType
        // Check if customer data is populated from customerId
        if (order.customerId && typeof order.customerId === 'object' && order.customerId.firstName) {
            return `${order.customerId.firstName} ${order.customerId.lastName || ''}`.trim();
        }
        // Check if customer data is in the customer field
        else if (order.customer && order.customer.firstName && order.customer.firstName !== 'Unknown') {
            return `${order.customer.firstName} ${order.customer.lastName || ''}`.trim();
        }
        // Check if it's a guest customer with name
        else if (order.guestInfo && order.guestInfo.name) {
            return order.guestInfo.name;
        }
        // Check if customerId exists but is just an ObjectId (not populated)
        else if (order.customerId && typeof order.customerId === 'string') {
            return 'Registered Customer';
        }
        // Default to guest customer
        else {
            return 'Guest Customer';
        }
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
        return `<span class="badge ${className}">${status}</span>`;
    }

    /**
     * Calculate order total from various possible sources
     * Uses the same logic as dashboard-stats.js for consistency
     */
    calculateOrderTotal(order) {
        // Try different fields for order total
        if (order.totalAmount) {
            return parseFloat(order.totalAmount);
        } else if (order.total) {
            return parseFloat(order.total);
        } else if (order.payment && order.payment.amount) {
            return parseFloat(order.payment.amount);
        } else if (order.items && Array.isArray(order.items)) {
            // Calculate from items if no total is available
            return order.items.reduce((sum, item) => {
                const price = parseFloat(item.price) || parseFloat(item.unitPrice) || 0;
                const quantity = parseInt(item.quantity) || 1;
                return sum + (price * quantity);
            }, 0);
        }

        return 0;
    }

    async editOrder(orderId) {
        try {
            // Use API client to get order details
            const orderData = await window.apiClient.getOrderById(orderId);
            const order = orderData.data || orderData;

            // Show comprehensive order modal
            this.showComprehensiveOrderModal(order);
        } catch (error) {
            console.error('Error loading order for edit:', error);
            this.showNotification('Error loading order details: ' + error.message, 'error');
        }
    }

    async acceptOrder(orderId) {
        try {
            // Use API client to accept order
            await window.apiClient.acceptOrder(orderId);

            this.showNotification('Order accepted successfully and inventory updated', 'success');

            // Close any open modals
            const editModal = bootstrap.Modal.getInstance(document.getElementById('comprehensiveOrderModal'));
            if (editModal) editModal.hide();

            // Refresh orders
            this.loadAllOrders(true);
            this.loadRecentOrders();

        } catch (error) {
            console.error('Error accepting order:', error);
            this.showNotification('Error accepting order: ' + error.message, 'error');
        }
    }

    filterOrders(searchTerm, statusFilter, dateFilter) {
        this.filteredOrders = this.orders.filter(order => {
            // Search filter
            const searchMatch = !searchTerm ||
                order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                this.getCustomerName(order).toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const statusMatch = statusFilter === 'all' || order.status === statusFilter;

            // Date filter
            let dateMatch = true;
            if (dateFilter !== 'all') {
                const orderDate = new Date(order.createdAt);
                const now = new Date();

                switch (dateFilter) {
                    case 'today':
                        dateMatch = orderDate.toDateString() === now.toDateString();
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        dateMatch = orderDate >= weekAgo;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        dateMatch = orderDate >= monthAgo;
                        break;
                }
            }

            return searchMatch && statusMatch && dateMatch;
        });

        this.renderOrdersTable();
    }

    showComprehensiveOrderModal(order) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('comprehensiveOrderModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'comprehensiveOrderModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="comprehensiveOrderModalTitle">Order Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="comprehensiveOrderModalBody">
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const modalTitle = document.getElementById('comprehensiveOrderModalTitle');
        const modalBody = document.getElementById('comprehensiveOrderModalBody');

        modalTitle.textContent = `Order #${order.orderNumber || order._id}`;

        // Build comprehensive order details
        const customerInfo = order.customerId || order.customer || {};
        const deliveryInfo = order.deliveryDetails || order.deliveryInfo || {};
        const paymentInfo = order.paymentDetails || {};
        const totals = order.totals || {};

        modalBody.innerHTML = `
            <div class="row">
                <!-- Order Information -->
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-info-circle"></i> Order Information</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Order ID:</strong></div>
                                <div class="col-sm-8">${order._id}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Status:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge ${this.getStatusBadgeClass(order.status)}">${order.status}</span>
                                </div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Created:</strong></div>
                                <div class="col-sm-8">${new Date(order.createdAt).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Customer Information -->
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0"><i class="fas fa-user"></i> Customer Information</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Name:</strong></div>
                                <div class="col-sm-8">${this.getCustomerName(order)}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Email:</strong></div>
                                <div class="col-sm-8">${customerInfo.email || order.guestInfo?.email || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Phone:</strong></div>
                                <div class="col-sm-8">${customerInfo.phone || order.guestInfo?.phone || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Type:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge ${this.getCustomerTypeBadgeClass(order)}">
                                        ${this.getCustomerTypeText(order)}
                                    </span>
                                </div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Payment Method:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge ${this.getPaymentMethodBadgeClass(order.payment?.method)}">
                                        ${this.getPaymentMethodText(order.payment?.method)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Order Items -->
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-shopping-cart"></i> Order Items</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(order.items || []).map(item => `
                                    <tr>
                                        <td>
                                            <div class="fw-semibold">${this.getProductName(item)}</div>
                                            ${this.renderCustomizations(item)}
                                        </td>
                                        <td>${item.quantity || 1}</td>
                                        <td>$${(item.price || 0).toFixed(2)}</td>
                                        <td>$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="fw-bold">
                                    <td colspan="3">Total:</td>
                                    <td>$${this.calculateOrderTotal(order).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Payment Information -->
            ${order.payment ? `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-credit-card"></i> Payment Information</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Method:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge ${this.getPaymentMethodBadgeClass(order.payment.method)}">
                                        ${this.getPaymentMethodText(order.payment.method)}
                                    </span>
                                </div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Amount:</strong></div>
                                <div class="col-sm-8">$${(order.payment.amount || 0).toFixed(2)}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Status:</strong></div>
                                <div class="col-sm-8">
                                    <span class="badge ${this.getPaymentStatusBadgeClass(order.payment.status)}">
                                        ${order.payment.status || 'pending'}
                                    </span>
                                </div>
                            </div>
                            ${order.payment.transactionId ? `
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Transaction ID:</strong></div>
                                <div class="col-sm-8">${order.payment.transactionId}</div>
                            </div>
                            ` : ''}
                            ${order.payment.paymentProvider ? `
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Provider:</strong></div>
                                <div class="col-sm-8">${order.payment.paymentProvider}</div>
                            </div>
                            ` : ''}
                            ${order.payment.paymentDate ? `
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Payment Date:</strong></div>
                                <div class="col-sm-8">${new Date(order.payment.paymentDate).toLocaleString()}</div>
                            </div>
                            ` : ''}
                        </div>
                        ${order.payment.proofImage ? `
                        <div class="col-md-6">
                            <div class="text-center">
                                <strong>Payment Proof:</strong><br>
                                <div class="mt-2">
                                    <img src="${order.payment.proofImage}" alt="Payment Proof"
                                         class="img-fluid border rounded shadow-sm"
                                         style="max-height: 250px; max-width: 100%; cursor: pointer;"
                                         onclick="window.OrderManager.showPaymentProofModal('${order.payment.proofImage}', '${order.payment.proofImageOriginalName || 'Payment Proof'}')">
                                </div>
                                <small class="text-muted d-block mt-1">
                                    ${order.payment.proofImageOriginalName || 'Payment Proof Image'}<br>
                                    Click to view full size
                                </small>
                            </div>
                        </div>
                        ` : order.customerType === 'guest' ? `
                        <div class="col-md-6">
                            <div class="text-center text-muted">
                                <i class="fas fa-image fa-3x mb-2"></i><br>
                                <strong>No Payment Proof Uploaded</strong><br>
                                <small>Guest customer should upload payment proof</small>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Action Buttons -->
            <div class="d-flex justify-content-between">
                <div>
                    ${order.status === 'pending' ? `
                    <button type="button" class="btn btn-success me-2" onclick="window.AdminManager.acceptOrder('${order._id}')">
                        <i class="fas fa-check"></i> Accept Order
                    </button>
                    <button type="button" class="btn btn-warning me-2" onclick="window.AdminManager.updateOrderStatus('${order._id}', 'processing')">
                        <i class="fas fa-clock"></i> Mark as Processing
                    </button>
                    <button type="button" class="btn btn-danger me-2" onclick="window.AdminManager.showCancelOrderModal('${order._id}')">
                        <i class="fas fa-times"></i> Cancel Order
                    </button>
                    ` : ''}
                    ${order.status === 'confirmed' ? `
                    <button type="button" class="btn btn-primary me-2" onclick="window.AdminManager.updateOrderStatus('${order._id}', 'processing')">
                        <i class="fas fa-play"></i> Start Processing
                    </button>
                    <button type="button" class="btn btn-danger me-2" onclick="window.AdminManager.showCancelOrderModal('${order._id}')">
                        <i class="fas fa-times"></i> Cancel Order
                    </button>
                    ` : ''}
                    ${order.status === 'processing' ? `
                    <button type="button" class="btn btn-success me-2" onclick="window.AdminManager.updateOrderStatus('${order._id}', 'completed')">
                        <i class="fas fa-check-circle"></i> Mark as Completed
                    </button>
                    ` : ''}
                    ${order.status === 'completed' ? `
                    <span class="badge bg-success fs-6">
                        <i class="fas fa-check-circle"></i> Order Completed
                    </span>
                    ` : ''}
                    ${order.status === 'cancelled' ? `
                    <span class="badge bg-danger fs-6">
                        <i class="fas fa-times-circle"></i> Order Cancelled
                    </span>
                    ` : ''}
                </div>
                <div>
                    <button type="button" class="btn btn-outline-primary me-2" onclick="window.AdminManager.printOrder('${order._id}')">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        `;

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'pending': 'bg-warning text-dark',
            'confirmed': 'bg-info',
            'processing': 'bg-primary',
            'completed': 'bg-success',
            'cancelled': 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    getCustomerTypeBadgeClass(order) {
        if (order.customerType === 'registered') {
            return 'bg-primary';
        } else if (order.customerType === 'guest') {
            return 'bg-secondary';
        }
        // Legacy fallback
        return (order.customerId && (typeof order.customerId === 'object' || typeof order.customerId === 'string')) ? 'bg-primary' : 'bg-secondary';
    }

    getCustomerTypeText(order) {
        if (order.customerType === 'registered') {
            return 'Registered Customer';
        } else if (order.customerType === 'guest') {
            return 'Guest Customer';
        }
        // Legacy fallback
        return (order.customerId && (typeof order.customerId === 'object' || typeof order.customerId === 'string')) ? 'Registered' : 'Guest';
    }

    getPaymentMethodBadgeClass(method) {
        const methodClasses = {
            'integrated': 'bg-success',
            'proof_upload': 'bg-info',
            'cash': 'bg-warning text-dark',
            'card': 'bg-primary',
            'mobile_money': 'bg-info'
        };
        return methodClasses[method] || 'bg-secondary';
    }

    getPaymentMethodText(method) {
        const methodTexts = {
            'integrated': 'Integrated Payment',
            'proof_upload': 'Payment Proof Upload',
            'cash': 'Cash Payment',
            'card': 'Card Payment',
            'mobile_money': 'Mobile Money'
        };
        return methodTexts[method] || method || 'Unknown';
    }

    getPaymentStatusBadgeClass(status) {
        const statusClasses = {
            'paid': 'bg-success',
            'pending': 'bg-warning text-dark',
            'failed': 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    showPaymentProofModal(imageUrl, imageName) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('paymentProofModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'paymentProofModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="paymentProofModalTitle">Payment Proof</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center" id="paymentProofModalBody">
                        </div>
                        <div class="modal-footer">
                            <a href="#" id="paymentProofDownload" class="btn btn-primary" target="_blank">
                                <i class="fas fa-download"></i> Download
                            </a>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const modalTitle = document.getElementById('paymentProofModalTitle');
        const modalBody = document.getElementById('paymentProofModalBody');
        const downloadLink = document.getElementById('paymentProofDownload');

        modalTitle.textContent = imageName || 'Payment Proof';
        modalBody.innerHTML = `
            <img src="${imageUrl}" alt="Payment Proof" class="img-fluid" style="max-width: 100%; height: auto;">
        `;
        downloadLink.href = imageUrl;

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    getProductName(item) {
        // Priority order: product.name > name > productId (as fallback)
        if (item.product && item.product.name) {
            return item.product.name;
        }
        if (item.name && item.name !== 'Unknown Product') {
            return item.name;
        }
        if (item.productId) {
            // Convert slug-like productId to readable name
            return item.productId
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        return 'Unknown Product';
    }

    renderCustomizations(item) {
        const customizations = item.customization || item.customizations || {};

        if (!customizations || Object.keys(customizations).length === 0) {
            return '';
        }

        const customizationItems = [];

        if (customizations.flavor) {
            customizationItems.push(`Flavor: ${customizations.flavor}`);
        }
        if (customizations.icing) {
            customizationItems.push(`Icing: ${customizations.icing}`);
        }
        if (customizations.decorations) {
            customizationItems.push(`Decorations: ${customizations.decorations}`);
        }
        if (customizations.color) {
            customizationItems.push(`Color: ${customizations.color}`);
        }
        if (customizations.size) {
            customizationItems.push(`Size: ${customizations.size}`);
        }

        if (customizationItems.length === 0) {
            return '';
        }

        return `
            <small class="text-muted">
                ${customizationItems.join('<br>')}
            </small>
        `;
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
window.OrderManagement = OrderManagement;
