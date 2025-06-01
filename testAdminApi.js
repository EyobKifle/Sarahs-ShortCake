const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api/admin';
let AUTH_TOKEN = ''; // Will be set after login

async function adminLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.success) {
      AUTH_TOKEN = data.token;
      console.log('Admin login successful. Token obtained.');
    } else {
      console.error('Admin login failed:', data.message);
    }
  } catch (error) {
    console.error('Error during admin login:', error);
  }
}

async function testGetAllAdmins() {
  try {
    const response = await fetch(API_BASE_URL, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    const data = await response.json();
    console.log('GET /api/admin response:', data);
  } catch (error) {
    console.error('Error fetching admins:', error);
  }
}

async function testCreateAdmin() {
  try {
    const newAdmin = {
      firstName: 'Test',
      lastName: 'Admin',
      email: 'testadmin@example.com',
      password: 'TestPassword123',
      phone: '1234567890',
      address: '123 Test St',
      role: 'admin',
      permissions: []
    };
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(newAdmin)
    });
    const data = await response.json();
    console.log('POST /api/admin response:', data);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

async function runTests() {
  // Replace with valid admin credentials
  const adminEmail = 'admin@example.com';
  const adminPassword = 'password';

  await adminLogin(adminEmail, adminPassword);

  if (AUTH_TOKEN) {
    await testGetAllAdmins();
    // Add more tests for POST, PUT, DELETE as needed
  } else {
    console.error('Cannot run tests without valid auth token.');
  }
  await testCreateAdmin();
}

runTests();
