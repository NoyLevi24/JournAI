import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect, jest } from '@jest/globals';
import { app } from '../src/server.js';

// Set test timeout to 30 seconds for CI
jest.setTimeout(30000);

// Enable test logging
console.log('Starting tests with NODE_ENV:', process.env.NODE_ENV);

describe('GET /health', () => {
  let server;
  
  beforeAll((done) => {
    console.log('Starting test server...');
    server = app.listen(0, 'localhost', (err) => {
      if (err) {
        console.error('Failed to start server:', err);
        return done(err);
      }
      console.log(`Test server running on port ${server.address().port}`);
      done();
    });
  });

  afterAll((done) => {
    console.log('Cleaning up test server...');
    if (!server) {
      console.log('No server instance to close');
      return done();
    }

    server.close((err) => {
      if (err) {
        console.error('Error closing server:', err);
        return done(err);
      }
      console.log('Test server closed');
      // Additional cleanup if needed
      if (global.gc) {
        global.gc();
      }
      done();
    });
  });

  it('should return 200 OK', async () => {
    console.log('Running health check test...');
    try {
      const response = await request(server)
        .get('/health')
        .timeout(5000);
      
      console.log('Health check response status:', response.status);
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Health check test failed:', error);
      throw error;
    }
  });

  it('should have a working test environment', () => {
    console.log('Running basic test...');
    expect(true).toBe(true);
  });
});
