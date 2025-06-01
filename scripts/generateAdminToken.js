require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET;

async function generateAdminToken(adminId) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Find admin by ID
    const admin = await Admin.findById(adminId);
    if (!admin) {
      console.error('Admin not found');
      process.exit(1);
    }

    // Create token payload
    const payload = {
      id: admin._id,
      userType: 'admin',
    };

    // Sign token with 30 days expiration
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
    console.log('Generated Admin JWT Token (30 days expiration):\n', token);

    // Disconnect from DB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error generating token:', error);
  }
}

// Replace with a valid admin ID from your database
const adminId = '683070c5d28e307fad417acb';

generateAdminToken(adminId);
