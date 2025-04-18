const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventorycontroller');
const authController = require('../controllers/authcontroller');

// All inventory routes require admin authentication
router.use(authController.protect);

router.get('/', inventoryController.getAllInventoryItems);
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.post('/:id/restock', inventoryController.recordInventoryRestock);
router.get('/reports/usage', inventoryController.generateInventoryUsageReport);

module.exports = router;