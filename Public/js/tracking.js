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
        document.getElementById('guest-tracking-section').style.display = 'block';
        document.getElementById('user-orders-section').style.display = 'none';
        document.getElementById('tracking-section').style.display = 'none';
    }
    
    /**
     * Show the user orders view and hide the guest tracking view
     */
    static showUserOrdersView() {
        document.getElementById('guest-tracking-section').style.display = 'none';
        document.getElementById('user-orders-section').style.display = 'block';
        document.getElementById('tracking-section').style.display = 'block';
    }
    
    /**
     * Set up the tracking form for guest users
     */
    static setupTrackingForm() {
        const trackingForm = document.getElementById('tracking-form');
        
        if (trackingForm) {
            trackingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const orderNumber = document.getElementById('order-number').value.trim();
                
                if (orderNumber) {
                    this.trackOrder(orderNumber);
                }
            });
        }
    }
    
    /**
     * Track an order using the order number (guest)
     * @param {string} orderNumber - The order number to look up
     */
    static async trackOrder(orderNumber) {
        this.showLoading();
        try {
            const response = await fetch(`/api/orders/${orderNumber}`);
            if (!response.ok) {
                throw new Error('Order not found');
            }
            const order = await response.json();
            this.displayOrderDetails(order);
        } catch (error) {
            this.showOrderNotFound();
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Display order details in the UI
     * @param {Object} order - The order object to display
     */
    static displayOrderDetails(order) {
        // Show order status section
        const orderStatus = document.getElementById('order-status');
        orderStatus.style.display = 'block';
        
        document.getElementById('order-id').textContent = order._id || order.id;
        document.getElementById('current-status').textContent = order.status;
        document.getElementById('delivery-estimate').textContent = order.estimatedDelivery || 'N/A';
        
        // Populate status timeline
        const timeline = document.getElementById('status-timeline');
        timeline.innerHTML = '';
        if (order.timeline && Array.isArray(order.timeline)) {
            order.timeline.forEach(step => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'status-step';
                if (step.completed) stepDiv.classList.add('completed');
                if (step.active) stepDiv.classList.add('active');
                stepDiv.textContent = `${step.status} - ${step.date}`;
                timeline.appendChild(stepDiv);
            });
        }
    }
    
    /**
     * Show the "order not found" message
     */
    static showOrderNotFound() {
        alert('Order not found. Please check your order number and try again.');
    }
    
    /**
     * Load user orders for logged-in users
     */
    static async loadUserOrders() {
        this.showLoading();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/orders/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user orders');
            }
            const orders = await response.json();
            this.displayUserOrders(orders);
        } catch (error) {
            this.showNoOrdersFound();
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Display user orders in the UI
     * @param {Array} orders - Array of order objects
     */
    static displayUserOrders(orders) {
        const container = document.getElementById('user-orders-container');
        container.innerHTML = '';
        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="no-orders">No orders found.</p>';
            return;
        }
        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-card-header">
                    <h3>Order #${order._id}</h3>
                    <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="order-card-body">
                    <p>Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
                    <p>Total: $${order.total.toFixed(2)}</p>
                </div>
                <div class="order-card-footer">
                    <button class="track-order-btn" data-id="${order._id}">Track Order</button>
                </div>
            `;
            container.appendChild(card);
        });
        // Add event listeners for track buttons
        container.querySelectorAll('.track-order-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-id');
                this.trackUserOrder(orderId);
            });
        });
    }
    
    /**
     * Track a specific user order
     * @param {string} orderId - The ID of the order to track
     */
    static async trackUserOrder(orderId) {
        this.showLoading();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Order not found');
            }
            const order = await response.json();
            this.displayUserOrderStatus(order);
        } catch (error) {
            alert('Order not found.');
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Display detailed user order status
     * @param {Object} order - The order object
     */
    static displayUserOrderStatus(order) {
        const statusSection = document.getElementById('user-order-status');
        statusSection.style.display = 'block';
        document.getElementById('user-order-id').textContent = order._id || order.id;
        document.getElementById('user-current-status').textContent = order.status;
        document.getElementById('user-delivery-estimate').textContent = order.estimatedDelivery || 'N/A';
        
        const timeline = document.getElementById('user-status-timeline');
        timeline.innerHTML = '';
        if (order.timeline && Array.isArray(order.timeline)) {
            order.timeline.forEach(step => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'status-step';
                if (step.completed) stepDiv.classList.add('completed');
                if (step.active) stepDiv.classList.add('active');
                stepDiv.textContent = `${step.status} - ${step.date}`;
                timeline.appendChild(stepDiv);
            });
        }
    }
    
    /**
     * Show the "no orders found" message
     */
    static showNoOrdersFound() {
        const container = document.getElementById('user-orders-container');
        container.innerHTML = '<p class="no-orders">No orders found.</p>';
    }
    
    /**
     * Show loading state
     */
    static showLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'block';
    }
    
    /**
     * Hide loading state
     */
    static hideLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}
