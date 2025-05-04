// Added dashboard stats API method
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Review = require('../models/Review');


// Create or update a customer
exports.createOrUpdateCustomer = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, role, isGuest, favorites } = req.body;
        
        // Check if customer already exists
        let customer = await Customer.findOne({ email });
        
        if (customer) {
            // Update existing customer
            customer.firstName = firstName;
            customer.lastName = lastName;
            customer.phone = phone;
            customer.address = address;
            if (role) customer.role = role;
            if (typeof isGuest === 'boolean') customer.isGuest = isGuest;
            if (favorites) customer.favorites = favorites;
        } else {
            // Create new customer
            customer = new Customer({
                firstName,
                lastName,
                email,
                phone,
                address,
                role: role || 'customer',
                isGuest: isGuest || false,
                favorites: favorites || []
            });
        }
        
        await customer.save();
        
        res.status(200).json({
            success: true,
            data: customer,
            message: 'Customer information saved successfully'
        });
    } catch (error) {
        console.error('Error saving customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving customer information'
        });
    }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ lastName: 1 });
        
        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers'
        });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        let customerId = req.params.id;
        // If the id is "me", replace it with the authenticated user's id
        if (customerId === 'me') {
            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: User not authenticated'
                });
            }
            customerId = req.user._id;
        }

        const customer = await Customer.findById(customerId);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer'
        });
    }
};

// Get dashboard stats for logged-in customer
exports.getDashboardStats = async (req, res) => {
    try {
        const customerId = req.user._id;

        // Total orders count
        const totalOrders = await Order.countDocuments({ customerId: customerId });

        // Total spent sum
        const orders = await Order.find({ customerId: customerId });
        const totalSpent = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);

        // Wishlist items count
        const customer = await Customer.findById(customerId);
        const wishlistItems = customer && customer.favorites ? customer.favorites.length : 0;

        // Reviews count
        const reviewsCount = await Review.countDocuments({ customer: customerId });

        res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                totalSpent,
                wishlistItems,
                reviews: reviewsCount
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats'
        });
    }
};

// Get addresses for logged-in customer
const UserAddress = require('../models/UserAddress');

exports.getAddresses = async (req, res) => {
    try {
        const userId = req.user._id;
        const addresses = await UserAddress.find({ userId });
        res.status(200).json({ success: true, data: addresses });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ success: false, message: 'Error fetching addresses' });
    }
};

// Add new address
exports.addAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { street, city, state, zip } = req.body;
        const newAddress = new UserAddress({ userId, street, city, state, zip });
        await newAddress.save();
        res.status(201).json({ success: true, data: newAddress, message: 'Address added successfully' });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ success: false, message: 'Error adding address' });
    }
};

// Edit address
exports.editAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const addressId = req.params.id;
        const { street, city, state, zip } = req.body;
        const address = await UserAddress.findOneAndUpdate(
            { _id: addressId, userId },
            { street, city, state, zip },
            { new: true }
        );
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, data: address, message: 'Address updated successfully' });
    } catch (error) {
        console.error('Error editing address:', error);
        res.status(500).json({ success: false, message: 'Error editing address' });
    }
};

// Delete address
exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const addressId = req.params.id;
        const address = await UserAddress.findOneAndDelete({ _id: addressId, userId });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Error deleting address' });
    }
};

// Get wishlist items for logged-in customer
exports.getWishlist = async (req, res) => {
    try {
        const customerId = req.user._id;
        const customer = await Customer.findById(customerId).populate('favorites');
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: customer.favorites || [] });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ success: false, message: 'Error fetching wishlist' });
    }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const customerId = req.user._id;
        const itemId = req.params.itemId;
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        customer.favorites = customer.favorites.filter(favId => favId.toString() !== itemId);
        await customer.save();
        res.status(200).json({ success: true, message: 'Item removed from wishlist' });
    } catch (error) {
        console.error('Error removing item from wishlist:', error);
        res.status(500).json({ success: false, message: 'Error removing item from wishlist' });
    }
};

// Get reviews for logged-in customer
exports.getReviews = async (req, res) => {
    try {
        const customerId = req.user._id;
        const reviews = await Review.find({ customer: customerId });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
};

// Update logged-in customer's profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { firstName, lastName, email, phone } = req.body;

        const customer = await Customer.findById(userId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Update fields
        if (firstName) customer.firstName = firstName;
        if (lastName) customer.lastName = lastName;
        if (email) customer.email = email;
        if (phone) customer.phone = phone;

        await customer.save();

        res.status(200).json({ success: true, data: customer, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
};
