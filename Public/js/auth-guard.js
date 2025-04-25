document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token || !userStr) {
    // Not authenticated, redirect to login
    window.location.href = 'login.html';
    return;
  }
  try {
    const user = JSON.parse(userStr);
    const allowedCustomerPages = [
      'customer-dashboard.html',
      'customer-orders.html',
      'customer-menu.html',
      'customer-wishlist.html',
      'customer-reviews.html',
      'customer-settings.html'
    ];
    const allowedAdminPages = [
      'Admin/admin.html',
      'Admin/admin-orders.html',
      'Admin/admin-settings.html',
      // Add other admin pages here
    ];
    const currentPage = window.location.pathname.split('/').pop();

    if (user.role === 'admin') {
      if (!allowedAdminPages.includes(currentPage)) {
        // Redirect admin to admin dashboard if accessing unauthorized page
        window.location.href = 'Admin/admin.html';
      }
    } else {
      // Assume customer role
      if (!allowedCustomerPages.includes(currentPage)) {
        // Redirect customer to customer dashboard if accessing unauthorized page
        window.location.href = 'customer-dashboard.html';
      }
    }
  } catch (e) {
    // Parsing error, redirect to login
    window.location.href = 'login.html';
  }
});
