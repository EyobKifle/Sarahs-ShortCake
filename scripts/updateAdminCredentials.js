const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('../models/Admin');
const connectDB = require('../utils/db');

const updateAdminCredentials = async () => {
  try {
    await connectDB();

    const emailToFind = 'admin@example.com';
    const newEmail = 'admin@example.com';
    const newPassword = 'password'; // plain password, no manual hashing

    // Find admin by email
    const admin = await Admin.findOne({ email: emailToFind });
    if (!admin) {
      console.log('No admin user found with the specified email.');
      process.exit(0);
    }

    // Update admin credentials with plain password (pre-save hook will hash it)
    admin.email = newEmail;
    admin.password = newPassword;

    await admin.save();
    console.log('Admin credentials updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    process.exit(1);
  }
};

updateAdminCredentials();
