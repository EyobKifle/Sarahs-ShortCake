require('dotenv').config();
const connectDB = require('./db');
const bcrypt = require('bcryptjs');

// Import models
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Flavor = require('../models/flavor');
const InventoryItem = require('../models/InventoryItem');

// Seed the database
const seedDatabase = async () => {
    try {
        // Clear existing data
        await Admin.deleteMany({});
        await Customer.deleteMany({});
        await Flavor.deleteMany({});
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
        
        // Create sample customers
        const customerPassword = await bcrypt.hash('password123', 10);
        const customers = await Customer.create([
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: customerPassword,
                phone: '555-123-4567',
                streetAddress: '123 Main St',
                city: 'Caldwell'
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                password: customerPassword,
                phone: '555-987-6543',
                streetAddress: '456 Oak Ave',
                city: 'Caldwell'
            }
        ]);
        
        console.log('Sample customers created');
        
        // Create sample flavors
        const flavors = await Flavor.create([
            // Cupcake flavors
            { name: 'Vanilla', type: 'cupcake', canHaveColor: true },
            { name: 'Chocolate', type: 'cupcake', canHaveColor: false },
            { name: 'Red Velvet', type: 'cupcake', canHaveColor: false },
            { name: 'Strawberry', type: 'cupcake', canHaveColor: true },
            { name: 'Cookies and Cream', type: 'cupcake', canHaveColor: false },
            
            // Icing flavors
            { name: 'Vanilla', type: 'icing', canHaveColor: true },
            { name: 'Chocolate', type: 'icing', canHaveColor: false },
            { name: 'Cream Cheese', type: 'icing', canHaveColor: false },
            { name: 'Strawberry', type: 'icing', canHaveColor: true },
            { name: 'Butter Cream', type: 'icing', canHaveColor: true }
        ]);
        
        console.log('Sample flavors created');
        
        // Create sample inventory items
        const inventoryItems = await InventoryItem.create([
            {
                name: 'All-Purpose Flour',
                category: 'Flour & Dry Ingredients',
                currentStock: 50,
                unit: 'lbs',
                reorderLevel: 10
            },
            {
                name: 'Granulated Sugar',
                category: 'Flour & Dry Ingredients',
                currentStock: 40,
                unit: 'lbs',
                reorderLevel: 8
            },
            {
                name: 'Eggs',
                category: 'Dairy & Eggs',
                currentStock: 20,
                unit: 'dozen',
                reorderLevel: 5
            },
            {
                name: 'Vanilla Extract',
                category: 'Flavorings & Extracts',
                currentStock: 5,
                unit: 'oz',
                reorderLevel: 1
            },
            {
                name: 'Sprinkles',
                category: 'Decorations',
                currentStock: 10,
                unit: 'oz',
                reorderLevel: 2
            }
        ]);
        
        console.log('Sample inventory items created');
        
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seeding process
connectDB().then(() => {
    seedDatabase();
});
