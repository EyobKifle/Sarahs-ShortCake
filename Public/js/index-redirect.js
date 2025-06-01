document.addEventListener('DOMContentLoaded', async () => {
  console.log('🏠 Index page loading...');

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

    // Check if user is authenticated
    if (authClient.isAuthenticated) {
      console.log('🔐 User already authenticated, checking validity...');

      const isValid = await authClient.checkAuth();
      if (isValid) {
        console.log('✅ Valid authentication found, redirecting...');

        if (authClient.isAdmin()) {
          console.log('🔄 Redirecting admin to admin dashboard');
          window.location.href = '/admin.html';
        } else {
          console.log('🔄 Redirecting customer to customer dashboard');
          window.location.href = '/customer-dashboard.html';
        }
      } else {
        console.log('❌ Invalid authentication, clearing and staying on index');
        authClient.clearAuth();
      }
    } else {
      console.log('👤 No authentication found, showing public index page');
    }
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    // Stay on index page if there's an error
  }
});
