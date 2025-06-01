const fetch = require('node-fetch');

async function testSignup() {
    try {
        console.log('🔍 Testing User Signup Process...\n');

        // Test data for new user
        const testUser = {
            firstName: 'Test',
            lastName: 'User',
            email: `testuser${Date.now()}@example.com`, // Unique email
            phone: '1234567890',
            password: 'Password123!'
        };

        console.log('👤 Creating new user account...');
        console.log(`   Name: ${testUser.firstName} ${testUser.lastName}`);
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Phone: ${testUser.phone}\n`);

        // Test signup API
        const signupResponse = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        if (!signupResponse.ok) {
            const errorData = await signupResponse.json();
            throw new Error(`Signup failed: ${errorData.message}`);
        }

        const signupData = await signupResponse.json();
        console.log('✅ Signup successful!');
        console.log(`   User ID: ${signupData.data._id}`);
        console.log(`   Is Guest: ${signupData.data.isGuest}`);
        console.log(`   Role: ${signupData.data.role}\n`);

        // Verify the user is classified correctly
        if (signupData.data.isGuest === false) {
            console.log('🎉 SUCCESS: New user is correctly classified as REGISTERED customer!');
        } else {
            console.log('❌ PROBLEM: New user is incorrectly classified as guest');
        }

        // Test login with the new user
        console.log('\n🔐 Testing login with new user...');
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

            // Now check if the user appears in customer management
            console.log('\n📊 Checking customer management API...');

            // Login as admin first
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

            // Find our test user
            const testCustomer = customerData.data.find(c => c.email === testUser.email);

            if (testCustomer) {
                console.log('✅ User found in customer management!');
                console.log(`   Name: ${testCustomer.firstName} ${testCustomer.lastName}`);
                console.log(`   Email: ${testCustomer.email}`);
                console.log(`   Type: ${testCustomer.isGuest ? 'Guest' : 'Registered'}`);
                console.log(`   Orders: ${testCustomer.orderCount || 0}`);

                if (!testCustomer.isGuest) {
                    console.log('\n🎉 COMPLETE SUCCESS: User signup creates registered customer correctly!');
                } else {
                    console.log('\n❌ PROBLEM: User appears as guest in customer management');
                }
            } else {
                console.log('❌ User not found in customer management');
            }

        } else {
            console.log('❌ Login failed');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSignup();
