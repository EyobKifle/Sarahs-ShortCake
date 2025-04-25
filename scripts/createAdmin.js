const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('../models/Admin');
const connectDB = require('../utils/db');

const createAdmin = async () => {
  try {
    await connectDB();

    const email = 'admin@gmail.com';
    const password = 'admin';
    const name = 'New Admin';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin with this email already exists.');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const admin = new Admin({
      email,
      password: hashedPassword,
      name,
      role: 'admin'
    });

    await admin.save();
    console.log('New admin created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
