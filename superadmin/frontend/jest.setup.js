// Jest setup file for integration tests

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep log and warn for debugging, but silence info
  info: jest.fn(),
  debug: jest.fn(),
};

// Set up test environment
beforeAll(() => {
  // Any global setup
});

afterAll(() => {
  // Any global cleanup
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});