import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { connectDB, disconnectDB, clearDatabase } from '../config/db-setup.js';
import { createTestUser, createTestAdmin } from '../utils/test-utils.js';
import bookingsRouter from '../../server/routes/bookings.js';

let app;

// Setup test app
beforeAll(async () => {
  await connectDB();
  
  app = express();
  const sessionOptions = { 
    secret: 'test-secret', 
    resave: false, 
    saveUninitialized: false 
  };
  
  app.use(express.json());
  app.use(session(sessionOptions));
  app.use('/api/bookings', bookingsRouter);
});

// Clear database between tests
beforeEach(async () => {
  await clearDatabase();
});

// Disconnect after all tests
afterAll(async () => {
  await disconnectDB();
});

describe('Booking Routes', () => {
  // Add your booking route tests here
  // Examples:
  /*
  describe('GET /api/bookings', () => {
    test('should return all bookings', async () => {
      // Test implementation
    });
  });

  describe('POST /api/bookings', () => {
    test('should create a new booking', async () => {
      // Test implementation
    });
  });
  */
}); 