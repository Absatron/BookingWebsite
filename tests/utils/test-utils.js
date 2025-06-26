import { User, Booking } from '../../server/models.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Create a test user
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    isVerified: true
  };

  const user = new User({
    ...defaultUser,
    ...userData
  });

  await user.save();
  return user;
};

// Create a test admin user
export const createTestAdmin = async (userData = {}) => {
  const defaultAdmin = {
    name: 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    isVerified: true
  };

  const admin = new User({
    ...defaultAdmin,
    ...userData
  });

  await admin.save();
  return admin;
};

// Create a test booking
export const createTestBooking = async (bookingData = {}) => {
  const defaultBooking = {
    date: new Date('2025-07-01'),
    startTime: '10:00',
    endTime: '11:00',
    price: 50,
    stripePriceId: 'price_test_50',
    status: 'available'
  };

  const booking = new Booking({
    ...defaultBooking,
    ...bookingData
  });

  await booking.save();
  return booking;
};

// Generate MongoDB ObjectId
export const generateObjectId = () => new mongoose.Types.ObjectId();

// Helper to extract response data
export const getResponseData = (response) => response.body;

// Hash password for testing
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Generate verification token for testing
export const generateTestToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}; 