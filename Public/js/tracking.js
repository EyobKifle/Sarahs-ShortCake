/**
 * Tracking.js - Handles order tracking functionality for both guests and logged-in users
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the tracking functionality
    TrackingManager.init();
});

class TrackingManager {
    static init() {
        // Check if user is logged in
        const isLoggedIn = this.checkLoginStatus();
        
        // Show appropriate view based on login status
        if (isLoggedIn) {
            this.showUserOrdersView();
            this.loadUserOrders();
            this.setupUserOrderFilters();
        } else {
            this.showGuestTrackingView();
            this.setupTrackingForm();
        }
    }
    
    /**
     * Check if user is logged in by looking for token in localStorage
     */
    static checkLoginStatus() {
        const token = localStorage.getItem('token');
        return !!token;
    }
    
    /**
     * Show the guest tracking view and hide the user orders view
     */
    static showGuestTrackingView() {
        document.getElementById('guestView').classList.remove('hidden');
        document.getElementById('userView').classList.add('hidden');
    }
    
    /**
     * Show the user orders view and hide the guest tracking view
     */
    static showUserOrdersView() {
        document.getElementById('guestView').classList.add('hidden');
        document.getElementById('userView').classList.remove('hidden');
    }
    
    /**
     * Set up the tracking form for guest users
     */
    static setupTrackingForm() {
        const trackingForm = document.getElementById('trackingForm');
        const tryAgainBtn = document.getElementById('tryAgainBtn');
        
        if (trackingForm) {
            trackingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const trackingNumber = document.getElementById('trackingNumber').value.trim();
                
                if (trackingNumber) {
                    this.trackOrder(trackingNumber);
                }
            });
        }
        
        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
                document.getElementById('noOrderFound').classList.add('hidden');
                document.getElementById('trackingForm').reset();
            });
        }
    }
    
    /**
     * Track an order using the tracking number
     * @param {string} trackingNumber - The tracking number to look up
     */
    static trackOrder(trackingNumber) {
        // Show loading state
        this.showLoading();
        
        // Simulate API call to get order details
        setTimeout(() => {
            // For demo purposes, we'll use a mock order
            // In a real application, this would be an API call
            const order = this.getMockOrder(trackingNumber);
            
            if (order) {
                this.displayOrderDetails(order);
            } else {
                this.showOrderNotFound();
            }
            
            this.hideLoading();
        }, 1000);
    }
    
    /**
     * Get a mock order for demonstration purposes
     * @param {string} trackingNumber - The tracking number to look up
     * @returns {Object|null} - The order object or null if not found
     */
    static getMockOrder(trackingNumber) {
        // Mock orders for demonstration
        const mockOrders = {
            'TRACK123': {
                id: '12345',
                date: 'May 15, 2024',
                estimatedDelivery: 'May 20, 2024',
                status: 'Processing',
                items: [
                    { name: 'Chocolate Cupcake', quantity: 2, price: 3.50 },
                    { name: 'Vanilla Cupcake', quantity: 1, price: 3.00 }
                ],
                total: 45.00,
                timeline: [
                    { status: 'Order Placed', date: 'May 15, 2024 - 10:30 AM', completed: true },
                    { status: 'Order Confirmed', date: 'May 15, 2024 - 11:45 AM', completed: true },
                    { status: 'Processing', date: 'May 16, 2024 - 9:15 AM', completed: false, active: true },
                    { status: 'Out for Delivery', date: 'Pending', completed: false },
                    { status: 'Delivered', date: 'Pending', completed: false }
                ]
            },
            'TRACK456': {
                id: '12346',
                date: 'May 10, 2024',
                estimatedDelivery: 'May 15, 2024',
                status: 'Delivered',
                items: [
                    { name: 'Custom Birthday Cake', quantity: 1, price: 75.00 }
                ],
                total: 75.00,
                timeline: [
                    { status: 'Order Placed', date: 'May 10, 2024 - 2:30 PM', completed: true },
                    { status: 'Order Confirmed', date: 'May 10, 2024 - 3:45 PM', completed: true },
                    { status: 'Processing', date: 'May 12, 2024 - 9:15 AM', completed: true },
                    { status: 'Out for Delivery', date: 'May 15, 2024 - 10:30 AM', completed: true },
                    { status: 'Delivered', date: 'May 15, 2024 - 2:15 PM', completed: true, active: true }
                ]
            }
        };
        
        return mockOrders[trackingNumber] || null;
    }
    
    /**
     * Display order details in the UI
     * @param {Object} order - The order object to display
     */
    static displayOrderDetails(order) {
        // Hide the tracking form and "not found" message
        document.getElementById('trackingForm').parentElement.classList.add('hidden');
        document.getElementById('noOrderFound').classList.add('hidden');
        
        // Show the order details
        const orderDetails = document.getElementById('orderDetails');
        orderDetails.classList.remove('hidden');
        
        // Update order information
        document.getElementById('orderNumber').textContent = `#${order.id}`;
        document.getElementById('orderDate').textContent = order.date;
        document.getElementById('estimatedDelivery').textContent = order.estimatedDelivery;
        document.getElementById('orderStatus').textContent = order.status;
        document.getElementById('orderStatus').className = `status-badge ${order.status.toLowerCase()}`;
        document.getElementById('orderTotal').textContent = `$${order.total.toFixed(2)}`;
        
        // Update order items
        const itemsList = document.getElementById('orderItemsList');
        itemsList.innerHTML = '';
        
        order.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            itemElement.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                </div>
                <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            `;
            itemsList.appendChild(itemElement);
        });
        
        // Update timeline
        const timeline = document.querySelector('.timeline');
        timeline.innerHTML = '';
        
        order.timeline.forEach(step => {
            const timelineItem = document.createElement('div');
            timelineItem.className = `timeline-item ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`;
            
            const icon = step.completed ? 'fa-check' : (step.active ? 'fa-spinner fa-spin' : 'fa-circle');
            
            timelineItem.innerHTML = `
                <div class="timeline-icon"><i class="fas ${icon}"></i></div>
                <div class="timeline-content">
                    <h5>${step.status}</h5>
                    <p>${step.date}</p>
                </div>
            `;
            
            timeline.appendChild(timelineItem);
        });
    }
    
    /**
     * Show the "order not found" message
     */
    static showOrderNotFound() {
        document.getElementById('trackingForm').parentElement.classList.add('hidden');
        document.getElementById('orderDetails').classList.add('hidden');
        document.getElementById('noOrderFound').classList.remove('hidden');
    }
    
    /**
     * Load user orders for logged-in users
     */
    static loadUserOrders() {
        // Show loading state
        this.showLoading();
        
        // Simulate API call to get user orders
        setTimeout(() => {
            // For demo purposes, we'll use mock orders
            // In a real application, this would be an API call
            const orders = this.getMockUserOrders();
            
            if (orders && orders.length > 0) {
                this.displayUserOrders(orders);
            } else {
                this.showNoOrdersFound();
            }
            
            this.hideLoading();
        }, 1000);
    }
    
    /**
     * Get mock user orders for demonstration purposes
     * @returns {Array} - Array of order objects
     */
    static getMockUserOrders() {
        return [
            {
                id: '12345',
                date: 'May 15, 2024',
                status: 'pending',
                items: [
                    { name: 'Chocolate Cupcake', quantity: 2 },
                    { name: 'Vanilla Cupcake', quantity: 1 }
                ],
                total: 45.00
            },
            {
                id: '12344',
                date: 'May 10, 2024',
                status: 'processing',
                items: [
                    { name: 'Custom Birthday Cake', quantity: 1 }
                ],
                total: 75.00
            },
            {
                id: '12340',
                date: 'April 28, 2024',
                status: 'delivered',
                items: [
                    { name: 'Assorted Cupcakes', quantity: 6 }
                ],
                total: 60.00
            }
        ];
    }
    
    /**
     * Display user orders in the UI
     * @param {Array} orders - Array of order objects
     */
    static displayUserOrders(orders) {
        const ordersList = document.getElementById('userOrdersList');
        ordersList.innerHTML = '';
        
        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            // Create item summary
            const itemSummary = order.items.map(item => 
                `${item.quantity} ${item.name}`
            ).join(', ');
            
            orderCard.innerHTML = `
                <div class="order-card-header">
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">${order.date}</div>
                    <div class="order-status ${order.status}">${this.capitalizeFirstLetter(order.status)}</div>
                </div>
                <div class="order-card-body">
                    <div class="order-summary">
                        <div class="order-items-summary">
                            <span class="item-count">${order.items.reduce((total, item) => total + item.quantity, 0)} items</span>
                            <span class="item-details">${itemSummary}</span>
                        </div>
                        <div class="order-total">$${order.total.toFixed(2)}</div>
                    </div>
                    <div class="order-actions">
                        <button class="view-details-btn" data-order-id="${order.id}"><i class="fas fa-eye"></i> View Details</button>
                        ${order.status !== 'delivered' ? 
                            `<button class="track-order-btn" data-order-id="${order.id}"><i class="fas fa-truck"></i> Track Order</button>` : 
                            `<button class="reorder-btn" data-order-id="${order.id}"><i class="fas fa-redo"></i> Reorder</button>`
                        }
                    </div>
                </div>
            `;
            
            ordersList.appendChild(orderCard);
        });
        
        // Add event listeners to buttons
        this.setupOrderCardButtons();
    }
    
    /**
     * Set up event listeners for order card buttons
     */
    static setupOrderCardButtons() {
        // View details buttons
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.currentTarget.getAttribute('data-order-id');
                this.viewOrderDetails(orderId);
            });
        });
        
        // Track order buttons
        document.querySelectorAll('.track-order-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.currentTarget.getAttribute('data-order-id');
                this.trackUserOrder(orderId);
            });
        });
        
        // Reorder buttons
        document.querySelectorAll('.reorder-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.currentTarget.getAttribute('data-order-id');
                this.reorderItems(orderId);
            });
        });
    }
    
    /**
     * Set up filters for user orders
     */
    static setupUserOrderFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    }
    
    /**
     * Apply filters to user orders
     */
    static applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        // In a real application, this would filter the orders from the API
        // For demo purposes, we'll just reload the orders
        this.loadUserOrders();
    }
    
    /**
     * View details of a specific order
     * @param {string} orderId - The ID of the order to view
     */
    static viewOrderDetails(orderId) {
        // In a real application, this would navigate to an order details page
        // For demo purposes, we'll just show an alert
        alert(`Viewing details for order #${orderId}`);
    }
    
    /**
     * Track a specific order
     * @param {string} orderId - The ID of the order to track
     */
    static trackUserOrder(orderId) {
        // In a real application, this would navigate to a tracking page
        // For demo purposes, we'll just show an alert
        alert(`Tracking order #${orderId}`);
    }
    
    /**
     * Reorder items from a previous order
     * @param {string} orderId - The ID of the order to reorder
     */
    static reorderItems(orderId) {
        // In a real application, this would add items to the cart
        // For demo purposes, we'll just show an alert
        alert(`Adding items from order #${orderId} to cart`);
    }
    
    /**
     * Show the "no orders found" message
     */
    static showNoOrdersFound() {
        document.getElementById('userOrdersList').classList.add('hidden');
        document.getElementById('noOrdersFound').classList.remove('hidden');
    }
    
    /**
     * Show loading state
     */
    static showLoading() {
        // In a real application, this would show a loading spinner
        console.log('Loading...');
    }
    
    /**
     * Hide loading state
     */
    static hideLoading() {
        // In a real application, this would hide the loading spinner
        console.log('Loading complete');
    }
    
    /**
     * Capitalize the first letter of a string
     * @param {string} string - The string to capitalize
     * @returns {string} - The capitalized string
     */
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
} 