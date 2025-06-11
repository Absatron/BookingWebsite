import express from 'express';
import { wrapAsync } from '../utils/error-utils.js';
import { User } from '../models.js';
import dotenv from 'dotenv';
import { checkIfEmailIsAdmin } from '../utils/auth-utils.js';

dotenv.config();

const router = express.Router();

// Email validation function
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password validation function
const isValidPassword = (password) => {
    // At least 8 characters long
    // Contains at least one uppercase letter
    // Contains at least one lowercase letter
    // Contains at least one number
    // Contains at least one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

router.post('/register', wrapAsync(async (req, res) => {
    const { name, email, password } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    if (!isValidPassword(password)) {
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
        });
    }

    const matchingUser = await User.findOne({ email });

    if (matchingUser) {
        return res.status(409).json({ message: 'User is already registered' });
    }
    // Proceed to register
    const newUser = new User({ name, email, password });
    await newUser.save();
    const isAdmin = checkIfEmailIsAdmin(email);

    req.session.regenerate((err) => {
        if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ message: 'Session error' });
        }
        
        req.session.user_id = newUser._id;
        req.session.admin = isAdmin;

        return res.json({
            userId: newUser._id,
            email: newUser.email,
            name: newUser.name, 
            isAdmin,
        });
    });
}));

router.post('/login', wrapAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isAdmin = checkIfEmailIsAdmin(email);

    // 🔒 Regenerate session to prevent fixation
    req.session.regenerate((err) => {
        if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ message: 'Session error' });
        }

        req.session.user_id = user._id;
        req.session.admin = isAdmin;

        console.log('Session:', req.session);

        return res.json({
            userId: user._id,
            email: user.email,
            name: user.name, 
            isAdmin,
        });
    });
}));

router.get('/validate-session', wrapAsync(async (req, res) => {
    const userId = req.session.user_id;
    
    if (!userId) {
        // session expired or not created
        return res.status(401).json({ message: 'No active session' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }
    
    const isAdmin = checkIfEmailIsAdmin(user.email);
    
    return res.json({
        userId: user._id,
        email: user.email,
        name: user.name,
        isAdmin,
    });
}));


router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid'); // Optional: explicitly clear session cookie
      return res.json({ message: 'User was successfully logged out' });
    });
  });
  

export default router;