document.addEventListener('DOMContentLoaded', () => {
  // Map sidebar link IDs to their target URLs
  const navLinks = {
    'nav-orders': 'customer-orders.html',
    'nav-addresses': 'customer-addresses.html',
    'nav-wishlist': 'customer-wishlist.html',
    'nav-reviews': 'customer-reviews.html',
    'nav-settings': 'customer-settings.html'
  };

  Object.entries(navLinks).forEach(([id, url]) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.cursor = 'pointer';
      element.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = url;
      });
    }
  });

  // Fetch and sync user profile on dashboard load
  fetchProfile();

  async function fetchProfile() {
    try {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }
});
