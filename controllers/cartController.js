const Cart = require('../models/Cart');

// Get cart by sessionId or userId
exports.getCart = async (req, res) => {
    try {
        const { sessionId, userId } = req.query;
        let cart;
        if (userId) {
            cart = await Cart.findOne({ userId });
        } else if (sessionId) {
            cart = await Cart.findOne({ sessionId });
        } else {
            return res.status(400).json({
                success: false,
                message: 'sessionId or userId is required'
            });
        }
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart'
        });
    }
};

// Create or update cart
exports.createOrUpdateCart = async (req, res) => {
    try {
        const { sessionId, userId, items, expiresAt } = req.body;
        if (!sessionId && !userId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId or userId is required'
            });
        }
        let cart = await Cart.findOne({ $or: [{ sessionId }, { userId }] });
        if (cart) {
            cart.items = items;
            if (expiresAt) cart.expiresAt = expiresAt;
        } else {
            cart = new Cart({ sessionId, userId, items, expiresAt });
        }
        await cart.save();
        res.status(200).json({
            success: true,
            data: cart,
            message: 'Cart saved successfully'
        });
    } catch (error) {
        console.error('Error saving cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving cart'
        });
    }
};

// Delete cart by ID
exports.deleteCart = async (req, res) => {
    try {
        const cart = await Cart.findByIdAndDelete(req.params.id);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Cart deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting cart'
        });
    }
};
