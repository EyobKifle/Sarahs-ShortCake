const request = require('supertest');
const app = require('../server'); // Assuming server.js exports the Express app
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

describe('Order API', () => {
  let customerId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a customer for order tests
    const customer = new Customer({
      firstName: 'Order',
      lastName: 'Tester',
      email: 'ordertester@example.com',
      phone: '1234567890'
    });
    await customer.save();
    customerId = customer._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // Clean up orders after each test
    await Order.deleteMany({});
  });

  test('should create a new order', async () => {
    const newOrder = {
      customer: customerId.toString(),
      items: [
        {
          quantity: 2,
          cakeFlavor: 'Vanilla',
          cakeColor: 'N/A',
          icingFlavor: 'Vanilla',
          icingColor: 'N/A',
          decoration: 'Sprinkles'
        }
      ],
      deliveryOption: 'pickup',
      neededDate: new Date().toISOString(),
      neededTime: '12:00',
      totalPrice: 20.0,
      status: 'pending'
    };

    const response = await request(app)
      .post('/api/orders')
      .send(newOrder)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.customer).toBe(customerId.toString());
    expect(response.body.data.items.length).toBe(1);
  });

  test('should get orders for a customer', async () => {
    // Create an order
    const order = new Order({
      customer: customerId,
      items: [
        {
          quantity: 1,
          cakeFlavor: 'Chocolate',
          cakeColor: 'N/A',
          icingFlavor: 'Butter Cream',
          icingColor: 'N/A',
          decoration: ''
        }
      ],
      deliveryOption: 'delivery',
      neededDate: new Date(),
      neededTime: '15:00',
      totalPrice: 15.0,
      status: 'processing'
    });
    await order.save();

    const response = await request(app)
      .get('/api/orders/user')
      .set('Authorization', `Bearer ${process.env.TEST_USER_TOKEN || ''}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
