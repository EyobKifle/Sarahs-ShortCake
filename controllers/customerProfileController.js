// Controller for customer profile update and settings backend implementation

const Customer = require('../models/Customer');

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
