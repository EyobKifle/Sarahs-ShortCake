document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already authenticated
  checkExistingAuth();

  // DOM Elements
  const authTabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('form');
  const alertContainer = document.getElementById('alert-container');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const passwordStrength = document.getElementById('password-strength');
  const passwordMatch = document.getElementById('password-match');
  const signupButton = document.getElementById('signup-button');
  const passwordHints = {
    length: document.getElementById('length-hint'),
    uppercase: document.getElementById('uppercase-hint'),
    number: document.getElementById('number-hint'),
    special: document.getElementById('special-hint')
  };

  // Auth State
  let currentTab = 'login';

  // Initialize
  setupEventListeners();
  renderView();

  // Check if user is already authenticated and redirect using unified auth client
  async function checkExistingAuth() {
    try {
      if (authClient.isAuthenticated) {
        console.log('User already authenticated, checking validity...');

        const isValid = await authClient.checkAuth();
        if (isValid) {
          console.log('Valid authentication found, redirecting...');

          if (authClient.isAdmin()) {
            window.location.href = '/admin.html';
          } else {
            window.location.href = '/customer-dashboard.html';
          }
        } else {
          console.log('Invalid authentication, clearing...');
          authClient.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
      authClient.clearAuth();
    }
  }

  function setupEventListeners() {
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(toggle => {
      toggle.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
      });
    });

    // Password strength checker
    passwordInput.addEventListener('input', checkPasswordStrength);

    // Password match checker
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    // Tab switching
    authTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        currentTab = this.dataset.tab;
        renderView();
      });
    });

    // Form footer links
    document.querySelectorAll('[data-tab]').forEach(link => {
      if (link.tagName === 'A') {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          currentTab = this.dataset.tab;
          renderView();
        });
      }
    });

    // Form submissions
    loginForm.addEventListener('submit', handleLoginSubmit);
    signupForm.addEventListener('submit', handleSignupSubmit);
  }

  function renderView() {
    // Update active tab
    authTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === currentTab);
    });

    // Show correct form
    forms.forEach(form => {
      form.classList.toggle('active', form.id === `${currentTab}-form`);
    });

    // Reset forms when switching
    if (currentTab === 'login') {
      signupForm.reset();
      passwordMatch.style.display = 'none';
    } else {
      loginForm.reset();
    }

    clearAlerts();
  }

  function checkPasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;

    // Check password length
    if (password.length >= 8) {
      strength += 1;
      passwordHints.length.classList.add('valid');
    } else {
      passwordHints.length.classList.remove('valid');
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
      strength += 1;
      passwordHints.uppercase.classList.add('valid');
    } else {
      passwordHints.uppercase.classList.remove('valid');
    }

    // Check for numbers
    if (/\d/.test(password)) {
      strength += 1;
      passwordHints.number.classList.add('valid');
    } else {
      passwordHints.number.classList.remove('valid');
    }

    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1;
      passwordHints.special.classList.add('valid');
    } else {
      passwordHints.special.classList.remove('valid');
    }

    // Update strength meter
    passwordStrength.className = 'password-strength';
    if (password.length > 0) {
      if (strength <= 1) {
        passwordStrength.classList.add('weak');
      } else if (strength <= 3) {
        passwordStrength.classList.add('medium');
      } else {
        passwordStrength.classList.add('strong');
      }
    }

    validateSignupForm();
  }

  function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password && confirmPassword && password !== confirmPassword) {
      passwordMatch.style.display = 'block';
      return false;
    } else {
      passwordMatch.style.display = 'none';
      return true;
    }
  }

  function validateSignupForm() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = passwordInput.value;
    const isStrong = passwordStrength.classList.contains('medium') ||
                    passwordStrength.classList.contains('strong');
    const passwordsMatch = checkPasswordMatch();

    signupButton.disabled = !(name && email && isStrong && passwordsMatch);
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.auth-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const originalText = buttonText.textContent;

    submitButton.disabled = true;
    buttonText.textContent = 'Logging in...';

    try {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      console.log('🔐 Attempting login with unified auth client');

      // Determine user type based on email or use auto-detection
      let userType = 'auto';
      if (email.toLowerCase().includes('admin')) {
        userType = 'admin';
      }

      // Use unified auth client for login
      const result = await authClient.login(email, password, userType);

      if (result.success) {
        console.log('✅ Login successful, redirecting to:', result.redirectUrl);
        showAlert('success', 'Login successful! Redirecting...');

        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 1000);
      } else {
        throw new Error(result.message || 'Login failed');
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      showAlert('error', error.message || 'Login failed. Please try again.');
    } finally {
      submitButton.disabled = false;
      buttonText.textContent = originalText;
    }
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.auth-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const originalText = buttonText.textContent;

    if (submitButton.disabled) return;

    submitButton.disabled = true;
    buttonText.textContent = 'Creating account...';

    try {
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (!name || !email || !phone || !password || !confirmPassword) {
        throw new Error('Please fill all required fields');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      console.log('📝 Attempting registration with unified auth client');

      // Split name into first and last name
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const userData = {
        firstName,
        lastName,
        email,
        phone,
        password
      };

      // Use unified auth client for registration
      const result = await authClient.register(userData);

      if (result.success) {
        console.log('✅ Registration successful, redirecting to:', result.redirectUrl);
        showAlert('success', 'Account created successfully! Redirecting...');

        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 1500);
      } else {
        throw new Error(result.message || 'Registration failed');
      }

    } catch (error) {
      console.error('❌ Registration error:', error);
      showAlert('error', error.message || 'Registration failed. Please try again.');
    } finally {
      submitButton.disabled = false;
      buttonText.textContent = originalText;
    }
  }

  function showAlert(type, message) {
    clearAlerts();

    const alertEl = document.createElement('div');
    alertEl.className = `alert ${type}`;

    const icon = type === 'error' ? 'exclamation-circle' : 'check-circle';
    alertEl.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span>${message}</span>
    `;

    alertContainer.appendChild(alertEl);

    if (type !== 'error') {
      setTimeout(() => {
        alertEl.style.opacity = '0';
        setTimeout(() => alertEl.remove(), 300);
      }, 5000);
    }
  }

  function clearAlerts() {
    alertContainer.innerHTML = '';
  }
});
