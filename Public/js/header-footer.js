// Common JS for header and footer functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart count
    updateCartCount();

    // Update profile icon based on login state
    updateProfileIcon();

    // Auth dropdown toggle
    const authToggle = document.getElementById('auth-toggle');
    const authDropdown = document.getElementById('auth-dropdown-content');

    if (authToggle && authDropdown) {
        authToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            authDropdown.style.display = authDropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            authDropdown.style.display = 'none';
        });

        // Prevent dropdown from closing when clicking inside
        authDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Handle login/signup links
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');

    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Show login modal or redirect to login page
            // Here redirecting to login.html as per existing pattern
            window.location.href = 'login.html';
        });
    }

    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Show signup modal or redirect to signup page
            window.location.href = 'signup.html';
        });
    }
});

// Update cart count
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count, .cart-count');
    if (cartCountElements) {
        const count = CartManager.getItemCount();
        cartCountElements.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        });
    }
}

function updateProfileIcon() {
    const profileIcon = document.querySelector('.profile-icon');
    if (!profileIcon) return;

    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/auth/me', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(res => res.json())
        .then(user => {
            if (user && user.name) {
                // Build menu links based on role
                let menuLinks = `
                    <span class="profile-name">Hello, ${user.name}</span>
                    <button id="logout-btn" class="logout-button">Logout</button>
                `;

                // Add dashboard link based on role
                if (user.role === 'admin') {
                    menuLinks += `<a href="Admin/admin.html" class="dashboard-link">Admin Dashboard</a>`;
                } else {
                    menuLinks += `<a href="customer-dashboard.html" class="dashboard-link">Customer Dashboard</a>`;
                }

                profileIcon.innerHTML = menuLinks;

                document.getElementById('logout-btn').addEventListener('click', logout);
            } else {
                showLoginLink();
            }
        })
        .catch(() => {
            showLoginLink();
        });
    } else {
        showLoginLink();
    }
}

function showLoginLink() {
    const profileIcon = document.querySelector('.profile-icon');
    if (profileIcon) {
        profileIcon.innerHTML = `
            <a href="login.html" class="active" id="login-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
            </a>
            <a href="signup.html" id="signup-link" style="margin-left: 10px;">Sign Up</a>
        `;
    }
}

function logout() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/auth/logout', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(res => {
        if (res.ok) {
            localStorage.removeItem('token');
            updateProfileIcon();
            window.location.href = 'login.html';
        } else {
            alert('Logout failed');
        }
    })
    .catch(() => {
        alert('Logout failed');
    });
}
