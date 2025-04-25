const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', cartController.getCart);
router.post('/', cartController.createOrUpdateCart);

// Protected routes (require admin authentication)
router.use(protect);

router.delete('/:id', cartController.deleteCart);

module.exports = router;
