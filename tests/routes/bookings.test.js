import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import { connectDB, disconnectDB, clearDatabase } from '../config/db-setup.js';
import { createTestUser, createTestAdmin } from '../utils/test-utils.js';
import { generateToken } from '../../server/utils/jwt-utils.js';
import { Booking } from '../../server/models.js';
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

    adminUser = await createTestAdmin({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@test.com',
      password: 'admin123',
      isVerified: true
    });

    // Generate JWT tokens for users
    normalUserToken = generateToken(normalUser);
    adminUserToken = generateToken(adminUser);

    // Create a test booking
    testBooking = new Booking({
      date: new Date('2025-07-01'),
      startTime: '10:00',
      endTime: '11:00',
      price: 50,
      stripePriceId: 'price_test_50',
      status: 'available'
    });
    await testBooking.save();
  });

  describe('GET /api/bookings', () => {
    test('should return all bookings sorted by date and time', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      expect(response.body).toHaveProperty('bookings');
      expect(Array.isArray(response.body.bookings)).toBe(true);
      expect(response.body.bookings.length).toBeGreaterThan(0);
      expect(response.body.bookings[0]).toHaveProperty('id');
      expect(response.body.bookings[0]).toHaveProperty('date');
      expect(response.body.bookings[0]).toHaveProperty('startTime');
      expect(response.body.bookings[0]).toHaveProperty('endTime');
      expect(response.body.bookings[0]).toHaveProperty('price');
      expect(response.body.bookings[0]).toHaveProperty('status');
    });

    test('should return empty array when no bookings exist', async () => {
      await clearDatabase();
      
      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      expect(response.body.bookings).toEqual([]);
    });
  });

  describe('POST /api/bookings', () => {
    test('should create a new booking when admin authenticated', async () => {
      const bookingData = {
        date: '2025-07-15',
        startTime: '14:00',
        endTime: '15:00',
        price: 75
      };

      // Mock the Stripe price ID environment variable
      process.env.STRIPE_PRICE_ID_75 = 'price_test_75';

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.message).toBe('Time slot created successfully');
      expect(response.body.booking).toHaveProperty('id');
      expect(response.body.booking.price).toBe(75);
      expect(response.body.booking.status).toBe('available');
    });

    test('should reject booking creation without admin rights', async () => {
      const bookingData = {
        date: '2025-07-15',
        startTime: '14:00',
        endTime: '15:00',
        price: 75
      };

      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send(bookingData)
        .expect(403);
    });

    test('should reject booking creation without authentication', async () => {
      const bookingData = {
        date: '2025-07-15',
        startTime: '14:00',
        endTime: '15:00',
        price: 75
      };

      await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(401);
    });

    test('should reject booking with invalid data', async () => {
      const invalidBookingData = {
        date: 'invalid-date',
        startTime: '25:00',
        endTime: '26:00',
        price: -10
      };

      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(invalidBookingData)
        .expect(400);
    });

    test('should reject booking with missing price', async () => {
      const bookingData = {
        date: '2025-07-15',
        startTime: '14:00',
        endTime: '15:00'
      };

      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send(bookingData)
        .expect(400);
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    test('should delete an available booking when admin authenticated', async () => {
      const response = await request(app)
        .delete(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body.message).toBe('Booking successfully deleted');
      expect(response.body.deletedBooking).toHaveProperty('_id');
    });

    test('should reject deletion without admin rights', async () => {
      await request(app)
        .delete(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(403);
    });

    test('should reject deletion of non-existent booking', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .delete(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(404);
    });

    test('should reject deletion with invalid ID format', async () => {
      await request(app)
        .delete('/api/bookings/invalid-id')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(400);
    });

    test('should reject deletion of non-available booking', async () => {
      // Set booking to pending status
      testBooking.status = 'pending';
      testBooking.bookedBy = normalUser._id;
      await testBooking.save();

      await request(app)
        .delete(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(400);
    });
  });

  describe('GET /api/bookings/confirmed', () => {
    test('should return confirmed bookings for admin', async () => {
      // Create a confirmed booking
      const confirmedBooking = new Booking({
        date: new Date('2025-07-02'),
        startTime: '09:00',
        endTime: '10:00',
        price: 60,
        stripePriceId: 'price_test_60',
        status: 'confirmed',
        bookedBy: normalUser._id
      });
      await confirmedBooking.save();

      const response = await request(app)
        .get('/api/bookings/confirmed')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].status).toBe('confirmed');
      expect(response.body[0]).toHaveProperty('bookedBy');
    });

    test('should reject access without admin rights', async () => {
      await request(app)
        .get('/api/bookings/confirmed')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(403);
    });
  });

  describe('GET /api/bookings/user', () => {
    test('should return user bookings when authenticated', async () => {
      // Create a booking for the user
      const userBooking = new Booking({
        date: new Date('2025-07-03'),
        startTime: '11:00',
        endTime: '12:00',
        price: 40,
        stripePriceId: 'price_test_40',
        status: 'confirmed',
        bookedBy: normalUser._id
      });
      await userBooking.save();

      const response = await request(app)
        .get('/api/bookings/user')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].bookedBy.toString()).toBe(normalUser._id.toString());
    });

    test('should return empty array when user has no bookings', async () => {
      const response = await request(app)
        .get('/api/bookings/user')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test('should reject access without authentication', async () => {
      await request(app)
        .get('/api/bookings/user')
        .expect(401);
    });
  });

  describe('POST /api/bookings/initiate', () => {
    test('should initiate booking for authenticated user', async () => {
      const response = await request(app)
        .post('/api/bookings/initiate')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({ bookingId: testBooking._id })
        .expect(200);

      expect(response.body.message).toBe('Booking initiated successfully.');
      expect(response.body.bookingId).toBe(testBooking._id.toString());
      expect(response.body).toHaveProperty('stripePriceId');

      // Verify booking status changed to pending
      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking.status).toBe('pending');
      expect(updatedBooking.bookedBy.toString()).toBe(normalUser._id.toString());
    });

    test('should reject initiation without bookingId', async () => {
      await request(app)
        .post('/api/bookings/initiate')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({})
        .expect(400);
    });

    test('should reject initiation of non-existent booking', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .post('/api/bookings/initiate')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({ bookingId: fakeId })
        .expect(404);
    });

    test('should reject initiation of non-available booking', async () => {
      testBooking.status = 'pending';
      await testBooking.save();

      await request(app)
        .post('/api/bookings/initiate')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({ bookingId: testBooking._id })
        .expect(409);
    });
  });

  describe('GET /api/bookings/:bookingId', () => {
    test('should return booking details for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(200);

      expect(response.body._id).toBe(testBooking._id.toString());
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('startTime');
      expect(response.body).toHaveProperty('endTime');
      expect(response.body).toHaveProperty('price');
    });

    test('should reject access with invalid booking ID', async () => {
      await request(app)
        .get('/api/bookings/invalid-id')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(400);
    });

    test('should reject access to non-existent booking', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .get(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(404);
    });
  });

  describe('POST /api/bookings/:bookingId/cancel', () => {
    test('should cancel pending booking for owner', async () => {
      // Set up booking as pending for the user
      testBooking.status = 'pending';
      testBooking.bookedBy = normalUser._id;
      testBooking.reservedAt = new Date();
      await testBooking.save();

      const response = await request(app)
        .post(`/api/bookings/${testBooking._id}/cancel`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(200);

      expect(response.body.message).toBe('Booking cancelled successfully.');
      expect(response.body.bookingId).toBe(testBooking._id.toString());

      // Verify booking status changed back to available
      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking.status).toBe('available');
      expect(updatedBooking.bookedBy).toBeNull();
    });

    test('should reject cancellation of non-pending booking', async () => {
      testBooking.status = 'confirmed';
      testBooking.bookedBy = normalUser._id;
      await testBooking.save();

      await request(app)
        .post(`/api/bookings/${testBooking._id}/cancel`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(400);
    });

    test('should reject cancellation by non-owner', async () => {
      testBooking.status = 'pending';
      testBooking.bookedBy = adminUser._id; // Different user
      await testBooking.save();

      await request(app)
        .post(`/api/bookings/${testBooking._id}/cancel`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(403);
    });

    test('should reject cancellation with invalid booking ID', async () => {
      await request(app)
        .post('/api/bookings/invalid-id/cancel')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(400);
    });
  });

  describe('GET /api/bookings/:bookingId/receipt', () => {
    test('should download receipt for booking owner', async () => {
      // Set up booking as confirmed for the user
      testBooking.status = 'confirmed';
      testBooking.bookedBy = normalUser._id;
      await testBooking.save();

      const response = await request(app)
        .get(`/api/bookings/${testBooking._id}/receipt`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(`receipt-${testBooking._id}.pdf`);
    });

    test('should reject receipt download by non-owner', async () => {
      testBooking.status = 'confirmed';
      testBooking.bookedBy = adminUser._id; // Different user
      await testBooking.save();

      await request(app)
        .get(`/api/bookings/${testBooking._id}/receipt`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(403);
    });

    test('should reject receipt download for non-existent booking', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .get(`/api/bookings/${fakeId}/receipt`)
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(404);
    });

    test('should reject receipt download with invalid booking ID', async () => {
      await request(app)
        .get('/api/bookings/invalid-id/receipt')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .expect(400);
    });
  });
}); 