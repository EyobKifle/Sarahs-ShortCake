const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_shortcakes');
        console.log('Connected to MongoDB');

        const admins = await Admin.find({});
        console.log('Found admins:', admins.length);

        for (const admin of admins) {
            console.log('Admin:', {
                id: admin._id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                role: admin.role,
                hasPassword: !!admin.password,
                active: admin.active
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdmin();
