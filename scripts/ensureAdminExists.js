const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const ensureAdminExists = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      console.log('No admin users found. Creating default admin...');
      
      // Create default admin from environment variables
      const defaultAdmin = new Admin({
        name: process.env.DEFAULT_ADMIN_NAME || 'Admin',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'password',
        role: 'super-admin',
        permissions: [
          'manage_orders',
          'manage_customers',
          'manage_inventory',
          'manage_admins',
          'view_reports'
        ],
        active: true
      });

      await defaultAdmin.save();
      console.log('Default admin created successfully!');
      console.log('Email:', defaultAdmin.email);
      console.log('Password:', process.env.DEFAULT_ADMIN_PASSWORD || 'password');
      console.log('Role:', defaultAdmin.role);
    } else {
      console.log(`Found ${adminCount} admin user(s) in the database.`);
      
      // List existing admins
      const admins = await Admin.find({}, 'name email role active lastLogin');
      console.log('\nExisting admin users:');
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.role} - ${admin.active ? 'Active' : 'Inactive'}`);
        if (admin.lastLogin) {
          console.log(`   Last login: ${admin.lastLogin.toLocaleString()}`);
        }
      });
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
    process.exit(1);
  }
};

// Run the script
ensureAdminExists();
