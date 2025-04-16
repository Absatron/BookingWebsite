import { User } from '../../server/models.js';
import { connectDB, disconnectDB, clearDatabase } from '../config/db-setup.js';

// Setup database connection
beforeAll(async () => {
  await connectDB();
});

// Clear database between tests
beforeEach(async () => {
  await clearDatabase();
});

// Disconnect after all tests
afterAll(async () => {
  await disconnectDB();
});

describe('User Model', () => {
  test('should create a new user successfully', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    // Password should be hashed, so it shouldn't match the original
    expect(savedUser.password).not.toBe(userData.password);
  });

  test('should fail to create a user without required fields', async () => {
    const user = new User({});
    
    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  test('should fail to create a user with an invalid email', async () => {
    const userData = {
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123'
    };

    const user = new User(userData);
    
    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  test('should correctly compare passwords', async () => {
    const password = 'password123';
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password
    };

    const user = new User(userData);
    await user.save();

    const isPasswordValid = await user.comparePassword(password);
    const isInvalidPassword = await user.comparePassword('wrongpassword');

    expect(isPasswordValid).toBe(true);
    expect(isInvalidPassword).toBe(false);
  });
}); 