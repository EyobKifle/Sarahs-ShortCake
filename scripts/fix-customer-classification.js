const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

async function fixCustomerClassification() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_shortcakes');
        console.log('Connected to MongoDB');
        
        // 1. Fix all customers in Customer model to be registered (not guest)
        console.log('\n1. Fixing Customer model records...');
        const customers = await Customer.find({});
        console.log(`Found ${customers.length} customers in Customer model`);
        
        let fixedCustomers = 0;
        for (const customer of customers) {
            if (customer.isGuest === true && customer.password) {
                // This customer has a password but is marked as guest - fix it
                customer.isGuest = false;
                await customer.save();
                fixedCustomers++;
                console.log(`Fixed customer: ${customer.firstName} ${customer.lastName} (${customer.email})`);
            }
        }
        console.log(`Fixed ${fixedCustomers} customers`);
        
        // 2. Check for orders that might have wrong customerId assignments
        console.log('\n2. Checking order assignments...');
        const orders = await Order.find({}).lean();
        console.log(`Found ${orders.length} total orders`);
        
        const registeredOrders = orders.filter(o => o.customerId);
        const guestOrders = orders.filter(o => !o.customerId && o.guestInfo);
        
        console.log(`- ${registeredOrders.length} orders with customerId (registered)`);
        console.log(`- ${guestOrders.length} orders with guestInfo only (guest)`);
        
        // 3. Check for potential misclassifications
        console.log('\n3. Checking for potential misclassifications...');
        const customerEmails = new Set(customers.map(c => c.email.toLowerCase()));
        
        let misclassifiedOrders = 0;
        for (const order of guestOrders) {
            const guestEmail = order.guestInfo?.email?.toLowerCase();
            if (guestEmail && customerEmails.has(guestEmail)) {
                console.log(`⚠️  Found guest order for registered customer: ${guestEmail} (Order: ${order.orderNumber})`);
                misclassifiedOrders++;
            }
        }
        
        if (misclassifiedOrders > 0) {
            console.log(`\n⚠️  Found ${misclassifiedOrders} orders that should be linked to registered customers`);
            console.log('These orders were placed by registered customers but stored as guest orders');
        } else {
            console.log('\n✅ No misclassified orders found');
        }
        
        // 4. Display final statistics
        console.log('\n4. Final Statistics:');
        const registeredCustomers = customers.filter(c => !c.isGuest);
        const guestCustomersFromModel = customers.filter(c => c.isGuest);
        
        console.log(`- Registered customers: ${registeredCustomers.length}`);
        console.log(`- Guest customers in model: ${guestCustomersFromModel.length}`);
        console.log(`- True guest orders: ${guestOrders.length - misclassifiedOrders}`);
        
        // 5. Show some example customers
        console.log('\n5. Example registered customers:');
        registeredCustomers.slice(0, 5).forEach(customer => {
            console.log(`  - ${customer.firstName} ${customer.lastName} (${customer.email}) - Has password: ${!!customer.password}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixCustomerClassification();
