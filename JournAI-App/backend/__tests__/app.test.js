import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { app } from '../src/server.js';

describe('GET /health', () => {
  let server;
  
  beforeAll((done) => {
    // Start the server on a random port
    const PORT = 0; // Let the OS assign a random port
    server = app.listen(PORT, 'localhost', done);
  });

  afterAll((done) => {
    // Close the server after tests are done
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should return 200 OK', async () => {
    const response = await request(server)
      .get('/health')
      .timeout(5000);
    
    expect(response.status).toBe(200);
  }, 10000); // 10 second timeout for this test

  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });
}, 30000); // 30 second timeout for all tests
