import express from 'express';
import { wrapAsync } from '../utils/error-utils.js';
import { User } from '../models.js';
import dotenv from 'dotenv';
import { checkIfEmailIsAdmin } from '../utils/auth-utils.js';
import { generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail } from '../utils/email-service.js';
import { generateToken, authenticateToken } from '../utils/jwt-utils.js';

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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
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
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
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

    // Generate JWT token instead of session
    const token = generateToken(user);
    const isAdmin = checkIfEmailIsAdmin(email);

    console.log('✅ User logged in successfully with JWT:', user._id);
    console.log('   Token generated for user:', user.email);

    return res.json({
        token,
        userId: user._id,
        email: user.email,
        name: user.name, 
        isAdmin,
    });
}));

router.get('/validate-token', authenticateToken, wrapAsync(async (req, res) => {
    // If we reach here, the token is valid (middleware already checked)
    console.log('✅ Token validation successful for user:', req.user.email);
    
    return res.json({
        userId: req.user.userId,
        email: req.user.email,
        name: req.user.name,
        isAdmin: req.user.isAdmin,
    });
}));


router.post('/logout', (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    // Server doesn't need to do anything since JWT is stateless
    console.log('✅ User logout request processed (JWT is stateless)');
    return res.json({ message: 'Logged out successfully' });
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

    // Generate JWT token and log the user in
    const jwtToken = generateToken(user);
    const isAdmin = checkIfEmailIsAdmin(user.email);

    console.log('✅ Email verified and user logged in with JWT:', user._id);

    return res.json({
        message: 'Email verified successfully! You are now logged in.',
        token: jwtToken,
        userId: user._id,
        email: user.email,
        name: user.name,
        isAdmin
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

router.post('/forgot-password', wrapAsync(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findOne({ email });

    // Always return success message to prevent email enumeration attacks
    if (!user) {
        return res.json({ 
            message: 'If an account with that email exists, we have sent a password reset link.' 
        });
    }

    // Generate password reset token
    const resetToken = generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetTokenExpiry;
    await user.save();

    try {
        await sendPasswordResetEmail(email, resetToken, user.name);
        
        return res.json({
            message: 'If an account with that email exists, we have sent a password reset link.'
        });
    } catch (error) {
        console.error('Password reset email failed:', error);
        // Clear the token if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        await user.save();
        
        return res.status(500).json({ 
            message: 'Failed to send password reset email. Please try again.' 
        });
    }
}));

router.post('/reset-password', wrapAsync(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    console.log('Resetting password with token:', token);

    // Validate new password strength
    if (!isValidPassword(newPassword)) {
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
    }

    const user = await User.findOne({ 
        passwordResetToken: token,
        passwordResetExpiry: { $gt: new Date() } // Check if token hasn't expired
    });

    if (!user) {
        return res.status(400).json({ 
            message: 'Invalid or expired password reset token' 
        });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    // Log the user out of all sessions for security
    // Note: This would require additional session management if you want to invalidate all sessions

    return res.json({
        message: 'Password has been reset successfully. You can now log in with your new password.'
    });
}));

router.get('/verify-reset-token/:token', wrapAsync(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpiry: { $gt: new Date() }
    });

    if (!user) {
        return res.status(400).json({ 
            message: 'Invalid or expired password reset token',
            valid: false 
        });
    }

    return res.json({ 
        message: 'Token is valid',
        valid: true,
        email: user.email // Optional: to show which email the reset is for
    });
}));

export default router;