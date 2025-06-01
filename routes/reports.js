const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All report routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// New comprehensive report routes
router.get('/sales', reportController.getSalesReport);
router.get('/inventory', reportController.getInventoryReport);
router.get('/customers', reportController.getCustomerReport);
router.get('/export', reportController.exportReport);

// Export routes
router.get('/export/pdf', reportController.exportReportPDF);

// Legacy routes for backward compatibility
router.get('/sales-legacy', reportController.generateSalesReport);
router.get('/delivery', reportController.generateDeliveryReport);
router.get('/popular-items', reportController.generatePopularItemsReport);

module.exports = router;
