import express from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import eventsRouter from './routes/events.js';
import paymentRouter from './routes/payment.js';
import userRouter from './routes/user.js';
import bookingsRouter from './routes/bookings.js'; 
import session from 'express-session';
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

mongoose.connect(mongoUri)
    .then(() => {
        console.log("CONNECTED TO DATABASE");
        console.log("MongoDB URI:", mongoUri);
        // Test email configuration on startup
        testEmailConfiguration().then(result => {
            if (result.success) {
                console.log("✅ Email service configuration verified");
            } else {
                console.warn("⚠️  Email service not configured or has issues:", result.message);
                console.warn("   Booking confirmations will not be sent via email");
            }
        });
    })
    .catch((err) => console.log(err))

const sessionOptions = { 
    secret: process.env.SESSION_SECRET, // Use environment variable
    resave: false, 
    saveUninitialized: false,
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
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
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