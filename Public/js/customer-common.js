document.addEventListener('DOMContentLoaded', async () => {
  console.log('👤 Customer common script loading...');

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
      console.warn('❌ User not authenticated, redirecting to login');
      window.location.href = '/login.html';
      return;
    }

    // Ensure user is customer
    if (!authClient.isCustomer()) {
      console.warn('❌ Access denied: User is not a customer');
      window.location.href = '/login.html';
      return;
    }

    const user = authClient.user;
    console.log('✅ Customer common script loaded for:', user.firstName, user.lastName);

    // Update UI elements with user info
    const userNameElem = document.querySelector('.user-name');
    const userAvatarElem = document.querySelector('.user-avatar');
    const sidebarWelcome = document.querySelector('.sidebar-header p');

    if (userNameElem) userNameElem.textContent = `${user.firstName} ${user.lastName}`;
    if (userAvatarElem) userAvatarElem.textContent = user.firstName.charAt(0).toUpperCase();
    if (sidebarWelcome) sidebarWelcome.textContent = `Welcome back, ${user.firstName}!`;

  } catch (error) {
    console.error('❌ Error in customer common script:', error);
    window.location.href = '/login.html';
  }

  // Logout button handler using unified auth client
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('🚪 Customer logout initiated');

      try {
        if (typeof authClient !== 'undefined') {
          await authClient.logout();
        } else {
          // Fallback
          localStorage.clear();
          window.location.href = '/index.html';
        }
      } catch (error) {
        console.error('❌ Error during logout:', error);
        // Fallback
        localStorage.clear();
        window.location.href = '/index.html';
      }
    });
  }
});
