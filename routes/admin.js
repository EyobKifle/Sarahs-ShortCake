const express = require('express');
const router = express.Router();
const adminController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// All admin management routes require admin authentication
router.use(protect);

router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.get('/:id', adminController.getAdminById);
router.put('/:id', adminController.updateAdmin);
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
