import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Use a separate test database
const TEST_DB_URI = process.env.TEST_DB_URI || 'mongodb://127.0.0.1:27017/bookingApp_test';

// Connect to test database
export const connectDB = async () => {
  try {
    await mongoose.connect(TEST_DB_URI);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    process.exit(1);
  }
};

// Disconnect from database
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
  }
};

// Clear all collections
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}; 