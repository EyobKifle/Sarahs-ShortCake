const Flavor = require('../models/flavor');

exports.getAllFlavors = async (req, res) => {
    try {
        const flavors = await Flavor.find();
        res.status(200).json({
            success: true,
            data: flavors
        });
    } catch (error) {
        console.error('Error getting flavors:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting flavors'
        });
    }
};

exports.createFlavor = async (req, res) => {
    try {
        const flavor = new Flavor(req.body);
        await flavor.save();
        res.status(201).json({
            success: true,
            data: flavor
        });
    } catch (error) {
        console.error('Error creating flavor:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating flavor'
        });
    }
};

exports.updateFlavor = async (req, res) => {
    try {
        const flavor = await Flavor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!flavor) {
            return res.status(404).json({
                success: false,
                message: 'Flavor not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: flavor
        });
    } catch (error) {
        console.error('Error updating flavor:', error);
        res.status(400).json({
            success: false,
            message: 'Error updating flavor'
        });
    }
};

exports.deleteFlavor = async (req, res) => {
    try {
        const flavor = await Flavor.findByIdAndDelete(req.params.id);
        
        if (!flavor) {
            return res.status(404).json({
                success: false,
                message: 'Flavor not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting flavor:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting flavor'
        });
    }
};
