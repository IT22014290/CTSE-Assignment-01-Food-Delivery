const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock axios so authProxy never calls the real auth service
jest.mock('axios');
const axios = require('axios');

const app = require('../app');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

let mongoServer;

const ownerUser = { userId: 'owner123', email: 'owner@example.com', role: 'restaurant_owner' };

function mockAuthAs(user) {
  axios.get.mockResolvedValue({
    data: { success: true, data: { user } },
  });
}

// Default mock: authProxy validates any Bearer token successfully
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  axios.get.mockResolvedValue({
    data: { success: true, data: { user: ownerUser } },
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Restaurant.deleteMany({});
  await MenuItem.deleteMany({});
  // resetAllMocks clears the "once" queue AND implementations; re-setup default after
  jest.resetAllMocks();
  axios.get.mockResolvedValue({
    data: { success: true, data: { user: ownerUser } },
  });
});

async function seedRestaurant(overrides = {}) {
  return Restaurant.create({
    name: 'Test Kitchen',
    category: 'Asian',
    address: '10 Main St',
    description: 'Test restaurant',
    ownerId: ownerUser.userId,
    ...overrides,
  });
}

describe('GET /restaurants', () => {
  it('returns empty list when no restaurants exist', async () => {
    const res = await request(app).get('/restaurants');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('returns all restaurants', async () => {
    await seedRestaurant();
    await seedRestaurant({ name: 'Pizza Palace', category: 'Italian' });

    const res = await request(app).get('/restaurants');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('filters by name query param', async () => {
    await seedRestaurant({ name: 'Spice House' });
    await seedRestaurant({ name: 'Burger Barn' });

    const res = await request(app).get('/restaurants?q=spice');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Spice House');
  });

  it('filters by category param', async () => {
    await seedRestaurant({ category: 'Asian' });
    await seedRestaurant({ name: 'Pasta Place', category: 'Italian' });

    const res = await request(app).get('/restaurants?category=Italian');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category).toBe('Italian');
  });
});

describe('GET /restaurants/:id', () => {
  it('returns a restaurant by ID', async () => {
    const restaurant = await seedRestaurant();

    const res = await request(app).get(`/restaurants/${restaurant._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('Test Kitchen');
  });

  it('returns 404 for an unknown ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/restaurants/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /restaurants', () => {
  it('requires authorisation — returns 401 without token', async () => {
    // axios.get is never reached when Authorization header is absent
    const res = await request(app).post('/restaurants').send({
      name: 'New Place',
      category: 'Fast Food',
      address: '1 High Street',
    });

    expect(res.statusCode).toBe(401);
  });

  it('creates a restaurant for an authenticated owner', async () => {
    mockAuthAs(ownerUser);

    const res = await request(app)
      .post('/restaurants')
      .set('Authorization', 'Bearer valid_token')
      .send({ name: 'New Place', category: 'Fast Food', address: '1 High Street' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('New Place');
    expect(res.body.data.ownerId).toBe(ownerUser.userId);
  });

  it('rejects missing required fields with 400', async () => {
    mockAuthAs(ownerUser);

    const res = await request(app)
      .post('/restaurants')
      .set('Authorization', 'Bearer valid_token')
      .send({ name: 'No Address' });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /restaurants/:id/menu', () => {
  it('returns empty menu for a restaurant with no items', async () => {
    const restaurant = await seedRestaurant();

    const res = await request(app).get(`/restaurants/${restaurant._id}/menu`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns menu items', async () => {
    const restaurant = await seedRestaurant();
    await MenuItem.create({
      name: 'Spring Rolls',
      category: 'Starters',
      price: 5.5,
      restaurantId: restaurant._id,
    });

    const res = await request(app).get(`/restaurants/${restaurant._id}/menu`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Spring Rolls');
  });
});
