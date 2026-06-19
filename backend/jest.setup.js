/**
 * Jest Setup File for Backend Tests
 * 
 * Place this in backend/jest.setup.js
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/agriconnect-test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_for_testing';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
