const fetch = require('node-fetch');

async function testCustomerFix() {
    try {
        console.log('🔍 Testing Customer Classification Fix...\n');
        
        // First login to get fresh token
        const loginResponse = await fetch('http://localhost:3000/api/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password'
            })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Admin login successful');
        
        // Test customer API with fresh token and cache busting
        const response = await fetch(`http://localhost:3000/api/customers?_t=${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('📊 Customer Summary:', data.summary);
            console.log(`   Total customers: ${data.data.length}`);
            console.log(`   Registered: ${data.summary.registeredCustomers}`);
            console.log(`   Guests: ${data.summary.guestCustomers}\n`);
            
            // Look for Eyob specifically
            const eyob = data.data.find(c => 
                c.firstName?.toLowerCase().includes('eyob') || 
                c.lastName?.toLowerCase().includes('kifle') ||
                c.email?.toLowerCase().includes('eyob')
            );
            
            if (eyob) {
                console.log('🎯 Found Eyob Kifle:');
                console.log(`   Name: ${eyob.firstName} ${eyob.lastName}`);
                console.log(`   Email: ${eyob.email}`);
                console.log(`   Type: ${eyob.isGuest ? '❌ Guest (WRONG!)' : '✅ Registered (CORRECT!)'}`);
                console.log(`   Orders: ${eyob.orderCount || 0}`);
                console.log(`   Total Spent: $${eyob.totalSpent || 0}\n`);
                
                if (!eyob.isGuest) {
                    console.log('🎉 SUCCESS: Eyob is correctly classified as Registered!');
                } else {
                    console.log('❌ PROBLEM: Eyob is still showing as Guest');
                }
            } else {
                console.log('⚠️  Could not find Eyob Kifle in customer list');
            }
            
            // Show breakdown
            console.log('\n📋 Customer Breakdown:');
            const registered = data.data.filter(c => !c.isGuest);
            const guests = data.data.filter(c => c.isGuest);
            
            console.log(`\n✅ Registered Customers (${registered.length}):`);
            registered.slice(0, 5).forEach((customer, index) => {
                console.log(`   ${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.email})`);
            });
            
            console.log(`\n⚠️  Guest Customers (${guests.length}):`);
            guests.slice(0, 5).forEach((customer, index) => {
                console.log(`   ${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.email})`);
            });
            
        } else {
            console.log('❌ Error:', response.status, await response.text());
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCustomerFix();
