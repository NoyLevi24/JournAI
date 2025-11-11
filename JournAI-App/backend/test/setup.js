// Global test setup
import { jest } from '@jest/globals';

// Set test timeout
jest.setTimeout(30000);

// Mock any global objects if needed
global.console = {
  ...console,
  // Override console methods if needed
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Add any other global test setup here
