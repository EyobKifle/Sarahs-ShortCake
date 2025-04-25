document.addEventListener('DOMContentLoaded', function() {
  const profileContainer = document.getElementById('profile-container');
  const authTabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('form');

  // Render the appropriate view based on auth state stored in localStorage
  function renderView() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      showProfileView();
    } else {
      showAuthView();
    }
  }

  // Show authentication view (login/signup)
  function showAuthView() {
    // Show auth container
    profileContainer.classList.remove('active');

    // Update tabs
    authTabs.forEach(tab => {
      tab.style.display = 'block';
      tab.classList.remove('active');
    });

    // Show login form by default
    forms.forEach(form => {
      form.classList.remove('active');
      if (form.id === 'login-form') {
        form.classList.add('active');
      }
    });
  }

  // Show profile view
  function showProfileView() {
    // Hide auth forms
    forms.forEach(form => form.classList.remove('active'));
    authTabs.forEach(tab => tab.style.display = 'none');

    // Show profile container
    profileContainer.classList.add('active');

    // Update profile info from localStorage user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      document.getElementById('profile-name').textContent = user.name || 'Not provided';
      document.getElementById('profile-email').textContent = user.email || 'Not provided';
      document.getElementById('profile-phone').textContent = user.phone || 'Not provided';
      document.getElementById('profile-address').textContent =
        user.address ?
        `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''} ${user.address.zip || ''}`.trim() :
        'Not provided';
    }
  }

  // Initialize view on DOMContentLoaded
  renderView();
});
