const request = require('supertest');
const app = require('../server'); // Assuming server.js exports the Express app
const mongoose = require('mongoose');
const Customer = require('../models/Customer');

describe('Customer API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean up customers after each test
    await Customer.deleteMany({});
  });

  test('should create a new customer', async () => {
    const newCustomer = {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      phone: '1234567890',
      streetAddress: '123 Test St',
      city: 'Testville',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/customer')
      .send(newCustomer)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(newCustomer.email);
  });

  test('should update an existing customer', async () => {
    const customer = new Customer({
      firstName: 'Old',
      lastName: 'Name',
      email: 'oldname@example.com',
      phone: '1112223333'
    });
    await customer.save();

    const updatedData = {
      firstName: 'New',
      lastName: 'Name',
      email: 'oldname@example.com',
      phone: '9998887777'
    };

    const response = await request(app)
      .post('/api/customer')
      .send(updatedData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.firstName).toBe('New');
    expect(response.body.data.phone).toBe('9998887777');
  });
});
