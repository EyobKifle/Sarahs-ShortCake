const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('Testing admin login...');

        console.log('Testing with credentials:');
        console.log('Email: admin@example.com');
        console.log('Password: password');

        const response = await fetch('http://localhost:3000/api/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'password'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.text();
        console.log('Response body:', data);

        if (response.ok) {
            console.log('✅ Login successful!');
        } else {
            console.log('❌ Login failed');
        }

    } catch (error) {
        console.error('Error testing login:', error);
    }
}

testLogin();
