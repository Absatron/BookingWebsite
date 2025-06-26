import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Use a separate test database
const TEST_DB_URI = process.env.TEST_DB_URI || 'mongodb://127.0.0.1:27017/bookingApp_test';

// Connect to test database
export const connectDB = async () => {
  try {
    // Use optimized settings for tests
    const testOptions = {
      maxPoolSize: 1, // Minimize connections for tests
      serverSelectionTimeoutMS: 2000, // Shorter timeout for tests
      socketTimeoutMS: 10000, // Shorter socket timeout
    };
    
    await mongoose.connect(TEST_DB_URI, testOptions);
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
  
  // Use Promise.all to clear collections in parallel for better performance
  const clearPromises = Object.keys(collections).map(async (key) => {
    const collection = collections[key];
    try {
      // Use deleteMany instead of drop to maintain indexes and schema
      await collection.deleteMany({});
    } catch (error) {
      // If deleteMany fails, try drop as fallback
      if (error.code === 26) {
        // NamespaceNotFound - collection doesn't exist, ignore
        return;
      }
      throw error;
    }
  });
  
  await Promise.all(clearPromises);
}; 