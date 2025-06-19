import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
    // Configure your email service (Gmail, SendGrid, etc.)
    service: 'gmail', // You can change this to your preferred email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate a simple verification token
export const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send verification email to user
export const sendVerificationEmail = async (email, token, name) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome ${name}!</h2>
                <p>Thank you for registering. Please click the link below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #007cba; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    If you didn't create an account, please ignore this email.
                </p>
                <p style="color: #666; font-size: 14px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}">${verificationUrl}</a>
                </p>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
};
