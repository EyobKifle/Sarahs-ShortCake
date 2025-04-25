document.addEventListener('DOMContentLoaded', () => {
  // Fetch and display user profile in sidebar and header
  fetch('/api/customers/me', {
    method: 'GET',
    credentials: 'include', // to send cookies
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  })
  .then(data => {
    if (data.success && data.user) {
      const userNameElem = document.querySelector('.user-name');
      const userAvatarElem = document.querySelector('.user-avatar');
      const sidebarWelcome = document.querySelector('.sidebar-header p');
      if (userNameElem) userNameElem.textContent = `${data.user.firstName} ${data.user.lastName}`;
      if (userAvatarElem) userAvatarElem.textContent = data.user.firstName.charAt(0).toUpperCase();
      if (sidebarWelcome) sidebarWelcome.textContent = `Welcome back, ${data.user.firstName}!`;
    } else {
      console.warn('User not authorized or not logged in');
    }
  })
  .catch(() => {
    console.error('Failed to fetch user profile');
  });

  // Logout button handler
  const logoutLink = document.querySelector('.nav-link.logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include'
      })
      .then(res => {
        if (res.ok) {
          window.location.href = '/login.html';
        } else {
          alert('Logout failed');
        }
      })
      .catch(() => alert('Logout failed'));
    });
  }
});
