// Test script for email functionality
// Run with: node test-email.js

import dotenv from 'dotenv';
import { sendBookingConfirmationEmail, testEmailConfiguration } from '../server/utils/email-service.js';

dotenv.config();

async function testEmail() {
    console.log('🧪 Testing email configuration...\n');
    
    // Test configuration
    const configTest = await testEmailConfiguration();
    console.log('Configuration test:', configTest.success ? '✅ PASSED' : '❌ FAILED');
    if (!configTest.success) {
        console.log('Error:', configTest.message);
        return;
    }
    
    // Test sending an email
    console.log('\n📧 Testing email sending...');
    try {
        const testBookingDetails = {
            bookingId: '507f1f77bcf86cd799439011', // Example ObjectId
            date: new Date('2025-06-25'),
            startTime: '10:00 AM',
            endTime: '11:00 AM',
            price: 25.00
        };
        
        await sendBookingConfirmationEmail(
            'test@example.com', // Replace with your test email
            'Test User',
            testBookingDetails
        );
        
        console.log('✅ Test email sent successfully!');
        console.log('Check your inbox at: test@example.com');
        
    } catch (error) {
        console.log('❌ Failed to send test email:', error.message);
    }
}

// Run the test
testEmail().then(() => {
    console.log('\n🏁 Email test completed');
    process.exit(0);
}).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
