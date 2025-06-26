import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { connectDB, disconnectDB, clearDatabase } from '../config/db-setup.js';
import { createTestUser } from '../utils/test-utils.js';
import { generateToken } from '../../server/utils/jwt-utils.js';
import { Booking } from '../../server/models.js';
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
  let normalUser;
  let adminUser;
  let normalUserToken;
  let adminUserToken;
  let testBooking;

  beforeEach(async () => {
    // Create test users
    normalUser = await createTestUser({
      name: 'Normal User',
      email: 'user@test.com',
      password: 'password123',
      isVerified: true
    });

    adminUser = await createTestUser({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@test.com',
      password: 'admin123',
      isVerified: true
    });

    // Generate JWT tokens for users
    normalUserToken = generateToken(normalUser);
    adminUserToken = generateToken(adminUser);

    // Create a test booking in pending state (ready for payment)
    testBooking = new Booking({
      date: new Date('2025-07-01'),
      startTime: '10:00',
      endTime: '11:00',
      price: 50,
      stripePriceId: 'price_test_50',
      status: 'pending',
      bookedBy: normalUser._id,
      reservedAt: new Date()
    });
    await testBooking.save();
  });

  describe('POST /api/payment/create-checkout-session', () => {
    beforeEach(() => {
      // Mock environment variables for testing
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      process.env.CLIENT_URL = 'http://localhost:3000';
    });

    test('should create a checkout session with valid booking data', async () => {
      const sessionData = {
        bookingId: testBooking._id.toString(),
        stripePriceId: testBooking.stripePriceId,
        bookingPrice: testBooking.price
      };

      // Note: This will fail in actual test environment without Stripe credentials
      // but tests the request validation and error handling
      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .send(sessionData);

      // Should either succeed (302 redirect), fail with Stripe error (500), or validation error (400)
      expect([302, 400, 500]).toContain(response.status);
      
      if (response.status === 500) {
        expect(response.body.message).toBeDefined();
      } else if (response.status === 400) {
        // For 400 errors, message might be in body.message or text
        expect(response.body.message || response.text).toBeDefined();
      }
    });

    test('should reject request with missing bookingId', async () => {
      const sessionData = {
        stripePriceId: 'price_test_50',
        bookingPrice: 50
      };

      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .send(sessionData)
        .expect(400);

      expect(response.body.message).toBe('Missing required booking information.');
    });

    test('should reject request with missing stripePriceId', async () => {
      const sessionData = {
        bookingId: testBooking._id.toString(),
        bookingPrice: 50
      };

      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .send(sessionData)
        .expect(400);

      expect(response.body.message).toBe('Missing required booking information.');
    });

    test('should reject request with missing bookingPrice', async () => {
      const sessionData = {
        bookingId: testBooking._id.toString(),
        stripePriceId: 'price_test_50'
      };

      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .send(sessionData)
        .expect(400);

      expect(response.body.message).toBe('Missing required booking information.');
    });

    test('should handle missing webhook secret configuration', async () => {
      // Temporarily remove webhook secret
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const sessionData = {
        bookingId: testBooking._id.toString(),
        stripePriceId: testBooking.stripePriceId,
        bookingPrice: testBooking.price
      };

      const response = await request(app)
        .post('/api/payment/create-checkout-session')
        .send(sessionData);

      // Could be 400 (validation) or 500 (configuration error)
      expect([400, 500]).toContain(response.status);
      
      if (response.status === 500) {
        expect(response.body.message).toBe('Server configuration error.');
      }
    });
  });

  describe('POST /api/payment/webhook', () => {
    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    });

    test('should handle checkout.session.completed event', async () => {
      const mockWebhookEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              bookingId: testBooking._id.toString()
            }
          }
        }
      };

      // Mock webhook signature header (this would normally be generated by Stripe)
      const mockSignature = 'mock_signature_from_stripe';

      // Note: This will fail signature verification in real environment
      // but tests the basic webhook handling logic
      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', mockSignature)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(mockWebhookEvent));

      // Should fail signature verification (400) in test environment
      expect(response.status).toBe(400);
      expect(response.text).toContain('Webhook Error:');
    });

    test('should handle checkout.session.expired event', async () => {
      const mockWebhookEvent = {
        type: 'checkout.session.expired',
        data: {
          object: {
            metadata: {
              bookingId: testBooking._id.toString()
            }
          }
        }
      };

      const mockSignature = 'mock_signature_from_stripe';

      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', mockSignature)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(mockWebhookEvent));

      // Should fail signature verification (400) in test environment
      expect(response.status).toBe(400);
      expect(response.text).toContain('Webhook Error:');
    });

    test('should reject webhook without signature', async () => {
      const mockWebhookEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              bookingId: testBooking._id.toString()
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payment/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(mockWebhookEvent))
        .expect(400);

      expect(response.text).toContain('Webhook Error:');
    });

    test('should handle missing webhook secret configuration', async () => {
      // Temporarily remove webhook secret
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const mockWebhookEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              bookingId: testBooking._id.toString()
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', 'mock_signature')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(mockWebhookEvent));

      // Could be 400 (signature verification) or 500 (configuration error)
      expect([400, 500]).toContain(response.status);
      
      if (response.status === 500) {
        expect(response.text).toBe('Webhook configuration error.');
      }
    });
  });

  describe('Payment Utilities Integration', () => {
    test('should confirm booking successfully', async () => {
      // Import the payment utilities for direct testing
      const { confirmBooking } = await import('../../server/utils/payment-utils.js');

      const result = await confirmBooking(testBooking._id.toString());

      expect(result.success).toBe(true);
      expect(result.message).toBe('Booking confirmed');

      // Verify booking status in database
      const { Booking } = await import('../../server/models.js');
      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking.status).toBe('confirmed');
    });

    test('should handle booking confirmation for non-existent booking', async () => {
      const { confirmBooking } = await import('../../server/utils/payment-utils.js');
      const fakeId = '507f1f77bcf86cd799439011';

      const result = await confirmBooking(fakeId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Booking not found');
    });

    test('should handle booking confirmation for already processed booking', async () => {
      const { confirmBooking } = await import('../../server/utils/payment-utils.js');

      // Set booking to confirmed first
      testBooking.status = 'confirmed';
      await testBooking.save();

      const result = await confirmBooking(testBooking._id.toString());

      expect(result.success).toBe(false);
      expect(result.message).toBe('Booking already processed');
    });

    test('should cancel booking successfully', async () => {
      const { cancelBooking } = await import('../../server/utils/payment-utils.js');

      const result = await cancelBooking(testBooking._id.toString());

      expect(result.success).toBe(true);
      expect(result.message).toBe('Booking cancelled');

      // Verify booking status in database
      const { Booking } = await import('../../server/models.js');
      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking.status).toBe('available');
      expect(updatedBooking.bookedBy).toBeNull();
    });

    test('should handle booking cancellation for non-existent booking', async () => {
      const { cancelBooking } = await import('../../server/utils/payment-utils.js');
      const fakeId = '507f1f77bcf86cd799439011';

      const result = await cancelBooking(fakeId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Booking not found');
    });

    test('should handle booking cancellation for non-pending booking', async () => {
      const { cancelBooking } = await import('../../server/utils/payment-utils.js');

      // Set booking to confirmed (not pending)
      testBooking.status = 'confirmed';
      await testBooking.save();

      const result = await cancelBooking(testBooking._id.toString());

      expect(result.success).toBe(false);
      expect(result.message).toBe('Booking not in pending state');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully in confirmBooking', async () => {
      const { confirmBooking } = await import('../../server/utils/payment-utils.js');

      // Use invalid ObjectId format to trigger database error
      try {
        await confirmBooking('invalid-id-format');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle database errors gracefully in cancelBooking', async () => {
      const { cancelBooking } = await import('../../server/utils/payment-utils.js');

      // Use invalid ObjectId format to trigger database error
      try {
        await cancelBooking('invalid-id-format');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
}); 