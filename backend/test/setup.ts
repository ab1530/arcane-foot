// Test setup file
// This file runs before each test suite
import * as dotenv from 'dotenv';

// Load .env file for E2E tests (uses real database)
dotenv.config();

// Set test environment variables (only if not already set)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key';
}
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '1h';
}
process.env.NODE_ENV = 'test';

// Effectively disable rate limiting for tests
process.env.RATE_LIMIT_TTL = '1'; // 1ms TTL
process.env.RATE_LIMIT_MAX = '999999'; // Extremely high limit

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
