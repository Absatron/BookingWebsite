import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookingApp';

console.log('🔍 Testing MongoDB Connection...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Node.js version:', process.version);

// Enhanced connection options
const mongoOptions = {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

async function testConnection() {
    try {
        // Parse URI to check format (without logging sensitive info)
        const url = new URL(mongoUri);
        console.log('📊 Connection Details:');
        console.log('  Protocol:', url.protocol);
        console.log('  Hostname:', url.hostname);
        console.log('  Database:', url.pathname.slice(1));
        console.log('  Username provided:', !!url.username);
        console.log('  Password provided:', !!url.password);
        
        // Check for common issues
        if (url.username && (url.username.includes('%') || url.password.includes('%'))) {
            console.log('⚠️  Username/password appears to be URL encoded - this might be correct');
        }
        
        if (url.username && (!url.username.match(/^[a-zA-Z0-9_.-]+$/) || !url.password.match(/^[a-zA-Z0-9@#$%^&+=!_.-]+$/))) {
            console.log('⚠️  Username/password contains special characters - ensure they are properly URL encoded');
        }

        console.log('\n🔄 Attempting connection...');
        await mongoose.connect(mongoUri, mongoOptions);
        
        console.log('✅ Successfully connected to MongoDB!');
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📁 Found ${collections.length} collections in database`);
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected successfully');
        
    } catch (error) {
        console.error('❌ Connection failed:');
        console.error('Error type:', error.constructor.name);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 8000) {
            console.log('\n🔑 Authentication Error Troubleshooting:');
            console.log('1. Verify username and password are correct');
            console.log('2. Check if special characters need URL encoding:');
            console.log('   @ → %40');
            console.log('   : → %3A');
            console.log('   / → %2F');
            console.log('   + → %2B');
            console.log('   = → %3D');
            console.log('3. Ensure database user exists and has proper permissions');
            console.log('4. Check MongoDB Atlas IP whitelist (should include 0.0.0.0/0 for Render)');
            console.log('5. Verify the cluster is not paused');
        }
        
        if (error.code === 'ENOTFOUND') {
            console.log('\n🌐 DNS/Network Error:');
            console.log('1. Check if the hostname is correct');
            console.log('2. Verify network connectivity');
            console.log('3. Check if MongoDB cluster is accessible');
        }
        
        process.exit(1);
    }
}

testConnection();
