document.addEventListener('DOMContentLoaded', async () => {
  console.log('🛡️ Auth guard checking authentication...');

  try {
    // Wait for auth client to be available
    if (typeof authClient === 'undefined') {
      console.log('⏳ Waiting for auth client to load...');
      await new Promise(resolve => {
        const checkAuthClient = () => {
          if (typeof authClient !== 'undefined') {
            resolve();
          } else {
            setTimeout(checkAuthClient, 100);
          }
        };
        checkAuthClient();
      });
    }

    // Check authentication using unified auth client
    const isAuthenticated = await authClient.checkAuth();

    if (!isAuthenticated) {
      console.log('❌ Auth guard: User not authenticated, redirecting to login');
      window.location.href = '/login.html';
      return;
    }

    console.log('✅ Auth guard: User authenticated as', authClient.userType);

    // Define allowed pages for each role
    const allowedCustomerPages = [
      'customer-dashboard.html',
      'customer-orders.html',
      'customer-menu.html',
      'customer-reviews.html',
      'customer-settings.html',
      'customer-order-confirmation.html',
      'profile.html'
    ];

    const allowedAdminPages = [
      'admin.html',
      'admin-orders.html',
      'admin-settings.html',
      'admin-inventory.html',
      'admin-reports.html',
      'admin-contact-messages.html',
      'admin-customers.html'
    ];

    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    console.log('🔍 Auth guard: Current page:', currentPage);

    // Check role-based access
    if (allowedAdminPages.includes(currentPage)) {
      if (!authClient.isAdmin()) {
        console.log('❌ Auth guard: Admin page requires admin role, redirecting customer to dashboard');
        window.location.href = '/customer-dashboard.html';
        return;
      }
      console.log('✅ Auth guard: Admin access granted');
    } else if (allowedCustomerPages.includes(currentPage)) {
      if (!authClient.isCustomer()) {
        console.log('❌ Auth guard: Customer page requires customer role, redirecting admin to dashboard');
        window.location.href = '/admin.html';
        return;
      }
      console.log('✅ Auth guard: Customer access granted');
    } else {
      console.log('⚠️ Auth guard: Page not in allowed lists, allowing access');
      // Allow access to other pages (like public pages that might be loaded)
    }

  } catch (error) {
    console.error('❌ Auth guard error:', error);
    window.location.href = '/login.html';
  }
});
