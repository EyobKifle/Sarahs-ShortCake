const Customer = require('../models/Customer');

// Create or update a customer
exports.createOrUpdateCustomer = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, streetAddress, city } = req.body;
        
        // Check if customer already exists
        let customer = await Customer.findOne({ email });
        
        if (customer) {
            // Update existing customer
            customer.firstName = firstName;
            customer.lastName = lastName;
            customer.phone = phone;
            customer.streetAddress = streetAddress;
            customer.city = city;
        } else {
            // Create new customer
            customer = new Customer({
                firstName,
                lastName,
                email,
                phone,
                streetAddress,
                city
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

// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        
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