const express = require('express');
const router = express.Router();
const flavorController = require('../controllers/flavorcontroller');
const authController = require('../controllers/authcontroller');

// All flavor routes require admin authentication
router.use(authController.protect);

router.get('/', flavorController.getAllFlavors);
router.post('/', flavorController.createFlavor);
router.put('/:id', flavorController.updateFlavor);
router.delete('/:id', flavorController.deleteFlavor);

module.exports = router;