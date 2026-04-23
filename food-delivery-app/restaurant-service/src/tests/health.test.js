const request = require('supertest');
const app = require('../app');

describe('Restaurant service health', () => {
  it('GET /health should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
