const authService = require('../services/authService');

// Middleware to protect routes using centralized auth service
const protect = authService.protect();

// Middleware to check if user is admin (using centralized service)
const admin = authService.authorize('admin');

// Middleware to authorize based on roles (using centralized service)
const authorize = authService.authorize;

module.exports = { protect, admin, authorize };
