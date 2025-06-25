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

    console.log('📝 Registration attempt for email:', email);

    // Validate email format
    if (!isValidEmail(email)) {
        console.log('❌ Registration failed - invalid email format:', email);
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    if (!isValidPassword(password)) {
        console.log('❌ Registration failed - weak password for email:', email);
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
    }

    const matchingUser = await User.findOne({ email });

    if (matchingUser) {
        console.log('❌ Registration failed - user already exists:', email);
        return res.status(409).json({ message: 'User is already registered' });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    console.log('🔑 Generated verification token for user:', email);

    // Create user with verification token (not verified yet)
    const newUser = new User({ 
        name, 
        email, 
        password,
        verificationToken
    });
    await newUser.save();

    console.log('👤 New user created with ID:', newUser._id);

    // Send verification email
    try {
        await sendVerificationEmail(email, verificationToken, name);
        
        console.log('✅ Registration successful - verification email sent to:', email);
        
        return res.json({
            message: 'Registration successful! Please check your email to verify your account.',
            userId: newUser._id
        });
    } catch (error) {
        console.error('❌ Registration failed - email sending error for:', email, error);
        // Remove user if email fails to send
        await User.findByIdAndDelete(newUser._id);
        console.log('🗑️ Cleaned up user record due to email failure:', newUser._id);
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

    console.log('📧 Email verification attempt with token:', token?.substring(0, 8) + '...');

    if (!token) {
        console.log('❌ Email verification failed - no token provided');
        return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
        console.log('❌ Email verification failed - invalid token:', token?.substring(0, 8) + '...');
        return res.status(400).json({ message: 'Invalid verification token' });
    }

    if (user.isVerified) {
        console.log('❌ Email verification failed - already verified for email:', user.email);
        return res.status(400).json({ message: 'Email is already verified' });
    }

    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined; // Remove the token once used
    await user.save();

    console.log('✅ Email verified successfully for user:', user.email, 'ID:', user._id);

    // Generate JWT token and log the user in
    const jwtToken = generateToken(user);
    const isAdmin = checkIfEmailIsAdmin(user.email);

    console.log('🔐 JWT token generated and user logged in after verification:', user.email);

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

    console.log('🔄 Resend verification request for email:', email);

    if (!email) {
        console.log('❌ Resend verification failed - no email provided');
        return res.status(400).json({ message: 'Email is required' });
    }

    if (!isValidEmail(email)) {
        console.log('❌ Resend verification failed - invalid email format:', email);
        return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        console.log('❌ Resend verification failed - user not found:', email);
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
        console.log('❌ Resend verification failed - email already verified:', email);
        return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();

    console.log('🔑 Generated new verification token for user:', email);

    // Update user with new token
    user.verificationToken = verificationToken;
    await user.save();

    try {
        await sendVerificationEmail(email, verificationToken, user.name);
        
        console.log('✅ Verification email resent successfully to:', email);
        
        return res.json({
            message: 'Verification email sent! Please check your inbox.'
        });
    } catch (error) {
        console.error('❌ Resend verification failed - email sending error for:', email, error);
        return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
}));

router.post('/forgot-password', wrapAsync(async (req, res) => {
    const { email } = req.body;

    console.log('🔐 Password reset request for email:', email);

    if (!email) {
        console.log('❌ Password reset failed - no email provided');
        return res.status(400).json({ message: 'Email is required' });
    }

    if (!isValidEmail(email)) {
        console.log('❌ Password reset failed - invalid email format:', email);
        return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findOne({ email });

    // Always return success message to prevent email enumeration attacks
    if (!user) {
        console.log('⚠️ Password reset request for non-existent email (security):', email);
        return res.json({ 
            message: 'If an account with that email exists, we have sent a password reset link.' 
        });
    }

    // Generate password reset token
    const resetToken = generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    console.log('🔑 Generated password reset token for user:', email, 'Expires at:', resetTokenExpiry);

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetTokenExpiry;
    await user.save();

    try {
        await sendPasswordResetEmail(email, resetToken, user.name);
        console.log('✅ Password reset email sent successfully to:', email);
        return res.json({
            message: 'If an account with that email exists, we have sent a password reset link.'
        });
    } catch (error) {
        console.error('❌ Password reset email failed for:', email, error);
        // Clear the token if email fails
        user.passwordResetToken = undefined;
        user.passwordResetExpiry = undefined;
        await user.save();
        console.log('🗑️ Cleared password reset token due to email failure for:', email);
        
        return res.status(500).json({ 
            message: 'Failed to send password reset email. Please try again.' 
        });
    }
}));

router.post('/reset-password', wrapAsync(async (req, res) => {
    const { token, newPassword } = req.body;

    console.log('🔄 Password reset attempt with token:', token?.substring(0, 8) + '...');

    if (!token || !newPassword) {
        console.log('❌ Password reset failed - missing token or password');
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Validate new password strength
    if (!isValidPassword(newPassword)) {
        console.log('❌ Password reset failed - weak password for token:', token?.substring(0, 8) + '...');
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
    }

    const user = await User.findOne({ 
        passwordResetToken: token,
        passwordResetExpiry: { $gt: new Date() } // Check if token hasn't expired
    });

    if (!user) {
        console.log('❌ Password reset failed - invalid or expired token:', token?.substring(0, 8) + '...');
        return res.status(400).json({ 
            message: 'Invalid or expired password reset token' 
        });
    }

    console.log('✅ Password reset successful for user:', user.email);

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    console.log('🔐 Password updated and reset tokens cleared for user:', user.email);

    // Log the user out of all sessions for security
    // Note: This would require additional session management if you want to invalidate all sessions

    return res.json({
        message: 'Password has been reset successfully. You can now log in with your new password.'
    });
}));

router.get('/verify-reset-token/:token', wrapAsync(async (req, res) => {
    const { token } = req.params;

    console.log('🔍 Password reset token validation for token:', token?.substring(0, 8) + '...');

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpiry: { $gt: new Date() }
    });

    if (!user) {
        console.log('❌ Password reset token validation failed - invalid or expired token:', token?.substring(0, 8) + '...');
        return res.status(400).json({ 
            message: 'Invalid or expired password reset token',
            valid: false 
        });
    }

    console.log('✅ Password reset token validated successfully for user:', user.email);

    return res.json({ 
        message: 'Token is valid',
        valid: true,
        email: user.email // Optional: to show which email the reset is for
    });
}));

export default router;