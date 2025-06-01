const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sarahs-shortcakes';

async function checkAdmins() {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const admins = await Admin.find({});
    if (admins.length === 0) {
      console.log('No admin users found in the database.');
    } else {
      console.log('Admin users:');
      admins.forEach(admin => {
        console.log(`- ID: ${admin._id}`);
        console.log(`  Name: ${admin.name}`);
        console.log(`  Email: ${admin.email}`);
        console.log(`  Role: ${admin.role}`);
        console.log(`  Active: ${admin.active}`);
        console.log(`  Last Login: ${admin.lastLogin}`);
        console.log('---------------------------');
      });
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking admin users:', error);
  }
}

checkAdmins();
