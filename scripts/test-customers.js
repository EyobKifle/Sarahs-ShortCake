const fetch = require('node-fetch');

async function testCustomers() {
    try {
        const response = await fetch('http://localhost:3000/api/customers', {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzA3MGM1ZDI4ZTMwN2ZhZDQxN2FjYiIsInVzZXJUeXBlIjoiYWRtaW4iLCJpYXQiOjE3NDgyNTI2ODgsImV4cCI6MTc0ODg1NzQ4OH0.KJYRpGlwXAmRqDxgjpI6gyv21TfailQXV8DTXiz1kiQ'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Customer Summary:', data.summary);
            console.log('\nFirst 5 customers:');
            data.data.slice(0, 5).forEach((customer, index) => {
                console.log(`${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.email}) - Guest: ${customer.isGuest}`);
            });
            
            console.log('\nGuest customers:');
            const guests = data.data.filter(c => c.isGuest);
            guests.slice(0, 3).forEach((customer, index) => {
                console.log(`${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.email})`);
            });
            
            console.log('\nRegistered customers:');
            const registered = data.data.filter(c => !c.isGuest);
            registered.slice(0, 3).forEach((customer, index) => {
                console.log(`${index + 1}. ${customer.firstName} ${customer.lastName} (${customer.email})`);
            });
        } else {
            console.log('Error:', response.status, await response.text());
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCustomers();
