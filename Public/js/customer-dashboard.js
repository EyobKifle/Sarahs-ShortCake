// customer-dashboard.js - Handles customer dashboard functionality

document.addEventListener('DOMContentLoaded', () => {
    loadCustomerData();
    loadRecentOrders();
    setupLogout();
    updateCartCount();
});

// Load customer profile data and update UI
async function loadCustomerData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const user = await response.json();

        document.getElementById('profile-name').textContent = user.firstName + (user.lastName ? ' ' + user.lastName : '');
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('welcome-message').textContent = `Welcome, ${user.firstName}!`;

        // Optionally update avatar if user has one
        // document.getElementById('profile-avatar').src = user.avatarUrl || 'images/default-avatar.jpg';

        // Store user data in localStorage for other pages if needed
        localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
        console.error('Error loading customer data:', error);
        alert('Error loading customer data. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Load recent orders for the logged-in customer
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        const response = await fetch('/api/orders/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }

        const orders = await response.json();

        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = '';

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = '<p>No recent orders found.</p>';
            return;
        }

        orders.slice(0, 5).forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';

            const orderDate = new Date(order.neededDate).toLocaleDateString();

            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">Order #${order._id}</span>
                    <span class="order-date">${orderDate}</span>
                    <span class="order-status status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.cakeFlavor} Cupcake (x${item.quantity})</span>
                            <span>$${(item.quantity * (item.price || 3.99)).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">Total: $${order.totalPrice.toFixed(2)}</div>
                <a href="order.html?id=${order._id}" class="view-order">View Order Details</a>
            `;

            ordersList.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error loading recent orders:', error);
        const ordersList = document.getElementById('orders-list');
        if (ordersList) {
            ordersList.innerHTML = '<p>Error loading recent orders.</p>';
        }
    }
}

// Setup logout button functionality
function setupLogout() {
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error('Logout failed');
                }
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Logout failed. Please try again.');
            }
        });
    }
}

// Update cart count in header
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        // This should be integrated with your cart manager or localStorage cart data
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
        cartCountElement.textContent = count;
    }
}
