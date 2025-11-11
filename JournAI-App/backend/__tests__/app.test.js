import request from 'supertest';
import { createServer } from 'http';
import app from '../src/server.js';

let server;

beforeAll((done) => {
  server = createServer(app);
  server.listen(0, () => { // 0 means use a random available port
    process.env.TEST_SERVER_PORT = server.address().port;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
  }, 10000); // 10 second timeout
});
