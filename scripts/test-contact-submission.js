const fetch = require('node-fetch');

async function testContactSubmission() {
    try {
        console.log('🧪 Testing contact form submission...');

        const testMessage = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890',
            subject: 'Test Message from Script',
            message: 'This is a test message to verify the contact form submission is working properly.'
        };

        console.log('📧 Sending test message:', testMessage);

        const response = await fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseData = await response.json();
        console.log('📧 Response data:', responseData);

        if (response.ok) {
            console.log('✅ Contact form submission test PASSED');
            console.log('📋 Message saved with ID:', responseData.data._id);
        } else {
            console.log('❌ Contact form submission test FAILED');
            console.log('❌ Error:', responseData.message);
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testContactSubmission();
