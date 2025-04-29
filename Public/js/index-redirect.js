document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'admin') {
        window.location.href = 'Admin/admin.html';
      } else {
        window.location.href = 'customer-dashboard.html';
      }
    } catch (e) {
      // Parsing error, do nothing and show public page
      console.error('Error parsing user data:', e);
    }
  }
});
