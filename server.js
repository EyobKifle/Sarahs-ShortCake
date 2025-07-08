const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const open = require('open').default;
const connectDB = require('./utils/db');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const authService = require('./services/authService');
require('dotenv').config();

// Import routes
const customerRoutes = require('./routes/customer');
const orderRoutes = require('./routes/order');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const flavorRoutes = require('./routes/flavor');
const settingsRoutes = require('./routes/settings');
// const testRoutes = require('./routes/test');
const mapsRoutes = require('./routes/maps');
const contactRoutes = require('./routes/contact');
const productRoutes = require('./routes/product');
const uploadRoutes = require('./routes/upload');

const app = express();
const path = require('path');

// Connect to MongoDB
connectDB();

// Middleware
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://'], // Support multiple origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const enforceAccessControl = (req, res, next) => {
    const url = req.originalUrl.toLowerCase();

    // Debug logging for guest orders
    if (url.includes('/api/orders/guest')) {
        console.log('🔍 Access Control Debug - Guest order request:', {
            originalUrl: req.originalUrl,
            url: url,
            method: req.method
        });
    }

    // Always allow static files and auth pages
    const publicPaths = [
        '/', '/index.html', '/login.html', '/signup.html',
        '/contact.html', '/menu.html', '/cart.html', '/order.html',
        '/forgot-password.html', '/verify-otp.html', '/reset-password-otp.html',
        '/guest-confirmation.html', '/order-confirmation.html',
        '/css/', '/js/', '/images/', '/uploads/', '/api/auth/', '/api/contact', '/api/products', '/api/uploads', '/api/orders/guest'
    ];

    const isPublic = publicPaths.some(path =>
        url === path || url.startsWith(path)
    );

    // Debug logging for guest orders
    if (url.includes('/api/orders/guest')) {
        console.log('🔍 Access Control Debug - Public path check:', {
            url: url,
            isPublic: isPublic,
            publicPaths: publicPaths.filter(p => url.startsWith(p))
        });
    }

    if (isPublic) return next();

    // For protected routes, verify token using centralized service
    const token = authService.extractToken(req);

    if (!token) {
        console.log('🔐 No token found, redirecting to login');
        return res.redirect('/login.html');
    }

    try {
        const decoded = authService.verifyToken(token);
        console.log('🔐 Access Control - Decoded token:', { userType: decoded.userType, id: decoded.id, url });

        // Attach user to request for downstream middleware
        req.user = decoded;

        // Admin route protection
        if (url.includes('admin') && decoded.userType !== 'admin') {
            console.log('❌ Access denied: Admin route requires admin role, user has:', decoded.userType);
            return res.redirect('/login.html');
        }

        // Customer route protection - allow both 'customer' and undefined/null (default to customer)
        if (url.includes('customer') && decoded.userType !== 'customer' && decoded.userType !== null && decoded.userType !== undefined) {
            console.log('❌ Access denied: Customer route requires customer role, user has:', decoded.userType);
            return res.redirect('/login.html');
        }

        console.log('✅ Access granted for:', decoded.userType, 'to:', url);
        next();
    } catch (err) {
        console.log('❌ JWT verification failed:', err.message);
        // Invalid token - clear cookie and redirect
        authService.clearAuthCookie(res);
        return res.redirect('/login.html');
    }
};

// Apply access control middleware before static files and routes
app.use(enforceAccessControl);

// Update root route
app.get('/', (req, res) => {
    const token = authService.extractToken(req);
    if (!token) {
        return res.sendFile(path.join(__dirname, 'Public', 'index.html'));
    }

    try {
        const decoded = authService.verifyToken(token);
        console.log('🏠 Root route - Decoded token:', { userType: decoded.userType, id: decoded.id });

        if (decoded.userType === 'admin') {
            console.log('🔄 Redirecting admin to admin.html');
            res.redirect('/admin.html');
        } else {
            console.log('🔄 Redirecting customer to customer-dashboard.html');
            res.redirect('/customer-dashboard.html');
        }
    } catch (err) {
        console.log('❌ Root route JWT verification failed:', err.message);
        authService.clearAuthCookie(res);
        res.sendFile(path.join(__dirname, 'Public', 'index.html'));
    }
});

// Middleware to authenticate API requests
const { protect } = require('./middleware/auth');

// Apply protect middleware to all API routes except auth and public contact submission
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes); // Contact routes handle their own auth
app.use('/api/uploads', uploadRoutes); // Upload routes handle their own auth

// Guest order route (no authentication required) - must come before protected order routes
const orderController = require('./controllers/orderController');
app.post('/api/orders/guest', orderController.createGuestOrder);

// Public order tracking routes (no authentication required)
app.get('/api/orders/public/:id', orderController.getPublicOrderById);
app.get('/api/orders/public/orderNumber/:orderNumber', orderController.getPublicOrderByOrderNumber);

app.use('/api/customers', protect, customerRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/inventory', protect, inventoryRoutes);
app.use('/api/reports', protect, reportRoutes);
app.use('/api/admin', protect, adminRoutes);
app.use('/api/flavors', protect, flavorRoutes);
app.use('/api/settings', protect, settingsRoutes);
// app.use('/test', testRoutes);
app.use('/api/products', productRoutes);

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
