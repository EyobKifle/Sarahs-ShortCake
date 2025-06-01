const mongoose = require('mongoose');
const Order = require('../models/Order');

// Migration script to update existing orders with customerType field
async function migrateCustomerTypes() {
    try {
        console.log('Starting customer type migration...');

        // Load environment variables
        require('dotenv').config();

        // Connect to MongoDB using the same connection as the main app
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_shortcakes');
        console.log('Connected to MongoDB');

        // Check total orders first
        const totalOrders = await Order.countDocuments();
        console.log(`Total orders in database: ${totalOrders}`);

        // Find all orders without customerType or with null customerType
        const ordersToUpdate = await Order.find({
            $or: [
                { customerType: { $exists: false } },
                { customerType: null },
                { customerType: '' }
            ]
        });

        console.log(`Found ${ordersToUpdate.length} orders to update`);

        // If no orders need updating, check if we should update all orders anyway
        if (ordersToUpdate.length === 0 && totalOrders > 0) {
            console.log('No orders found without customerType. Checking all orders...');
            const allOrders = await Order.find({}).limit(5);
            console.log('Sample orders:', allOrders.map(o => ({
                _id: o._id,
                customerId: o.customerId ? 'exists' : 'null',
                customerType: o.customerType,
                paymentMethod: o.payment?.method
            })));
        }

        let updatedCount = 0;
        let registeredCount = 0;
        let guestCount = 0;

        for (const order of ordersToUpdate) {
            let customerType;
            let paymentMethod = order.payment?.method;

            // Determine customer type based on customerId
            if (order.customerId) {
                customerType = 'registered';
                registeredCount++;

                // Set default payment method for registered customers if not set
                if (!paymentMethod) {
                    paymentMethod = 'integrated';
                }
            } else {
                customerType = 'guest';
                guestCount++;

                // Set default payment method for guest customers if not set
                if (!paymentMethod) {
                    paymentMethod = 'proof_upload';
                }
            }

            // Update the order
            await Order.findByIdAndUpdate(order._id, {
                customerType: customerType,
                'payment.method': paymentMethod
            });

            updatedCount++;

            if (updatedCount % 10 === 0) {
                console.log(`Updated ${updatedCount}/${ordersToUpdate.length} orders...`);
            }
        }

        console.log('\nMigration completed successfully!');
        console.log(`Total orders updated: ${updatedCount}`);
        console.log(`Registered customers: ${registeredCount}`);
        console.log(`Guest customers: ${guestCount}`);

        // Verify the migration
        const verifyRegistered = await Order.countDocuments({ customerType: 'registered' });
        const verifyGuest = await Order.countDocuments({ customerType: 'guest' });
        const finalTotalOrders = await Order.countDocuments();

        console.log('\nVerification:');
        console.log(`Total orders in database: ${finalTotalOrders}`);
        console.log(`Orders with customerType 'registered': ${verifyRegistered}`);
        console.log(`Orders with customerType 'guest': ${verifyGuest}`);
        console.log(`Orders with customerType set: ${verifyRegistered + verifyGuest}`);

        if (verifyRegistered + verifyGuest === finalTotalOrders) {
            console.log('✅ Migration verification successful - all orders have customerType set');
        } else {
            console.log('⚠️ Migration verification failed - some orders may not have customerType set');
        }

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the migration
if (require.main === module) {
    migrateCustomerTypes();
}

module.exports = migrateCustomerTypes;
