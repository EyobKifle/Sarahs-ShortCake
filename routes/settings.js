const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
// const { admin } = require('../middleware/auth');

// Apply admin authentication to all routes
// router.use(admin);

// Get all settings
router.get('/', settingsController.getSettings);

// Update settings
router.put('/', settingsController.updateSettings);

// Test email configuration
router.post('/test-email', settingsController.testEmailConfig);

// Test SMS configuration
router.post('/test-sms', settingsController.testSmsConfig);

// Get system information
router.get('/system-info', settingsController.getSystemInfo);

// Backup database
router.post('/backup', settingsController.backupDatabase);

// Change admin password
router.post('/change-password', settingsController.changePassword);

// Get login history
router.get('/login-history', settingsController.getLoginHistory);

// Get backup history
router.get('/backup-history', settingsController.getBackupHistory);

// Upload branding file
router.post('/upload-branding', settingsController.uploadBrandingFile);

// Reset settings to defaults
router.post('/reset-defaults', settingsController.resetToDefaults);

module.exports = router;
