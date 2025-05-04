const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');

// Middleware to protect routes
const protect = async (req, res, next) => {
    let token;
    
    // Check for token in cookies
    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    
    // Check for token in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        console.log('Protect middleware: No token found');
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Protect middleware: Token decoded', decoded);
        
        // Check if user exists and is not deleted
        let user;
        if (decoded.userType === 'customer') {
            user = await Customer.findById(decoded.id).select('-password');
        } else if (decoded.userType === 'admin') {
            user = await Admin.findById(decoded.id).select('-password');
        }
        
        if (!user) {
            console.log('Protect middleware: User no longer exists');
            return res.status(401).json({ message: 'User no longer exists' });
        }
        
        // Add user to request object
        req.user = user;
        req.userType = decoded.userType;
        console.log('Protect middleware: User set on req.user', req.user._id);
        next();
    } catch (error) {
        console.log('Protect middleware: Error verifying token', error);
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
    if (req.userType !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to access this route' });
    }
    next();
};

// Middleware to authorize based on roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.userType || !roles.includes(req.userType)) {
            return res.status(403).json({ message: 'Not authorized to access this route' });
        }
        next();
    };
};

module.exports = { protect, admin, authorize }; 
