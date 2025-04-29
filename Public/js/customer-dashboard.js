document.addEventListener('DOMContentLoaded', () => {
  // Fetch and display user profile and dashboard data
  fetch('/api/customers/me', {
    method: 'GET',
    credentials: 'include', // to send cookies
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to fetch profile: ' + res.status + ' ' + res.statusText);
    return res.json();
  })
  .then(data => {
    if (data.success && data.user) {
      const user = data.user;
      const sidebarWelcome = document.querySelector('.sidebar-user-firstname');
      if (sidebarWelcome) sidebarWelcome.textContent = user.firstName;

      // Load profile content into main dashboard area
      loadProfileContent(user);

      // Fetch dashboard stats after user profile is loaded
      fetchDashboardStats();

      // Fetch other customer data
      fetchOrders();
      fetchAddresses();
      fetchWishlist();
      fetchReviews();
    } else {
      console.warn('User not authorized or not logged in');
      window.location.href = 'login.html';
    }
  })
  .catch(error => {
    console.error('Error fetching user profile:', error);
    window.location.href = 'login.html';
  });

  // Logout button handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include'
      })
      .then(res => {
        if (res.ok) {
          localStorage.clear();
          window.location.href = 'login.html';
        } else {
          alert('Logout failed: ' + res.status + ' ' + res.statusText);
        }
      })
      .catch(error => {
        alert('Logout failed: ' + error.message);
      });
    });
  }

  // Load profile content into dashboard main content area
  function loadProfileContent(user) {
    const mainContent = document.getElementById('dashboard-main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <header class="dashboard-header">
        <h1>Welcome, ${user.firstName} ${user.lastName}</h1>
        <div class="user-profile">
          <div class="user-avatar" id="user-avatar">${user.firstName.charAt(0).toUpperCase()}</div>
          <span class="user-name">${user.firstName} ${user.lastName}</span>
        </div>
      </header>

      <div class="dashboard-cards">
        <div class="dashboard-card" id="card-total-orders" style="cursor:pointer;">
          <div class="card-header">
            <span class="card-title">Total Orders</span>
            <div class="card-icon">
              <i class="fas fa-shopping-bag"></i>
            </div>
          </div>
          <div class="card-value" id="total-orders">0</div>
        </div>

        <div class="dashboard-card">
          <div class="card-header">
            <span class="card-title">Total Spent</span>
            <div class="card-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
          </div>
          <div class="card-value" id="total-spent">$0.00</div>
        </div>

        <div class="dashboard-card" id="card-wishlist-items" style="cursor:pointer;">
          <div class="card-header">
            <span class="card-title">Wishlist Items</span>
            <div class="card-icon">
              <i class="fas fa-heart"></i>
            </div>
          </div>
          <div class="card-value" id="wishlist-items">0</div>
        </div>

        <div class="dashboard-card" id="card-reviews-count" style="cursor:pointer;">
          <div class="card-header">
            <span class="card-title">Reviews</span>
            <div class="card-icon">
              <i class="fas fa-star"></i>
            </div>
          </div>
          <div class="card-value" id="reviews-count">0</div>
        </div>
      </div>

      <section class="dashboard-section">
        <div class="section-header">
          <h3 class="section-title">Recent Orders</h3>
          <a href="customer-orders.html" class="section-link">View All Orders</a>
        </div>
        <div class="table-responsive">
          <table class="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="orders-table-body">
              <tr><td colspan="6">Loading orders...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    `;

    // Make avatar clickable (NEW ADDITION)
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
      userAvatar.style.cursor = 'pointer'; // Visual feedback
      userAvatar.title = 'View Profile'; // Tooltip
      userAvatar.addEventListener('click', () => {
        window.location.href = 'profile.html';
      });
      
      // Optional hover effect via JavaScript (better done in CSS)
      userAvatar.addEventListener('mouseenter', () => {
        userAvatar.style.transform = 'scale(1.05)';
      });
      userAvatar.addEventListener('mouseleave', () => {
        userAvatar.style.transform = 'scale(1)';
      });
    }
  }

  // Fetch dashboard stats
  function fetchDashboardStats() {
    fetch('/api/customers/dashboard-stats', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch dashboard stats: ' + res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(data => {
      if (data.success && data.stats) {
        document.getElementById('total-orders').textContent = data.stats.totalOrders || 0;
        document.getElementById('total-spent').textContent = `$${(data.stats.totalSpent || 0).toFixed(2)}`;
        document.getElementById('wishlist-items').textContent = data.stats.wishlistItems || 0;
        document.getElementById('reviews-count').textContent = data.stats.reviews || 0;
      }
    })
    .catch(error => {
      console.error('Error fetching dashboard stats:', error);
    });
  }

  // Fetch recent orders
  function fetchOrders() {
    fetch('/api/orders/my-orders', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch orders: ' + res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(data => {
      if (data.success && Array.isArray(data.data)) {
        const tbody = document.getElementById('orders-table-body');
        tbody.innerHTML = '';
        data.data.forEach(order => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="order-id">#${order.orderNumber || order._id}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>${order.items ? order.items.length : 0}</td>
            <td>$${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</td>
            <td><span class="badge badge-${order.status || 'pending'}">${order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}</span></td>
            <td>
              <button class="action-btn action-btn-primary" onclick="viewOrderDetails('${order._id}')">
                <i class="fas fa-eye"></i> View
              </button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    })
    .catch(error => {
      console.error('Error fetching orders:', error);
    });
  }

  // Fetch addresses
  function fetchAddresses() {
    fetch('/api/customers/addresses', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch addresses: ' + res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Addresses:', data.data);
      }
    })
    .catch(error => {
      console.error('Error fetching addresses:', error);
    });
  }

  // Fetch wishlist items
  function fetchWishlist() {
    fetch('/api/customers/wishlist', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch wishlist: ' + res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Wishlist:', data.data);
      }
    })
    .catch(error => {
      console.error('Error fetching wishlist:', error);
    });
  }

  // Fetch reviews
  function fetchReviews() {
    fetch('/api/customers/reviews', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch reviews: ' + res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Reviews:', data.data);
      }
    })
    .catch(error => {
      console.error('Error fetching reviews:', error);
    });
  }

  // View order details function
  window.viewOrderDetails = function(orderId) {
    const modal = document.getElementById('orderModal');
    modal.style.display = 'block';

    fetch(`/api/orders/${orderId}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch order details: ' + res.status + ' ' + res.statusText);
      return res.json();
    })
    .then(data => {
      if (data.success && data.data) {
        populateOrderModal(data.data);
      } else {
        console.error('Failed to load order details');
      }
    })
    .catch(error => {
      console.error('Error fetching order details:', error);
    });
  };

  // Populate order modal with order details
  function populateOrderModal(order) {
    const modal = document.getElementById('orderModal');
    const modalTitle = modal.querySelector('.modal-title');
    modalTitle.textContent = `Order #${order.orderNumber || order._id}`;

    // Customer Information
    const customerInfoSection = modal.querySelector('#customer-info-section');
    customerInfoSection.innerHTML = `
      <h3>Customer Information</h3>
      <p><strong>Name:</strong> ${order.customerName || ''}</p>
      <p><strong>Email:</strong> ${order.customerEmail || ''}</p>
      <p><strong>Phone:</strong> ${order.customerPhone || ''}</p>
    `;

    // Delivery Information
    const deliveryInfoSection = modal.querySelector('#delivery-info-section');
    deliveryInfoSection.innerHTML = `
      <h3>Delivery Information</h3>
      <p><strong>Type:</strong> ${order.deliveryType || ''}</p>
      <p><strong>Address:</strong> ${order.deliveryAddress || ''}</p>
      <p><strong>City:</strong> ${order.deliveryCity || ''}</p>
      <p><strong>Date Needed:</strong> ${order.dateNeeded ? new Date(order.dateNeeded).toLocaleDateString() : ''}</p>
      <p><strong>Time Needed:</strong> ${order.timeNeeded || ''}</p>
    `;

    // Order Items
    const orderItemsContainer = modal.querySelector('#order-items-container');
    let itemsHtml = '<h3>Order Items</h3>';
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        itemsHtml += `
          <div class="order-item">
            <img src="${item.image || 'images/default-preview.jpg'}" alt="${item.name}" class="order-item-image">
            <div class="order-item-details">
              <h4 class="order-item-name">${item.name}</h4>
              <p>Quantity: ${item.quantity}</p>
              <p class="order-item-price">$${item.price.toFixed(2)} (${item.price.toFixed(2)} each)</p>
            </div>
          </div>
        `;
      });
    } else {
      itemsHtml += '<p>No items found in this order.</p>';
    }
    orderItemsContainer.innerHTML = itemsHtml;

    // Order Total
    const orderTotalContainer = modal.querySelector('#order-total-container');
    orderTotalContainer.innerHTML = `
      <p><strong>Subtotal:</strong> $${order.subtotal ? order.subtotal.toFixed(2) : '0.00'}</p>
      <p><strong>Delivery Fee:</strong> $${order.deliveryFee ? order.deliveryFee.toFixed(2) : '0.00'}</p>
      <p><strong>Tax:</strong> $${order.tax ? order.tax.toFixed(2) : '0.00'}</p>
      <p class="total-amount">Total: $${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</p>
    `;

    // Timeline
    const timelineContainer = modal.querySelector('#order-timeline');
    let timelineHtml = '<h3>Order Status</h3>';
    if (order.statusTimeline && order.statusTimeline.length > 0) {
      order.statusTimeline.forEach(status => {
        const statusClass = status.completed ? 'completed' : (status.active ? 'active' : '');
        timelineHtml += `
          <div class="timeline-item ${statusClass}">
            <div class="timeline-icon">
              <i class="fas fa-check"></i>
            </div>
            <div class="timeline-content">
              <h4>${status.status}</h4>
              <p>${new Date(status.date).toLocaleString()}</p>
            </div>
          </div>
        `;
      });
    } else {
      timelineHtml += '<p>No status updates available.</p>';
    }
    timelineContainer.innerHTML = timelineHtml;

    // Special Instructions
    const specialInstructionsContainer = modal.querySelector('#order-special-instructions');
    specialInstructionsContainer.innerHTML = `
      <h3>Special Instructions</h3>
      <p>${order.specialInstructions || 'None'}</p>
    `;
  }

  // Close modal function
  window.closeModal = function() {
    const modal = document.getElementById('orderModal');
    modal.style.display = 'none';
  };

  // Close modal when clicking outside
  window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
});