import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import { connectDB, disconnectDB, clearDatabase } from '../config/db-setup.js';
import { createTestUser, createTestAdmin } from '../utils/test-utils.js';
import { generateToken } from '../../server/utils/jwt-utils.js';
import { User } from '../../server/models.js';
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
  let testUser;
  let userToken;

  beforeEach(async () => {
    // Create a test user for various tests
    testUser = await createTestUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      isVerified: true
    });

    userToken = generateToken(testUser);
  });

  describe('POST /register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'Password123!'
      };

      // Mock environment variables for email
      process.env.EMAIL_USER = 'test@example.com';
      process.env.CLIENT_URL = 'http://localhost:3000';

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Registration successful! Please check your email to verify your account.');
      expect(response.body).toHaveProperty('userId');

      // Verify user was created in database
      const createdUser = await User.findById(response.body.userId);
      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.isVerified).toBe(false);
      expect(createdUser.verificationToken).toBeTruthy();
    });

    test('should reject registration with invalid email format', async () => {
      const userData = {
        name: 'New User',
        email: 'invalid-email',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Invalid email format');
    });

    test('should reject registration with weak password', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Password must be at least 8 characters long');
    });

    test('should reject registration with existing email', async () => {
      const userData = {
        name: 'Another User',
        email: 'test@example.com', // Same email as testUser
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(409);

      expect(response.body.message).toBe('User is already registered');
    });

    test('should reject registration with missing fields', async () => {
      const userData = {
        name: 'New User'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Invalid email format');
    });
  });

  describe('POST /login', () => {
    test('should login user with correct credentials', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('isAdmin');
    });

    test('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    test('should reject login for unverified user', async () => {
      const unverifiedUser = await createTestUser({
        email: 'unverified@example.com',
        password: 'Password123!',
        isVerified: false
      });

      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: unverifiedUser.email,
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.message).toContain('Please verify your email before logging in');
      expect(response.body).toHaveProperty('emailNotVerified', true);
      expect(response.body).toHaveProperty('email', unverifiedUser.email);
    });
  });

  describe('POST /logout', () => {
    test('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/user/logout')
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /validate-token', () => {
    test('should validate valid JWT token', async () => {
      const response = await request(app)
        .get('/api/user/validate-token')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('name', testUser.name);
      expect(response.body).toHaveProperty('isAdmin');
    });

    test('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/user/validate-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/user/validate-token')
        .expect(401);

      expect(response.body.code).toBe('NO_TOKEN');
    });
  });

  describe('POST /verify-email', () => {
    test('should verify email with valid token', async () => {
      const unverifiedUser = await createTestUser({
        email: 'unverified@example.com',
        password: 'Password123!',
        isVerified: false,
        verificationToken: 'valid-token-123'
      });

      const response = await request(app)
        .post('/api/user/verify-email')
        .send({ token: 'valid-token-123' })
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully! You are now logged in.');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email', unverifiedUser.email);

      // Verify user is now verified in database
      const updatedUser = await User.findById(unverifiedUser._id);
      expect(updatedUser.isVerified).toBe(true);
      expect(updatedUser.verificationToken).toBeUndefined();
    });

    test('should reject verification with invalid token', async () => {
      const response = await request(app)
        .post('/api/user/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.message).toBe('Invalid verification token');
    });

    test('should reject verification without token', async () => {
      const response = await request(app)
        .post('/api/user/verify-email')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Verification token is required');
    });

    test('should reject verification for already verified user', async () => {
      const verifiedUser = await createTestUser({
        email: 'verified@example.com',
        password: 'Password123!',
        isVerified: true,
        verificationToken: 'some-token'
      });

      const response = await request(app)
        .post('/api/user/verify-email')
        .send({ token: 'some-token' })
        .expect(400);

      expect(response.body.message).toBe('Email is already verified');
    });
  });

  describe('POST /resend-verification', () => {
    test('should resend verification email for unverified user', async () => {
      const unverifiedUser = await createTestUser({
        email: 'unverified@example.com',
        password: 'Password123!',
        isVerified: false
      });

      // Mock environment variables for email
      process.env.EMAIL_USER = 'test@example.com';
      process.env.CLIENT_URL = 'http://localhost:3000';

      const response = await request(app)
        .post('/api/user/resend-verification')
        .send({ email: unverifiedUser.email })
        .expect(200);

      expect(response.body.message).toBe('Verification email sent! Please check your inbox.');

      // Verify new verification token was generated
      const updatedUser = await User.findById(unverifiedUser._id);
      expect(updatedUser.verificationToken).toBeTruthy();
    });

    test('should reject resend for already verified user', async () => {
      const response = await request(app)
        .post('/api/user/resend-verification')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body.message).toBe('Email is already verified');
    });

    test('should reject resend for non-existent user', async () => {
      const response = await request(app)
        .post('/api/user/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    test('should reject resend with invalid email format', async () => {
      const response = await request(app)
        .post('/api/user/resend-verification')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.message).toBe('Invalid email format');
    });

    test('should reject resend without email', async () => {
      const response = await request(app)
        .post('/api/user/resend-verification')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Email is required');
    });
  });

  describe('POST /forgot-password', () => {
    test('should send password reset email for existing user', async () => {
      // Mock environment variables for email
      process.env.EMAIL_USER = 'test@example.com';
      process.env.CLIENT_URL = 'http://localhost:3000';

      const response = await request(app)
        .post('/api/user/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.message).toBe('If an account with that email exists, we have sent a password reset link.');

      // Verify reset token was generated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordResetToken).toBeTruthy();
      expect(updatedUser.passwordResetExpiry).toBeTruthy();
    });

    test('should return success message for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/user/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toBe('If an account with that email exists, we have sent a password reset link.');
    });

    test('should reject request with invalid email format', async () => {
      const response = await request(app)
        .post('/api/user/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.message).toBe('Invalid email format');
    });

    test('should reject request without email', async () => {
      const response = await request(app)
        .post('/api/user/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Email is required');
    });
  });

  describe('POST /reset-password', () => {
    test('should reset password with valid token', async () => {
      // Set up user with reset token
      const resetToken = 'valid-reset-token';
      const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      testUser.passwordResetToken = resetToken;
      testUser.passwordResetExpiry = resetExpiry;
      await testUser.save();

      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          token: resetToken,
          newPassword: newPassword
        })
        .expect(200);

      expect(response.body.message).toBe('Password has been reset successfully. You can now log in with your new password.');

      // Verify password was changed and tokens cleared
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordResetToken).toBeUndefined();
      expect(updatedUser.passwordResetExpiry).toBeUndefined();

      // Verify new password works
      const validPassword = await updatedUser.comparePassword(newPassword);
      expect(validPassword).toBe(true);
    });

    test('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired password reset token');
    });

    test('should reject reset with expired token', async () => {
      // Set up user with expired reset token
      const resetToken = 'expired-reset-token';
      const expiredDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      
      testUser.passwordResetToken = resetToken;
      testUser.passwordResetExpiry = expiredDate;
      await testUser.save();

      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired password reset token');
    });

    test('should reject reset with weak password', async () => {
      const resetToken = 'valid-reset-token';
      const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);
      
      testUser.passwordResetToken = resetToken;
      testUser.passwordResetExpiry = resetExpiry;
      await testUser.save();

      const response = await request(app)
        .post('/api/user/reset-password')
        .send({
          token: resetToken,
          newPassword: 'weak'
        })
        .expect(400);

      expect(response.body.message).toContain('Password must be at least 8 characters long');
    });

    test('should reject reset without token or password', async () => {
      const response = await request(app)
        .post('/api/user/reset-password')
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Token and new password are required');
    });
  });

  describe('GET /verify-reset-token/:token', () => {
    test('should validate valid reset token', async () => {
      const resetToken = 'valid-reset-token';
      const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);
      
      testUser.passwordResetToken = resetToken;
      testUser.passwordResetExpiry = resetExpiry;
      await testUser.save();

      const response = await request(app)
        .get(`/api/user/verify-reset-token/${resetToken}`)
        .expect(200);

      expect(response.body.message).toBe('Token is valid');
      expect(response.body.valid).toBe(true);
      expect(response.body.email).toBe(testUser.email);
    });

    test('should reject invalid reset token', async () => {
      const response = await request(app)
        .get('/api/user/verify-reset-token/invalid-token')
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired password reset token');
      expect(response.body.valid).toBe(false);
    });

    test('should reject expired reset token', async () => {
      const resetToken = 'expired-reset-token';
      const expiredDate = new Date(Date.now() - 60 * 1000);
      
      testUser.passwordResetToken = resetToken;
      testUser.passwordResetExpiry = expiredDate;
      await testUser.save();

      const response = await request(app)
        .get(`/api/user/verify-reset-token/${resetToken}`)
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired password reset token');
      expect(response.body.valid).toBe(false);
    });
  });
}); 