const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function fixAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_shortcakes');
        console.log('Connected to MongoDB');

        // Find the admin with email admin@example.com
        const admin = await Admin.findOne({ email: 'admin@example.com' });

        if (!admin) {
            console.log('Admin with email admin@example.com not found');
            process.exit(1);
        }

        console.log('Found admin:', {
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role
        });

        // Update the admin to have required fields
        admin.firstName = admin.firstName || 'Admin';
        admin.lastName = admin.lastName || 'User';
        admin.role = admin.role || 'admin';

        // Save without triggering password hash (since password is already hashed)
        await Admin.updateOne(
            { _id: admin._id },
            {
                $set: {
                    firstName: admin.firstName,
                    lastName: admin.lastName,
                    role: admin.role,
                    permissions: admin.permissions || [
                        'manage_orders',
                        'manage_customers',
                        'manage_inventory',
                        'manage_admins',
                        'view_reports'
                    ],
                    active: true
                }
            }
        );

        console.log('✅ Admin user updated successfully!');
        console.log('📧 Email: admin@example.com');
        console.log('🔑 Password: password');
        console.log('👤 Name: Admin User');
        console.log('🎯 Role: admin');

        // Verify the update
        const updatedAdmin = await Admin.findOne({ email: 'admin@example.com' });
        console.log('Updated admin:', {
            email: updatedAdmin.email,
            firstName: updatedAdmin.firstName,
            lastName: updatedAdmin.lastName,
            role: updatedAdmin.role,
            permissions: updatedAdmin.permissions,
            active: updatedAdmin.active
        });

        process.exit(0);
    } catch (error) {
        console.error('Error fixing admin:', error);
        process.exit(1);
    }
}

fixAdmin();
