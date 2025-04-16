import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { connectDB, disconnectDB, clearDatabase } from '../config/db-setup.js';
import { createTestUser, createTestAdmin } from '../utils/test-utils.js';
import userRouter from '../../server/routes/user.js';

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
  app.use('/api/user', userRouter);
});

// Clear database between tests
beforeEach(async () => {
  await clearDatabase();
});

// Disconnect after all tests
afterAll(async () => {
  await disconnectDB();
});

describe('User Routes', () => {
  describe('POST /register', () => {
    test('should register a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('name', userData.name);
    });

    test('should not register a user with an existing email', async () => {
      // Create a user first
      await createTestUser();

      // Try to register with the same email
      const userData = {
        name: 'Another User',
        email: 'test@example.com', // Same email as in createTestUser
        password: 'anotherpassword'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('message', 'User is already registered');
    });
  });

  describe('POST /login', () => {
    test('should login a user with correct credentials', async () => {
      const password = 'password123';
      const user = await createTestUser({ password });

      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: user.email,
          password
        })
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', user.email);
      expect(response.body).toHaveProperty('name', user.name);
    });

    test('should not login with incorrect password', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    test('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });
  });

  describe('POST /logout', () => {
    test('should logout a user', async () => {
      const response = await request(app)
        .post('/api/user/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User was successfully logged out');
    });
  });
}); 