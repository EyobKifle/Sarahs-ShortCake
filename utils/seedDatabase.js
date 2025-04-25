require('dotenv').config();
const connectDB = require('./db');
const bcrypt = require('bcryptjs');

// Import models
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const InventoryItem = require('../models/InventoryItem');

const seedDatabase = async () => {
    try {
        // Clear existing data
        await Admin.deleteMany({});
        await Customer.deleteMany({});
        await InventoryItem.deleteMany({});

        console.log('Database cleared');

        // Create default admin
        const adminPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
        const admin = await Admin.create({
            username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
            password: adminPassword,
            name: process.env.DEFAULT_ADMIN_NAME || 'Sarah',
            email: process.env.DEFAULT_ADMIN_EMAIL || 'sarah@example.com',
            role: 'admin'
        });

        console.log('Default admin created');

        // Create sample inventory items
        const inventoryItems = await InventoryItem.create([
            {
                name: 'All-Purpose Flour',
                category: 'Flour & Dry Ingredients',
                quantity: 50,
                unit: 'lbs',
                threshold: 10
            },
            {
                name: 'Granulated Sugar',
                category: 'Flour & Dry Ingredients',
                quantity: 40,
                unit: 'lbs',
                threshold: 8
            },
            {
                name: 'Eggs',
                category: 'Dairy & Eggs',
                quantity: 20,
                unit: 'dozen',
                threshold: 5
            },
            {
                name: 'Vanilla Extract',
                category: 'Flavorings & Extracts',
                quantity: 5,
                unit: 'oz',
                threshold: 1
            },
            {
                name: 'Sprinkles',
                category: 'Decorations',
                quantity: 10,
                unit: 'oz',
                threshold: 2
            }
        ]);

        console.log('Sample inventory items created');

        console.log('Partial database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

connectDB().then(() => {
    seedDatabase();
});
