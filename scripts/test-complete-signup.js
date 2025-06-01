const fetch = require('node-fetch');

async function testCompleteSignup() {
    try {
        console.log('🔍 Testing Complete Signup Flow...\n');
        
        // Test multiple users to ensure consistency
        const testUsers = [
            {
                firstName: 'Alice',
                lastName: 'Johnson',
                email: `alice${Date.now()}@example.com`,
                phone: '1111111111',
                password: 'AlicePass123!'
            },
            {
                firstName: 'Bob',
                lastName: 'Smith',
                email: `bob${Date.now()}@example.com`,
                phone: '2222222222',
                password: 'BobSecure456!'
            },
            {
                firstName: 'Carol',
                lastName: 'Williams',
                email: `carol${Date.now()}@example.com`,
                phone: '3333333333',
                password: 'CarolStrong789!'
            }
        ];
        
        console.log('👥 Creating multiple test users...\n');
        
        const createdUsers = [];
        
        for (let i = 0; i < testUsers.length; i++) {
            const user = testUsers[i];
            console.log(`📝 Creating user ${i + 1}: ${user.firstName} ${user.lastName}`);
            
            // Test signup
            const signupResponse = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });
            
            if (!signupResponse.ok) {
                const errorData = await signupResponse.json();
                console.log(`❌ Signup failed for ${user.firstName}: ${errorData.message}`);
                continue;
            }
            
            const signupData = await signupResponse.json();
            console.log(`   ✅ Signup successful - ID: ${signupData.data._id}`);
            console.log(`   ✅ Is Guest: ${signupData.data.isGuest} (should be false)`);
            console.log(`   ✅ Role: ${signupData.data.role}`);
            
            // Verify classification
            if (signupData.data.isGuest === false) {
                console.log(`   🎉 ${user.firstName} correctly classified as REGISTERED customer!`);
            } else {
                console.log(`   ❌ ${user.firstName} incorrectly classified as guest!`);
            }
            
            createdUsers.push({
                ...user,
                id: signupData.data._id,
                isGuest: signupData.data.isGuest
            });
            
            console.log('');
        }
        
        console.log(`📊 Summary: Created ${createdUsers.length} users\n`);
        
        // Now check customer management API
        console.log('🔍 Checking customer management API...');
        
        // Login as admin
        const adminLoginResponse = await fetch('http://localhost:3000/api/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password'
            })
        });
        
        const adminData = await adminLoginResponse.json();
        const adminToken = adminData.token;
        
        // Get customer list
        const customerResponse = await fetch(`http://localhost:3000/api/customers?_t=${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        const customerData = await customerResponse.json();
        
        console.log('📊 Customer Management Results:');
        console.log(`   Total customers: ${customerData.data.length}`);
        console.log(`   Registered: ${customerData.summary.registeredCustomers}`);
        console.log(`   Guests: ${customerData.summary.guestCustomers}\n`);
        
        // Verify each created user appears correctly
        console.log('🔍 Verifying created users in customer management:');
        let allCorrect = true;
        
        for (const user of createdUsers) {
            const foundCustomer = customerData.data.find(c => c.email === user.email);
            
            if (foundCustomer) {
                const isCorrect = !foundCustomer.isGuest;
                console.log(`   ${isCorrect ? '✅' : '❌'} ${user.firstName} ${user.lastName}: ${foundCustomer.isGuest ? 'Guest' : 'Registered'}`);
                if (!isCorrect) allCorrect = false;
            } else {
                console.log(`   ❌ ${user.firstName} ${user.lastName}: NOT FOUND`);
                allCorrect = false;
            }
        }
        
        console.log('\n🎯 Final Results:');
        if (allCorrect && createdUsers.length > 0) {
            console.log('🎉 SUCCESS: All new signups are correctly classified as REGISTERED customers!');
            console.log('✅ User signup process is working perfectly!');
        } else {
            console.log('❌ PROBLEM: Some users are not correctly classified');
        }
        
        // Test login for one of the users
        if (createdUsers.length > 0) {
            const testUser = createdUsers[0];
            console.log(`\n🔐 Testing login for ${testUser.firstName}...`);
            
            const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: testUser.email,
                    password: testUser.password
                })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                console.log('✅ Login successful!');
                console.log(`   User: ${loginData.user.firstName} ${loginData.user.lastName}`);
                console.log(`   Role: ${loginData.user.role}`);
                console.log('✅ User can login and access their account!');
            } else {
                console.log('❌ Login failed');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCompleteSignup();
