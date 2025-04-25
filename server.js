const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const open = require('open').default;
const connectDB = require('./utils/db');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import routes
const customerRoutes = require('./routes/customer');
const orderRoutes = require('./routes/order');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const flavorRoutes = require('./routes/flavor');
const mapsRoutes = require('./routes/maps');
const contactRoutes = require('./routes/contact');

const app = express();
const path = require('path');

// Connect to MongoDB
connectDB();

// Middleware
const corsOptions = {
    origin: 'http://localhost:3000', // Adjust to your frontend origin
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Serve static files with explicit paths
app.use(express.static(path.join(__dirname, 'Public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/css', express.static(path.join(__dirname, 'Public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'Public', 'js')));

const enforceAccessControl = (req, res, next) => {
    const token = req.cookies.jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    const url = req.originalUrl.toLowerCase();

    // Always allow static files and auth pages
    const publicPaths = [
        '/', '/index.html', '/login.html', '/signup.html',
        '/contact.html', '/menu.html', '/track.html',
        '/customer-dashboard.html',
        '/css/', '/js/', '/images/', '/api/auth/'
    ];

    const isPublic = publicPaths.some(path => 
        url === path || url.startsWith(path)
    );

    if (isPublic) return next();

    // For protected routes, verify token
    if (!token) {
        return res.redirect('/index.html');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user to request for downstream middleware
        req.user = decoded;

        // Admin route protection
        if (url.includes('admin') && decoded.userType !== 'admin') {
            return res.redirect('/index.html');
        }

        // Customer route protection
        if (url.includes('customer') && decoded.userType !== 'customer') {
            return res.redirect('/index.html');
        }

        next();
    } catch (err) {
        // Invalid token - clear cookie and redirect
        res.clearCookie('jwt');
        return res.redirect('/index.html');
    }
};

// Apply access control middleware before static files and routes
app.use(enforceAccessControl);

// Update root route
app.get('/', (req, res) => {
    const token = req.cookies.jwt;
    if (!token) {
        return res.sendFile(path.join(__dirname, 'Public', 'index.html'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.redirect(
            decoded.userType === 'admin' 
                ? '/Admin/admin.html' 
                : '/customer-dashboard.html'
        );
    } catch (err) {
        res.clearCookie('jwt');
        res.sendFile(path.join(__dirname, 'Public', 'index.html'));
    }
});

// Middleware to authenticate API requests
const { protect } = require('./middleware/auth');

// Apply protect middleware to all API routes except auth
app.use('/api/auth', authRoutes);
app.use('/api/customers', protect, customerRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/inventory', protect, inventoryRoutes);
app.use('/api/reports', protect, reportRoutes);
app.use('/api/contact', protect, contactRoutes);
app.use('/api/admin', protect, adminRoutes);
app.use('/api/flavors', protect, flavorRoutes);

// Catch-all route for SPA support
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        await open(`http://localhost:${PORT}`, { app: { name: 'opera' } });
    } catch (err) {
        console.error('Failed to open browser:', err);
    }
});

module.exports = app;
