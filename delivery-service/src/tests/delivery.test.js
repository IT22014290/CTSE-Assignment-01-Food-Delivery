const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('axios');
const axios = require('axios');

const app = require('../app');
const Delivery = require('../models/Delivery');

let mongoServer;

const driverUser = { userId: 'driver123', email: 'driver@example.com', role: 'delivery_driver' };
const adminUser  = { userId: 'admin001',  email: 'admin@example.com',  role: 'admin' };

const FAKE_ORDER_ID = new mongoose.Types.ObjectId().toString();

function mockAuthAs(user) {
  axios.get.mockResolvedValue({
    data: { success: true, data: { user } },
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
  await Delivery.deleteMany({});
  jest.resetAllMocks();
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /delivery/:orderId', () => {
  it('returns 404 for an order with no delivery record', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/delivery/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for an invalid order ID format', async () => {
    const res = await request(app).get('/delivery/not-a-valid-id');
    expect(res.statusCode).toBe(400);
  });

  it('returns the delivery record when it exists', async () => {
    await Delivery.create({
      orderId: FAKE_ORDER_ID,
      driverId: driverUser.userId,
      status: 'assigned',
    });

    const res = await request(app).get(`/delivery/${FAKE_ORDER_ID}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe(FAKE_ORDER_ID);
    expect(res.body.data.status).toBe('assigned');
  });
});

describe('POST /delivery/assign', () => {
  it('returns 401 without a token', async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 401 } });

    const res = await request(app)
      .post('/delivery/assign')
      .send({ orderId: FAKE_ORDER_ID, driverId: driverUser.userId });

    expect(res.statusCode).toBe(401);
  });

  it('returns 403 for a non-admin role', async () => {
    mockAuthAs(driverUser);

    const res = await request(app)
      .post('/delivery/assign')
      .set('Authorization', 'Bearer valid')
      .send({ orderId: FAKE_ORDER_ID, driverId: driverUser.userId });

    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for an invalid order ID format', async () => {
    mockAuthAs(adminUser);

    const res = await request(app)
      .post('/delivery/assign')
      .set('Authorization', 'Bearer valid')
      .send({ orderId: 'bad-id', driverId: driverUser.userId });

    expect(res.statusCode).toBe(400);
  });

  it('assigns a driver and returns the delivery record', async () => {
    mockAuthAs(adminUser);

    const res = await request(app)
      .post('/delivery/assign')
      .set('Authorization', 'Bearer valid')
      .send({ orderId: FAKE_ORDER_ID, driverId: driverUser.userId });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.driverId).toBe(driverUser.userId);
    expect(res.body.data.status).toBe('assigned');
  });

  it('returns 409 when order is already assigned', async () => {
    await Delivery.create({
      orderId: FAKE_ORDER_ID,
      driverId: driverUser.userId,
      status: 'assigned',
    });
    mockAuthAs(adminUser);

    const res = await request(app)
      .post('/delivery/assign')
      .set('Authorization', 'Bearer valid')
      .send({ orderId: FAKE_ORDER_ID, driverId: driverUser.userId });

    expect(res.statusCode).toBe(409);
  });
});

describe('POST /delivery/claim', () => {
  it('returns 400 for an invalid order ID format', async () => {
    mockAuthAs(driverUser);

    const res = await request(app)
      .post('/delivery/claim')
      .set('Authorization', 'Bearer valid')
      .send({ orderId: 'bad-id' });

    expect(res.statusCode).toBe(400);
  });

  it('claims an order successfully', async () => {
    mockAuthAs(driverUser);

    const res = await request(app)
      .post('/delivery/claim')
      .set('Authorization', 'Bearer valid')
      .send({ orderId: FAKE_ORDER_ID });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.driverId).toBe(driverUser.userId);
    expect(res.body.data.status).toBe('assigned');
  });
});

describe('GET /delivery/driver/active', () => {
  it('returns 401 without a token', async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 401 } });

    const res = await request(app).get('/delivery/driver/active');
    expect(res.statusCode).toBe(401);
  });

  it('returns only active (non-delivered) deliveries for the driver', async () => {
    await Delivery.create({ orderId: FAKE_ORDER_ID,        driverId: driverUser.userId, status: 'assigned' });
    await Delivery.create({ orderId: new mongoose.Types.ObjectId().toString(), driverId: driverUser.userId, status: 'delivered' });
    mockAuthAs(driverUser);

    const res = await request(app)
      .get('/delivery/driver/active')
      .set('Authorization', 'Bearer valid');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('assigned');
  });
});

describe('PUT /delivery/:orderId/location', () => {
  it('returns 400 for an invalid order ID format', async () => {
    mockAuthAs(driverUser);

    const res = await request(app)
      .put('/delivery/bad-id/location')
      .set('Authorization', 'Bearer valid')
      .send({ latitude: 6.9271, longitude: 79.8612 });

    expect(res.statusCode).toBe(400);
  });

  it('validates latitude range with 400', async () => {
    mockAuthAs(driverUser);

    const res = await request(app)
      .put(`/delivery/${FAKE_ORDER_ID}/location`)
      .set('Authorization', 'Bearer valid')
      .send({ latitude: 999, longitude: 79.86 });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when no delivery exists for this driver+order', async () => {
    mockAuthAs(driverUser);

    const res = await request(app)
      .put(`/delivery/${FAKE_ORDER_ID}/location`)
      .set('Authorization', 'Bearer valid')
      .send({ latitude: 6.9271, longitude: 79.8612 });

    expect(res.statusCode).toBe(404);
  });

  it('updates GPS location successfully', async () => {
    await Delivery.create({
      orderId: FAKE_ORDER_ID,
      driverId: driverUser.userId,
      status: 'assigned',
    });
    mockAuthAs(driverUser);
    axios.put = jest.fn().mockResolvedValue({ data: {} });

    const res = await request(app)
      .put(`/delivery/${FAKE_ORDER_ID}/location`)
      .set('Authorization', 'Bearer valid')
      .send({ latitude: 6.9271, longitude: 79.8612 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.currentLocation.latitude).toBe(6.9271);
    expect(res.body.data.currentLocation.longitude).toBe(79.8612);
  });

  it('updates status to picked_up and triggers order status update', async () => {
    await Delivery.create({
      orderId: FAKE_ORDER_ID,
      driverId: driverUser.userId,
      status: 'assigned',
    });
    mockAuthAs(driverUser);
    axios.put = jest.fn().mockResolvedValue({ data: {} });

    const res = await request(app)
      .put(`/delivery/${FAKE_ORDER_ID}/location`)
      .set('Authorization', 'Bearer valid')
      .send({ latitude: 6.9271, longitude: 79.8612, status: 'picked_up' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('picked_up');
  });

  it('updates status to delivered and triggers order status update', async () => {
    await Delivery.create({
      orderId: FAKE_ORDER_ID,
      driverId: driverUser.userId,
      status: 'picked_up',
    });
    mockAuthAs(driverUser);
    axios.put = jest.fn().mockResolvedValue({ data: {} });

    const res = await request(app)
      .put(`/delivery/${FAKE_ORDER_ID}/location`)
      .set('Authorization', 'Bearer valid')
      .send({ latitude: 6.9271, longitude: 79.8612, status: 'delivered' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('delivered');
  });
});
