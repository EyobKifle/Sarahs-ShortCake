const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token
const generateToken = (id, userType) => {
    return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Register new customer
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check if customer already exists
        const customerExists = await Customer.findOne({ email });
        if (customerExists) {
            return res.status(400).json({ message: 'Customer already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create customer
        const customer = await Customer.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address
        });

        // Generate token
        const token = generateToken(customer._id, 'customer');

        // Set cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(201).json({
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Login customer
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if customer exists
        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(customer._id, 'customer');

        // Set cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json({
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Login admin
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(admin._id, 'admin');

        // Set cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout user
exports.logout = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        let user;
        if (req.userType === 'customer') {
            user = await Customer.findById(req.user._id).select('-password');
        } else if (req.userType === 'admin') {
            user = await Admin.findById(req.user._id).select('-password');
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current admin profile
exports.getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching admin profile'
        });
    }
};

// Middleware to protect routes
exports.protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get admin from the token
        req.admin = await Admin.findById(decoded.id).select('-password');
        
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

// Admin management methods
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password');
        res.status(200).json({
            success: true,
            data: admins
        });
    } catch (error) {
        console.error('Error getting admins:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting admins'
        });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        const { username, password, name } = req.body;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const admin = new Admin({
            username,
            password: hashedPassword,
            name
        });
        
        await admin.save();
        
        res.status(201).json({
            success: true,
            data: {
                id: admin._id,
                username: admin.username,
                name: admin.name
            }
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating admin'
        });
    }
};

exports.getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).select('-password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        console.error('Error getting admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting admin'
        });
    }
};

exports.updateAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: admin
        });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(400).json({
            success: false,
            message: 'Error updating admin'
        });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting admin'
        });
    }
};
