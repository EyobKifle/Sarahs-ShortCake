const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventorycontroller');
const { protect } = require('../middleware/auth');

// All inventory routes require admin authentication
router.use(protect);

router.get('/', inventoryController.getAllInventoryItems);
router.post('/', inventoryController.createInventoryItem);
router.put('/:id', inventoryController.updateInventoryItem);
router.post('/:id/restock', inventoryController.recordInventoryRestock);
router.get('/reports/usage', inventoryController.generateInventoryUsageReport);

module.exports = router;
