// Test script to debug cookie issues
// Run this with: node test-cookies.js

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'https://your-backend-url.com';
const CLIENT_URL = process.env.CLIENT_URL || 'https://bookingapp-gamma-orcin.vercel.app';

async function testCookieFlow() {
    console.log('🧪 Testing Cookie Flow...');
    console.log('   API URL:', API_URL);
    console.log('   Client URL:', CLIENT_URL);
    
    try {
        // Test 1: Health check
        console.log('\n1. Testing health check...');
        const healthResponse = await fetch(`${API_URL}/health`);
        console.log('   Health status:', healthResponse.status);
        
        // Test 2: CORS preflight
        console.log('\n2. Testing CORS preflight...');
        const corsResponse = await fetch(`${API_URL}/api/user/validate-session`, {
            method: 'OPTIONS',
            headers: {
                'Origin': CLIENT_URL,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        console.log('   CORS preflight status:', corsResponse.status);
        console.log('   CORS headers:', corsResponse.headers.raw());
        
        // Test 3: Session validation (should fail initially)
        console.log('\n3. Testing session validation without credentials...');
        const sessionResponse = await fetch(`${API_URL}/api/user/validate-session`, {
            method: 'GET',
            headers: {
                'Origin': CLIENT_URL
            }
        });
        console.log('   Session validation status:', sessionResponse.status);
        const sessionData = await sessionResponse.json();
        console.log('   Session response:', sessionData);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run if this file is executed directly
if (process.argv[1].endsWith('test-cookies.js')) {
    testCookieFlow();
}

export { testCookieFlow };
