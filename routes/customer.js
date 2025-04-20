const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/', customerController.createOrUpdateCustomer);

// Protected routes (require admin authentication)
router.use(protect);

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);

module.exports = router;
