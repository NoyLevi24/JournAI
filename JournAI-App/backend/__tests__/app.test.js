import request from 'supertest';
import { createServer } from 'http';
import { app } from '../src/server.js';

describe('GET /health', () => {
  let server;

  beforeAll((done) => {
    server = createServer(app);
    server.listen(0, done); // Use a random available port
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should return 200 OK', async () => {
    const res = await request(server).get('/health');
    expect(res.statusCode).toBe(200);
  });
});
