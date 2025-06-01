require('dotenv').config();
const axios = require('axios');

const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzA3MGM1ZDI4ZTMwN2ZhZDQxN2FjYiIsInVzZXJUeXBlIjoiYWRtaW4iLCJpYXQiOjE3NDgxMjc1NDAsImV4cCI6MTc1MDcxOTU0MH0.mZ7r99MAL5SJWEYKruVG33bkV94SZm6u98xD0qX42o4';

async function testOrdersApi() {
  try {
    const response = await axios.get('http://localhost:3000/api/orders', {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    console.log('Orders API response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Orders API error response:', error.response.status, error.response.statusText, error.response.data);
    } else if (error.request) {
      console.error('Orders API error request:', error.request);
    } else {
      console.error('Orders API error:', error.message);
    }
  }
}

testOrdersApi();
