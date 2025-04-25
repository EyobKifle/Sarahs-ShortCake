document.addEventListener('DOMContentLoaded', function() {
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

  // Cache form inputs for signup and login to reduce DOM queries
  const signupInputs = {
    firstName: document.getElementById('signup-firstName'),
    lastName: document.getElementById('signup-lastName'),
    email: document.getElementById('signup-email'),
    phone: document.getElementById('signup-phone'),
    password: passwordInput,
    confirmPassword: confirmPasswordInput,
    street: document.getElementById('signup-street'),
    city: document.getElementById('signup-city'),
    state: document.getElementById('signup-state'),
    zip: document.getElementById('signup-zip')
  };

  const loginInputs = {
    email: document.getElementById('login-email'),
    password: document.getElementById('login-password')
  };

  // Auth State Management
  const authState = {
    isAuthenticated: false,
    user: null
  };

  // Initialize the application
  init();

  // Initialize application state
  function init() {
    setupEventListeners();
  }

  // Setup event listeners with event delegation where feasible
  function setupEventListeners() {
    // Event delegation for toggle-password icons
    document.body.addEventListener('click', function(e) {
      if (e.target.classList.contains('toggle-password')) {
        const targetId = e.target.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        if (!passwordInput) return;
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        e.target.classList.toggle('fa-eye');
        e.target.classList.toggle('fa-eye-slash');
      }
    });

    // Password strength checker
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        checkPasswordStrength(passwordInput.value);
        validateSignupForm();
      });
    }
    
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', () => {
        checkPasswordMatch();
        validateSignupForm();
      });
    }

    // Form submissions
    if (loginForm) {
      loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignupSubmit);
    }
  }

  // Validate email format
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  // Validate signup form using cached inputs
  function validateSignupForm() {
    if (!signupForm) return false;
    
    const firstName = signupInputs.firstName?.value.trim() || '';
    const lastName = signupInputs.lastName?.value.trim() || '';
    const email = signupInputs.email?.value.trim() || '';
    const phone = signupInputs.phone?.value.trim() || '';
    const password = signupInputs.password?.value || '';
    const confirmPassword = signupInputs.confirmPassword?.value || '';
    
    // Check required fields including phone
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      signupButton.disabled = true;
      return false;
    }
    
    // Check email format
    if (!validateEmail(email)) {
      signupButton.disabled = true;
      return false;
    }
    
    // Check password strength
    const strength = checkPasswordStrength(password);
    if (strength < 3) { // At least 3/4 requirements met
      signupButton.disabled = true;
      return false;
    }
    
    // Check password match
    if (password !== confirmPassword) {
      signupButton.disabled = true;
      return false;
    }
    
    // Enable the signup button if all validations pass
    signupButton.disabled = false;
    return true;
  }

  // Refactored checkPasswordStrength to accept password parameter
  function checkPasswordStrength(password) {
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
    } else {
      // Clear strength classes if empty
      passwordStrength.classList.remove('weak', 'medium', 'strong');
    }
    
    return strength;
  }

  // Password match validation
  function checkPasswordMatch() {
    if (!passwordInput || !confirmPasswordInput || !passwordMatch) return true;
    
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

  // Handle login form submission using cached inputs
  async function handleLoginSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.auth-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const originalText = buttonText.textContent;

    // Disable button during processing
    submitButton.disabled = true;
    buttonText.textContent = 'Logging in...';

    try {
      const email = loginInputs.email?.value.trim() || '';
      const password = loginInputs.password?.value || '';

      // Validate inputs
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Call backend login API
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      // Handle network errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed with status ${response.status}`);
      }

      const data = await response.json();

      // Save token and user info
      localStorage.setItem('token', data.token);
      const userWithName = {
        ...data.user,
        name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim()
      };
      localStorage.setItem('user', JSON.stringify(userWithName));

      authState.user = userWithName;
      authState.isAuthenticated = true;

      // Redirect based on role
      if (data.user.role === 'admin') {
        window.location.href = '/Admin/admin.html';
      } else {
        window.location.href = '/customer-dashboard.html';
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('error', error.message || 'Login failed. Please try again.');
    } finally {
      // Re-enable button
      submitButton.disabled = false;
      buttonText.textContent = originalText;
    }
  }

  // Handle signup form submission using cached inputs
  async function handleSignupSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.auth-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const originalText = buttonText.textContent;

    // Prevent multiple submissions
    if (submitButton.disabled) return;

    // Disable button during processing
    submitButton.disabled = true;
    buttonText.textContent = 'Creating account...';

    try {
      // Validate form before submission
      if (!validateSignupForm()) {
        throw new Error('Please fill all fields correctly');
      }

      const formData = {
        firstName: signupInputs.firstName?.value.trim() || '',
        lastName: signupInputs.lastName?.value.trim() || '',
        email: signupInputs.email?.value.trim() || '',
        password: signupInputs.password?.value || '',
        phone: signupInputs.phone?.value.trim() || '',
        street: signupInputs.street?.value.trim() || '',
        city: signupInputs.city?.value.trim() || '',
        state: signupInputs.state?.value.trim() || '',
        zip: signupInputs.zip?.value.trim() || ''
      };

      // Call backend register API
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip
          }
        })
      });

      // Handle network errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed with status ${response.status}`);
      }

      const data = await response.json();

      // Save token and user info
      localStorage.setItem('token', data.token);
      const userWithName = {
        ...data.user,
        name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim()
      };
      localStorage.setItem('user', JSON.stringify(userWithName));

      authState.user = userWithName;
      authState.isAuthenticated = true;

      // Show success and redirect
      showAlert('success', 'Account created successfully!');
      setTimeout(() => {
        window.location.href = '/customer-dashboard.html';
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      showAlert('error', error.message || 'Registration failed. Please try again.');
    } finally {
      // Re-enable button
      submitButton.disabled = false;
      buttonText.textContent = originalText;
    }
  }

  // Show alert message
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
    
    // Auto-dismiss after 5 seconds (except for errors)
    if (type !== 'error') {
      setTimeout(() => {
        alertEl.style.opacity = '0';
        setTimeout(() => alertEl.remove(), 300);
      }, 5000);
    }
  }

  // Clear all alerts
  function clearAlerts() {
    alertContainer.innerHTML = '';
  }
});
