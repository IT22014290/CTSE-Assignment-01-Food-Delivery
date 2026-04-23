const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret_for_jest';
  process.env.JWT_EXPIRES_IN = '1h';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const validUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'password123',
  role: 'customer',
};

describe('POST /auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/auth/register').send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/auth/register').send(validUser);
    const res = await request(app).post('/auth/register').send(validUser);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing name with 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'x@x.com', password: 'pass123' });

    expect(res.statusCode).toBe(400);
  });

  it('rejects short password with 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test', email: 'x@x.com', password: '123' });

    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid email format with 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'pass123' });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send(validUser);
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'anypass' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /auth/validate-token', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/auth/register').send(validUser);
    token = res.body.data.token;
  });

  it('returns user data for a valid token', async () => {
    const res = await request(app)
      .get('/auth/validate-token')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.role).toBe('customer');
  });

  it('rejects requests with no token with 401', async () => {
    const res = await request(app).get('/auth/validate-token');
    expect(res.statusCode).toBe(401);
  });

  it('rejects a tampered token with 401', async () => {
    const res = await request(app)
      .get('/auth/validate-token')
      .set('Authorization', 'Bearer tampered.token.value');

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('returns 200', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
