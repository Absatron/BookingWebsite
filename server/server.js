import express from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import eventsRouter from './routes/events.js';
import paymentRouter from './routes/payment.js';
import userRouter from './routes/user.js';
import bookingsRouter from './routes/bookings.js'; 
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import cors from 'cors';
import { testEmailConfiguration } from './utils/email-service.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

dotenv.config();

const app = express();
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
        
        // Test email configuration on startup
        testEmailConfiguration().then(result => {
            if (result.success) {
                console.log("✅ Email service configuration verified");
            } else {
                console.warn("⚠️  Email service not configured or has issues:", result.message);
                console.warn("   Booking confirmations will not be sent via email");
            }
        });
        
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

const sessionOptions = { 
    secret: process.env.SESSION_SECRET, // Use environment variable
    resave: false, 
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoUri,
        touchAfter: 24 * 3600, // lazy session update
        mongoOptions: mongoOptions, // Use the same options as mongoose
        autoRemove: 'native', // Default
        autoRemoveInterval: 10, // In minutes. Default
        collectionName: 'sessions', // Default
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours for production
        httpOnly: true, // Enable for security
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict' // CSRF protection
    } 
};

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

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

// Add compression
app.use(compression());

// Configure CORS
const allowedOrigins = [
    'http://localhost:8080',  // Local development
    'https://bookingapp-gamma-orcin.vercel.app',  // Production Vercel
    'https://bookingapp-m8mns1097-absatrons-projects.vercel.app',  // Old Vercel URL
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
}));

app.use(express.static("dist"));

// Mount payment router BEFORE global JSON parsing for webhook handling
app.use('/api/payment', paymentRouter);

// Global middleware (applied after payment router)
app.use(express.json());
//app.use(express.urlencoded({ extended: true }))
app.use(session(sessionOptions));

// Other routers
app.use('/api/events', eventsRouter);
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

// dev
app.use(morgan('common'));
//

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