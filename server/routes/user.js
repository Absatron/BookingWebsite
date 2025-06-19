import express from 'express';
import { wrapAsync } from '../utils/error-utils.js';
import { User } from '../models.js';
import dotenv from 'dotenv';
import { checkIfEmailIsAdmin } from '../utils/auth-utils.js';
import { generateVerificationToken, sendVerificationEmail } from '../utils/email-service.js';

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

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user with verification token (not verified yet)
    const newUser = new User({ 
        name, 
        email, 
        password,
        verificationToken
    });
    await newUser.save();

    // Send verification email
    try {
        await sendVerificationEmail(email, verificationToken, name);
        
        return res.json({
            message: 'Registration successful! Please check your email to verify your account.',
            userId: newUser._id
        });
    } catch (error) {
        console.error('Email sending failed:', error);
        // Remove user if email fails to send
        await User.findByIdAndDelete(newUser._id);
        return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
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

    // Check if email is verified
    if (!user.isVerified) {
        return res.status(401).json({ 
            message: 'Please verify your email before logging in. Check your inbox or request a new verification email.',
            emailNotVerified: true,
            email: user.email
        });
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
  
router.post('/verify-email', wrapAsync(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
        return res.status(400).json({ message: 'Invalid verification token' });
    }

    if (user.isVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined; // Remove the token once used
    await user.save();

    const isAdmin = checkIfEmailIsAdmin(user.email);

    // Log the user in after verification
    req.session.regenerate((err) => {
        if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ message: 'Session error' });
        }
        
        req.session.user_id = user._id;
        req.session.admin = isAdmin;

        return res.json({
            message: 'Email verified successfully! You are now logged in.',
            userId: user._id,
            email: user.email,
            name: user.name,
            isAdmin
        });
    });
}));

router.post('/resend-verification', wrapAsync(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();

    // Update user with new token
    user.verificationToken = verificationToken;
    await user.save();

    try {
        await sendVerificationEmail(email, verificationToken, user.name);
        
        return res.json({
            message: 'Verification email sent! Please check your inbox.'
        });
    } catch (error) {
        console.error('Email sending failed:', error);
        return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
}));

export default router;