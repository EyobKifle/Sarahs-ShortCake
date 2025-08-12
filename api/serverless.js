const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('../middleware/errorHandler');
const connectDB = require('../utils/db');
const cookieParser = require('cookie-parser');
const authService = require('../services/authService');
require('dotenv').config();

// Import routes
const customerRoutes = require('../routes/customer');
const orderRoutes = require('../routes/order');
const inventoryRoutes = require('../routes/inventory');
const reportRoutes = require('../routes/reports');
const authRoutes = require('../routes/auth');
const adminRoutes = require('../routes/admin');
const flavorRoutes = require('../routes/flavor');
const settingsRoutes = require('../routes/settings');
const mapsRoutes = require('../routes/maps');
const contactRoutes = require('../routes/contact');
const productRoutes = require('../routes/product');
const uploadRoutes = require('../routes/upload');

const app = express();
const path = require('path');

// Connect to MongoDB
connectDB();

// Middleware
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Serve static files
app.use(express.static(path.join(__dirname, 'Public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/css', express.static(path.join(__dirname, 'Public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'Public', 'js')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to authenticate API requests
const { protect } = require('../middleware/auth');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/uploads', uploadRoutes);

// Guest order route (no authentication required)
const orderController = require('../controllers/orderController');
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
app.use('/api/products', productRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Catch-all route for SPA support
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Export serverless handler
module.exports = serverless(app, {
    binary: ['image/*', 'application/pdf', 'application/octet-stream']
});
