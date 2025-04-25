const express = require('express');
const router = express.Router();

// Stub route for maps
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Maps route is not implemented yet.' });
});

module.exports = router;
