import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect, jest } from '@jest/globals';
import { app } from '../src/server.js';

// Set test timeout to 10 seconds
jest.setTimeout(10000);

describe('GET /health', () => {
  let server;
  
  beforeAll((done) => {
    // Start the server on a random port
    server = app.listen(0, 'localhost', done);
  });

  afterAll((done) => {
    if (!server) return done();
    
    // Force close the server after test timeout
    server.close(() => {
      // Give the server a moment to close
      setTimeout(done, 500);
    });
  });

  it('should return 200 OK', async () => {
    const response = await request(server)
      .get('/health')
      .timeout(2000); // 2 second timeout for the request
    
    expect(response.status).toBe(200);
  });

  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });
});
