#!/usr/bin/env node

const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const ContactMessage = require('../models/ContactMessage');
const InventoryItem = require('../models/InventoryItem');
require('dotenv').config();

const setupAdmin = async () => {
  try {
    console.log('🚀 Starting Admin Setup...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // 1. Ensure admin user exists
    console.log('\n📋 Checking admin users...');
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      console.log('⚠️  No admin users found. Creating default admin...');
      
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
      console.log('✅ Default admin created successfully!');
      console.log(`   📧 Email: ${defaultAdmin.email}`);
      console.log(`   🔑 Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'password'}`);
      console.log(`   👑 Role: ${defaultAdmin.role}`);
    } else {
      console.log(`✅ Found ${adminCount} admin user(s) in the database.`);
    }

    // 2. Check database collections
    console.log('\n📊 Checking database collections...');
    const customerCount = await Customer.countDocuments();
    const orderCount = await Order.countDocuments();
    const messageCount = await ContactMessage.countDocuments();
    
    console.log(`   👥 Customers: ${customerCount}`);
    console.log(`   📦 Orders: ${orderCount}`);
    console.log(`   💬 Contact Messages: ${messageCount}`);

    // 3. Create sample inventory items if none exist
    console.log('\n📦 Checking inventory...');
    const inventoryCount = await InventoryItem.countDocuments();
    
    if (inventoryCount === 0) {
      console.log('⚠️  No inventory items found. Creating sample inventory...');
      
      const sampleInventory = [
        {
          name: 'Flour',
          quantity: 50,
          unit: 'lbs',
          minQuantity: 10,
          location: 'Pantry A',
          category: 'Baking Ingredients'
        },
        {
          name: 'Sugar',
          quantity: 25,
          unit: 'lbs',
          minQuantity: 5,
          location: 'Pantry A',
          category: 'Baking Ingredients'
        },
        {
          name: 'Eggs',
          quantity: 120,
          unit: 'pieces',
          minQuantity: 24,
          location: 'Refrigerator',
          category: 'Dairy & Eggs'
        },
        {
          name: 'Butter',
          quantity: 10,
          unit: 'lbs',
          minQuantity: 2,
          location: 'Refrigerator',
          category: 'Dairy & Eggs'
        },
        {
          name: 'Vanilla Extract',
          quantity: 3,
          unit: 'bottles',
          minQuantity: 1,
          location: 'Pantry B',
          category: 'Flavorings'
        }
      ];

      await InventoryItem.insertMany(sampleInventory);
      console.log('✅ Sample inventory items created!');
    } else {
      console.log(`✅ Found ${inventoryCount} inventory items.`);
    }

    // 4. Display admin login information
    console.log('\n🎉 Admin Setup Complete!');
    console.log('\n📋 Admin Login Information:');
    const admins = await Admin.find({}, 'name email role active');
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name} (${admin.email}) - ${admin.role}`);
    });

    console.log('\n🌐 Access your admin dashboard at:');
    console.log(`   ${process.env.APP_URL || 'http://localhost:3000'}/admin.html`);
    
    console.log('\n💡 Tips:');
    console.log('   • Use the email containing "admin" to automatically use admin login endpoint');
    console.log('   • All admin routes are protected and require authentication');
    console.log('   • Check the browser console for detailed error messages');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during admin setup:', error);
    process.exit(1);
  }
};

// Run the setup
setupAdmin();
