import request from 'supertest';
import { createServer } from 'http';
import { app } from '../src/server.js';

describe('GET /health', () => {
  let server;
  let serverAddress;

  beforeAll((done) => {
    server = createServer(app);
    server.listen(0, 'localhost', () => {
      const address = server.address();
      serverAddress = `http://localhost:${address.port}`;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should return 200 OK', async () => {
    const res = await request(serverAddress).get('/health').timeout(5000);
    expect(res.statusCode).toBe(200);
  }, 10000); // 10 second timeout for the test
});
