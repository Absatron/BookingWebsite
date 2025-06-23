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

// Send booking confirmation email to user
export const sendBookingConfirmationEmail = async (email, name, bookingDetails) => {
    const { bookingId, date, startTime, endTime, price } = bookingDetails;
    const bookingReference = `BK-${bookingId.toString().slice(-6).toUpperCase()}`;
    
    // Format date for display
    const bookingDate = new Date(date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Booking Confirmation - Your Appointment is Confirmed',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background-color: #22c55e; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">✅ Booking Confirmed!</h1>
                    </div>
                </div>
                
                <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Great news! Your booking has been confirmed and payment has been processed successfully.
                    </p>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">Booking Details</h3>
                        
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #374151;">Booking Reference:</strong>
                            <span style="color: #1e40af; font-weight: bold; font-size: 18px;">${bookingReference}</span>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #374151;">📅 Date:</strong>
                            <span style="color: #111827;">${formattedDate}</span>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #374151;">🕐 Time:</strong>
                            <span style="color: #111827;">${startTime} - ${endTime}</span>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #374151;">💰 Amount Paid:</strong>
                            <span style="color: #111827;">$${price.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                        <h4 style="color: #1e40af; margin-top: 0;">Important Information:</h4>
                        <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                            <li>Please save this email for your records</li>
                            <li>Use your booking reference number: <strong>${bookingReference}</strong></li>
                            <li>Arrive 5-10 minutes before your scheduled time</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL}/my-bookings" 
                           style="background-color: #3b82f6; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;
                                  font-weight: bold;">
                            View My Bookings
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        If you need to make any changes or have questions, please contact us as soon as possible.
                    </p>
                    
                    <p style="color: #666; font-size: 14px;">
                        Thank you for choosing our services!
                    </p>
                </div>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

// Send password reset email to user
export const sendPasswordResetEmail = async (email, token, name) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">🔒 Password Reset Request</h1>
                    </div>
                </div>
                
                <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">Hello ${name}!</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        We received a request to reset your password. Click the button below to create a new password:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #dc2626; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;
                                  font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <h4 style="color: #92400e; margin-top: 0;">⚠️ Important Security Information:</h4>
                        <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px;">
                            <li>This link will expire in <strong>15 minutes</strong></li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>Never share this link with anyone</li>
                        </ul>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">
                        <a href="${resetUrl}">${resetUrl}</a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        If you continue to have problems, please contact our support team.
                    </p>
                </div>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

// Test email configuration
export const testEmailConfiguration = async () => {
    try {
        // Verify transporter configuration
        await transporter.verify();
        console.log('✅ Email service is configured correctly');
        return { success: true, message: 'Email service ready' };
    } catch (error) {
        console.error('❌ Email service configuration error:', error);
        return { success: false, message: error.message };
    }
};
