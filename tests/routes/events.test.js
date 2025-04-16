import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { connectDB, disconnectDB, clearDatabase } from '../config/db-setup.js';
import { createTestUser, createTestAdmin } from '../utils/test-utils.js';
import eventsRouter from '../../server/routes/events.js';

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
  app.use('/api/events', eventsRouter);
});

// Clear database between tests
beforeEach(async () => {
  await clearDatabase();
});

// Disconnect after all tests
afterAll(async () => {
  await disconnectDB();
});

describe('Event Routes', () => {
  // Add your event route tests here
  // Examples:
  /*
  describe('GET /api/events', () => {
    test('should return all events', async () => {
      // Test implementation
    });
  });

  describe('POST /api/events', () => {
    test('should create a new event', async () => {
      // Test implementation
    });
  });
  */
}); 