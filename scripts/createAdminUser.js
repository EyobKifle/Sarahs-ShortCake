const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sarahs-shortcakes';

async function createAdminUser() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpassword',
      role: 'admin',
      permissions: [
        'manage_orders',
        'manage_customers',
        'manage_inventory',
        'manage_admins',
        'view_reports'
      ],
      active: true
    };

    const existingAdmin = await Admin.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin with this email already exists.');
      await mongoose.disconnect();
      return;
    }

    const newAdmin = new Admin(adminData);
    await newAdmin.save();
    console.log('New admin user created successfully.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
