// Jest setup for ES modules
import { jest } from '@jest/globals';

// Set NODE_ENV to test to prevent background processes from starting
process.env.NODE_ENV = 'test';

// Set timeout for all tests
jest.setTimeout(30000);

// Silence console logs during tests
global.console = {
  ...console,
  // Log regular messages when in debug mode
  log: process.env.DEBUG ? console.log : jest.fn(),
  // Always log errors and warnings
  error: console.error,
  warn: console.warn,
  info: console.info,
}; 