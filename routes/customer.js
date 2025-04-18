const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customercontroller');
const authController = require('../controllers/authcontroller');

// Public routes (no authentication required)
router.post('/', customerController.createOrUpdateCustomer);

// Protected routes (require admin authentication)
router.use(authController.protect);

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);

module.exports = router;