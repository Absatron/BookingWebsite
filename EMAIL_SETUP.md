# Email Confirmation Setup Guide

## Overview

The booking system now automatically sends confirmation emails to users when their bookings are confirmed after successful payment. This document explains how to set up and configure the email service.

## Implementation Details

### What Was Added

1. **Booking Confirmation Email Function** (`email-service.js`)

   - Professional HTML email template with booking details
   - Includes booking reference, date, time, and payment amount
   - Responsive design with clear call-to-action

2. **Webhook Integration** (`payment.js`)

   - Automatically sends confirmation email when Stripe webhook confirms payment
   - Graceful error handling - email failures don't affect booking confirmation
   - Populates booking with user details for email sending

3. **Email Configuration Testing**

   - Server startup verification of email service configuration
   - Clear logging of email service status
   - Non-blocking - server starts even if email is not configured

4. **Frontend Updates** (`BookingConfirmation.tsx`)
   - Updated confirmation message to indicate email will be sent
   - Professional booking reference display

## Email Configuration

### Required Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration (Required for booking confirmations)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:8080
```

### Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:

   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASS`

3. **Configure Environment Variables**:
   ```bash
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-character-app-password
   CLIENT_URL=http://localhost:8080
   ```

### Alternative Email Providers

For other email services, modify the transporter configuration in `email-service.js`:

#### SendGrid

```javascript
const transporter = nodemailer.createTransporter({
  service: "SendGrid",
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});
```

#### Outlook/Hotmail

```javascript
const transporter = nodemailer.createTransporter({
  service: "hotmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

## Email Template Features

The booking confirmation email includes:

- ✅ Professional header with confirmation status
- 📧 Personalized greeting with user's name
- 📋 Complete booking details in a formatted table
- 🔢 Unique booking reference number
- 📅 Formatted date and time information
- 💰 Payment amount confirmation
- 🔗 Direct link to "My Bookings" page
- 📝 Important instructions and reminders

## Testing Email Configuration

### Server Startup Test

When you start the server, you'll see one of these messages:

```bash
✅ Email service configuration verified
```

or

```bash
⚠️  Email service not configured or has issues: [error message]
   Booking confirmations will not be sent via email
```

### Manual Test Function

You can test email sending by importing and calling the test function:

```javascript
import { testEmailConfiguration } from "./utils/email-service.js";

// Test email configuration
testEmailConfiguration().then((result) => {
  console.log(
    result.success ? "Email working!" : "Email error:",
    result.message
  );
});
```

## Email Flow

1. **User completes payment** through Stripe checkout
2. **Stripe webhook fires** `checkout.session.completed` event
3. **Booking status updated** to 'confirmed' in database
4. **User details fetched** via populated `bookedBy` field
5. **Confirmation email sent** with booking details
6. **User receives email** with booking reference and details

## Error Handling

- Email failures are logged but don't prevent booking confirmation
- Missing email configuration is detected and logged
- Server continues to function even without email service
- Users still see confirmation page regardless of email status

## Customization

### Email Template

Modify the HTML template in `sendBookingConfirmationEmail()` function to match your branding.

### Email Content

- Subject line can be customized
- Add company logo by including `<img>` tags
- Modify colors and styling
- Add additional booking terms or instructions

### Email Timing

Currently emails are sent immediately after payment confirmation. To add delays or scheduling, consider implementing a job queue system.

## Troubleshooting

### Common Issues

1. **"Invalid login" error**

   - Ensure 2FA is enabled on Gmail
   - Use App Password, not regular password
   - Check EMAIL_USER format (full email address)

2. **"Connection timeout" error**

   - Check firewall settings
   - Verify network connectivity
   - Try different email service

3. **Emails not being sent**
   - Check server logs for email-related errors
   - Verify environment variables are loaded
   - Test email configuration manually

### Debug Mode

Enable debug logging by adding to your email configuration:

```javascript
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,
  logger: true,
});
```

## Production Considerations

1. **Rate Limiting**: Gmail has sending limits (500/day for free accounts)
2. **Professional Email Service**: Consider SendGrid, Mailgun, or AWS SES for production
3. **Email Templates**: Use a template engine like Handlebars for more complex layouts
4. **Queue System**: Implement Redis/Bull for handling email sending in background
5. **Monitoring**: Add email delivery tracking and failure notifications
6. **Unsubscribe**: Add unsubscribe links for marketing compliance

## Security Notes

- Never commit email credentials to version control
- Use environment variables for all sensitive data
- Consider using OAuth2 instead of app passwords for enhanced security
- Regularly rotate email credentials
- Monitor email service logs for suspicious activity
