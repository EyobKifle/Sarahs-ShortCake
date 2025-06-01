const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

// All inventory routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

router.get('/', inventoryController.getAllInventoryItems);
router.post('/', inventoryController.createInventoryItem);
router.get('/reports/usage', inventoryController.generateInventoryUsageReport);
router.get('/menu-status', inventoryController.getMenuWithInventoryStatus);
router.get('/:id', inventoryController.getInventoryItemById);
router.put('/:id', inventoryController.updateInventoryItem);
router.delete('/:id', inventoryController.deleteInventoryItem);
router.post('/:id/restock', inventoryController.recordInventoryRestock);
router.get('/:id/history', inventoryController.getInventoryItemHistory);

module.exports = router;
