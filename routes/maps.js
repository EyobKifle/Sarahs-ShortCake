const express = require('express');
const router = express.Router();
const MapService = require('../utils/mapservice');

// Geocode an address
router.post('/geocode', async (req, res) => {
    try {
        const result = await MapService.geocodeAddress(req.body.address);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calculate distance between two points
router.post('/distance', async (req, res) => {
    try {
        const distance = MapService.calculateDistance(
            req.body.origin, 
            req.body.destination
        );
        res.json({ distance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get basic route information
router.post('/route', async (req, res) => {
    try {
        const routeInfo = await MapService.getRouteInfo(
            req.body.origin,
            req.body.destination
        );
        res.json(routeInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
