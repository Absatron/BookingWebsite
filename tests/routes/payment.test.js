import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { connectDB, disconnectDB, clearDatabase } from '../config/db-setup.js';
import { createTestUser } from '../utils/test-utils.js';
import paymentRouter from '../../server/routes/payment.js';

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
  app.use('/api/payment', paymentRouter);
});

// Clear database between tests
beforeEach(async () => {
  await clearDatabase();
});

// Disconnect after all tests
afterAll(async () => {
  await disconnectDB();
});

describe('Payment Routes', () => {
  // Add your payment route tests here
  // Examples:
  /*
  describe('POST /api/payment/create-checkout-session', () => {
    test('should create a checkout session', async () => {
      // Test implementation
    });
  });

  describe('POST /api/payment/webhook', () => {
    test('should handle webhook events', async () => {
      // Test implementation
    });
  });
  */
}); 