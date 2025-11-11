// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '0'; // Use random port for tests

// Mock any other environment variables your tests might need
process.env.DATABASE_URL = 'sqlite::memory:';

// Silence console logs during tests
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
