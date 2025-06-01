const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

async function convertEyobToRegistered() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/sarahs_shortcakes');
        console.log('✅ Connected to MongoDB');
        
        // Find all Eyob's guest orders
        const eyobOrders = await Order.find({
            'guestInfo.email': 'eyobkifle456@gmail.com'
        });
        
        console.log(`📦 Found ${eyobOrders.length} guest orders for Eyob`);
        
        if (eyobOrders.length === 0) {
            console.log('❌ No guest orders found for Eyob');
            return;
        }
        
        // Get Eyob's info from the first order
        const guestInfo = eyobOrders[0].guestInfo;
        const [firstName, lastName] = guestInfo.name.split(' ');
        
        console.log('👤 Creating registered customer for Eyob...');
        console.log(`   Name: ${firstName} ${lastName}`);
        console.log(`   Email: ${guestInfo.email}`);
        console.log(`   Phone: ${guestInfo.phone}`);
        
        // Create a Customer record for Eyob
        const hashedPassword = await bcrypt.hash('password123', 12); // Default password
        
        const eyobCustomer = new Customer({
            firstName: firstName,
            lastName: lastName,
            email: guestInfo.email,
            phone: guestInfo.phone,
            password: hashedPassword,
            isGuest: false, // This is a registered customer
            createdAt: eyobOrders[0].createdAt // Use the date of first order
        });
        
        await eyobCustomer.save();
        console.log('✅ Created Customer record for Eyob');
        console.log(`   Customer ID: ${eyobCustomer._id}`);
        
        // Update all of Eyob's orders to link to the new customer
        console.log('🔗 Linking existing orders to customer account...');
        
        const updateResult = await Order.updateMany(
            { 'guestInfo.email': 'eyobkifle456@gmail.com' },
            { 
                $set: { 
                    customerId: eyobCustomer._id,
                    customerInfo: {
                        firstName: firstName,
                        lastName: lastName,
                        email: guestInfo.email,
                        phone: guestInfo.phone
                    }
                },
                $unset: { guestInfo: 1 } // Remove guestInfo since it's now a registered customer order
            }
        );
        
        console.log(`✅ Updated ${updateResult.modifiedCount} orders`);
        
        // Verify the conversion
        console.log('\n🔍 Verification:');
        
        // Check if Eyob is now in Customer model
        const verifyCustomer = await Customer.findById(eyobCustomer._id);
        console.log(`   Customer exists: ${!!verifyCustomer}`);
        console.log(`   Is Guest: ${verifyCustomer.isGuest}`);
        
        // Check if orders are linked
        const linkedOrders = await Order.find({ customerId: eyobCustomer._id });
        console.log(`   Linked orders: ${linkedOrders.length}`);
        
        // Check if any guest orders remain
        const remainingGuestOrders = await Order.find({ 'guestInfo.email': 'eyobkifle456@gmail.com' });
        console.log(`   Remaining guest orders: ${remainingGuestOrders.length}`);
        
        console.log('\n🎉 SUCCESS: Eyob has been converted from guest to registered customer!');
        console.log('   Default password: password123');
        console.log('   Eyob can now login with: eyobkifle456@gmail.com / password123');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

convertEyobToRegistered();
