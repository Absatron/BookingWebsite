import { User } from '../../server/models.js';
import mongoose from 'mongoose';

// Create a test user
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
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
    password: process.env.ADMIN_PASSWORD || 'admin123'
  };

  const admin = new User({
    ...defaultAdmin,
    ...userData
  });

  await admin.save();
  return admin;
};

// Generate MongoDB ObjectId
export const generateObjectId = () => new mongoose.Types.ObjectId();

// Helper to extract response data
export const getResponseData = (response) => response.body; 