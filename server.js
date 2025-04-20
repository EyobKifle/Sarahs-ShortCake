const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const { default: open } = require('open');
const connectDB = require('./utils/db');
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
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files with explicit paths
app.use(express.static(path.join(__dirname, 'Public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/css', express.static(path.join(__dirname, 'Public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'Public', 'js')));

// Route for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/contact', contactRoutes);

// Optional routes
app.use('/api/admin', adminRoutes);
app.use('/api/flavors', flavorRoutes);

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
