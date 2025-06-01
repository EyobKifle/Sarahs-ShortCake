const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@sarahsshortcakes.com' });
        
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Name:', existingAdmin.firstName, existingAdmin.lastName);
            process.exit(0);
        }

        // Create new admin
        const adminData = {
            firstName: 'Sarah',
            lastName: 'Admin',
            email: 'admin@sarahsshortcakes.com',
            password: 'admin123456', // This will be hashed by the model
            phone: '+1234567890',
            address: '123 Bakery Street, Sweet City',
            role: 'super-admin',
            permissions: [
                'manage_orders',
                'manage_customers',
                'manage_inventory',
                'manage_admins',
                'view_reports'
            ],
            active: true
        };

        const admin = new Admin(adminData);
        await admin.save();

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@sarahsshortcakes.com');
        console.log('🔑 Password: admin123456');
        console.log('👤 Name:', admin.firstName, admin.lastName);
        console.log('🎯 Role:', admin.role);
        console.log('\n🚀 You can now login to the admin dashboard!');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        
        if (error.code === 11000) {
            console.log('Admin with this email already exists');
        }
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
createAdmin();
