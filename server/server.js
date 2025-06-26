// imports are loaded before file runs, so need to be repeated for files which use env variables at module level
import dotenv from 'dotenv';
dotenv.config()

import express from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

import paymentRouter from './routes/payment.js';
import userRouter from './routes/user.js';
import bookingsRouter from './routes/bookings.js'; 

import { testEmailConfiguration } from './utils/email-service.js';

const app = express();

// Render uses reverse proxies (Renders load balancer is first proxy) 
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

const port = process.env.PORT || 8080;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookingApp'

// MongoDB connection options for production
const mongoOptions = {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Enhanced connection with better error handling
async function connectToDatabase() {
    try {
        console.log("Attempting to connect to MongoDB...");
        console.log("Environment:", process.env.NODE_ENV);
        
        // Don't log the full URI in production for security
        if (process.env.NODE_ENV === 'production') {
            console.log("MongoDB URI configured (URI hidden for security)");
        } else {
            console.log("MongoDB URI:", mongoUri);
        }

        await mongoose.connect(mongoUri, mongoOptions);
        console.log("✅ CONNECTED TO DATABASE");       
        
    } catch (error) {
        console.error("❌ MongoDB connection error:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        
        if (error.name === 'MongoServerError' && error.code === 8000) {
            console.error("🔑 Authentication failed. Please check:");
            console.error("   1. MongoDB username and password are correct");
            console.error("   2. Username/password don't contain special characters that need URL encoding");
            console.error("   3. Database user has proper permissions");
            console.error("   4. Connection string format is correct");
            console.error("   5. IP whitelist includes 0.0.0.0/0 or Render's IP ranges");
        }
        
        // In production, we should exit gracefully
        if (process.env.NODE_ENV === 'production') {
            console.error("💥 Database connection failed in production. Exiting...");
            process.exit(1);
        } else {
            console.error("⚠️  Continuing without database connection for development");
        }
    }
}

// Connect to database
connectToDatabase();

// Test email configuration
testEmailConfiguration().then(result => {
    if (result.success) {
        console.log("✅ Email service configuration verified");
    } else {
        console.warn("⚠️  Email service not configured or has issues:", result.message);
        console.warn("   Booking confirmations will not be sent via email");
    }
});

// Add security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com"],
        },
    },
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Add compression
app.use(compression());

// Configure CORS
const allowedOrigins = [
    'https://bookingapp-gamma-orcin.vercel.app',  // Production Vercel
    process.env.CLIENT_URL  // Environment variable override
].filter(Boolean); // Remove any undefined values

// Add debug logging
console.log('🔧 CORS Configuration:');
console.log('   Allowed origins:', allowedOrigins);
console.log('   CLIENT_URL env var:', process.env.CLIENT_URL);

app.use(cors({
    origin: function (origin, callback) {
        console.log(`🌍 Incoming request from origin: ${origin}`);
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            console.log(`✅ CORS allowed for origin: ${origin}`);
            callback(null, true);
        } else {
            console.warn(`🚫 CORS blocked request from origin: ${origin}`);
            console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Add middleware to set additional headers for debugging
app.use((req, res, next) => {
    // Add headers to help with debugging
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.status(200).end();
    }
    
    // Log environment settings for debugging
    if (req.url.includes('/api/user/')) {
        console.log('🔧 JWT Config Debug:');
        console.log('   NODE_ENV:', process.env.NODE_ENV);
        console.log('   JWT_SECRET configured:', !!process.env.JWT_SECRET);
        console.log('   Request method:', req.method);
        console.log('   Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    }
    
    next();
});

// Serve static files from the "dist" directory - used if deploying frontednd and backend on the same server
//app.use(express.static("dist"));

// Mount payment router before global JSON parsing
app.use('/api/payment', paymentRouter);

// Parse JSON bodies for all routes
app.use(express.json());

// Other routers
app.use('/api/user', userRouter);
app.use('/api/bookings', bookingsRouter); 

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Logging middleware
app.use(morgan('common'));

// undefined routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
})

// error handling
app.use((err, req, res, next) => {
    console.log("Error handled")
    console.log(err)
    const { status = 500, message = 'Something went wrong' } = err;
    res.status(status).json({ message: message });
})

app.listen(port, () => {
    console.log(`Server is running on PORT ${port}`);
})