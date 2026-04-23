const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock axios to intercept both authProxy and inter-service calls
jest.mock('axios');
const axios = require('axios');

const app = require('../app');
const Order = require('../models/Order');

let mongoServer;

const customerUser = { userId: 'customer123', email: 'cust@example.com', role: 'customer' };
const ownerUser   = { userId: 'owner123',    email: 'owner@example.com', role: 'restaurant_owner' };

const FAKE_RESTAURANT_ID = new mongoose.Types.ObjectId().toString();
const FAKE_MENU_ITEM_ID  = new mongoose.Types.ObjectId().toString();

function mockAuthAs(user) {
  axios.get.mockImplementation((url) => {
    if (url.includes('validate-token')) {
      return Promise.resolve({ data: { success: true, data: { user } } });
    }
    // Restaurant service: restaurant exists
    if (url.includes('/restaurants/') && !url.includes('/menu')) {
      return Promise.resolve({ data: { success: true, data: { _id: FAKE_RESTAURANT_ID } } });
    }
    // Restaurant service: menu endpoint
    if (url.includes('/menu')) {
      return Promise.resolve({
        data: {
          success: true,
          data: [{ _id: FAKE_MENU_ITEM_ID, name: 'Kottu Roti', price: 8.5, isAvailable: true }],
        },
      });
    }
    return Promise.reject(new Error(`Unmocked GET: ${url}`));
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Order.deleteMany({});
  jest.resetAllMocks();
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /orders', () => {
  it('returns 401 without an auth token', async () => {
    const res = await request(app).post('/orders').send({
      restaurantId: FAKE_RESTAURANT_ID,
      items: [{ menuItemId: FAKE_MENU_ITEM_ID, quantity: 1 }],
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when role is not customer', async () => {
    mockAuthAs(ownerUser);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer valid')
      .send({
        restaurantId: FAKE_RESTAURANT_ID,
        items: [{ menuItemId: FAKE_MENU_ITEM_ID, quantity: 1 }],
      });

    expect(res.statusCode).toBe(403);
  });

  it('creates an order and returns totalAmount', async () => {
    mockAuthAs(customerUser);
    // suppress notification service call
    axios.post = jest.fn().mockResolvedValue({ data: {} });

    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer valid')
      .send({
        restaurantId: FAKE_RESTAURANT_ID,
        items: [{ menuItemId: FAKE_MENU_ITEM_ID, quantity: 2 }],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.totalAmount).toBe(17); // 8.50 × 2
    expect(res.body.data.customerId).toBe(customerUser.userId);
  });

  it('validates that items array is non-empty', async () => {
    mockAuthAs(customerUser);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer valid')
      .send({ restaurantId: FAKE_RESTAURANT_ID, items: [] });

    expect(res.statusCode).toBe(400);
  });

  it('validates quantity is at least 1', async () => {
    mockAuthAs(customerUser);

    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer valid')
      .send({
        restaurantId: FAKE_RESTAURANT_ID,
        items: [{ menuItemId: FAKE_MENU_ITEM_ID, quantity: 0 }],
      });

    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /orders/:id/status', () => {
  let orderId;

  beforeEach(async () => {
    const order = await Order.create({
      customerId: customerUser.userId,
      restaurantId: FAKE_RESTAURANT_ID,
      items: [{ menuItemId: FAKE_MENU_ITEM_ID, name: 'Kottu Roti', quantity: 1, unitPrice: 8.5 }],
      totalAmount: 8.5,
      status: 'pending',
    });
    orderId = order._id.toString();
  });

  it('advances order status for a restaurant_owner', async () => {
    mockAuthAs(ownerUser);

    const res = await request(app)
      .put(`/orders/${orderId}/status`)
      .set('Authorization', 'Bearer valid')
      .send({ status: 'confirmed' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('rejects backwards status moves with 400', async () => {
    // First advance to 'confirmed'
    await Order.findByIdAndUpdate(orderId, { status: 'confirmed' });
    mockAuthAs(ownerUser);

    const res = await request(app)
      .put(`/orders/${orderId}/status`)
      .set('Authorization', 'Bearer valid')
      .send({ status: 'pending' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for a non-existent order', async () => {
    mockAuthAs(ownerUser);
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`/orders/${fakeId}/status`)
      .set('Authorization', 'Bearer valid')
      .send({ status: 'confirmed' });

    expect(res.statusCode).toBe(404);
  });
});
