const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportcontroller');
const authController = require('../controllers/authcontroller');

// All report routes require admin authentication
router.use(authController.protect);

router.get('/sales', reportController.generateSalesReport);
router.get('/delivery', reportController.generateDeliveryReport);
router.get('/popular-items', reportController.generatePopularItemsReport);

module.exports = router;