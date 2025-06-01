const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
// const { admin } = require('../middleware/auth');

// Apply admin authentication to all test routes
// router.use(admin);

// Initialize test data
router.post('/init', testController.initializeTestData);

// Create test contact messages
router.post('/contact-messages', testController.createTestContactMessages);

// Test email configuration
router.post('/email', testController.testEmailConfig);

// Test SMS configuration
router.post('/sms', testController.testSmsConfig);

// Test order confirmation for registered customer
router.post('/order-confirmation-registered', testController.testOrderConfirmationRegistered);
router.post('/order-confirmation/registered', testController.testOrderConfirmationRegistered);

// Test order confirmation for guest customer
router.post('/order-confirmation-guest', testController.testOrderConfirmationGuest);
router.post('/order-confirmation/guest', testController.testOrderConfirmationGuest);

// Test order status update
router.post('/order-status-update', testController.testOrderStatusUpdate);

// Test new order alert to admin
router.post('/new-order-alert', testController.testNewOrderAlert);

// Test low stock alert
router.post('/low-stock-alert', testController.testLowStockAlert);

// Test password reset
router.post('/password-reset', testController.testPasswordReset);

// Test contact message reply
router.post('/contact-reply', testController.testContactMessageReply);

// Test welcome message
router.post('/welcome-message', testController.testWelcomeMessage);

// Run comprehensive test suite
router.post('/comprehensive', testController.runFullTestSuite);
router.post('/full-suite', testController.runFullTestSuite);

// Get test data status
router.get('/status', testController.getTestStatus);

module.exports = router;
