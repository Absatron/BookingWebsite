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

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

mongoose.connect('mongodb://127.0.0.1:27017/bookingApp')
    .then(() => console.log("CONNECTED TO DATABASE"))
    .catch((err) => console.log(err))

const sessionOptions = { 
        secret: 'terriblesecret', 
        resave: false, 
        saveUninitialized: false,
        cookie: {
            // Set the session to expire after 20 mins (in milliseconds)
            maxAge: 0.3 * 60 * 60 * 1000, 
            // Consider setting httpOnly to true for security (prevents client-side script access)
            // httpOnly: true, 
            // Consider setting secure to true if using HTTPS
            // secure: process.env.NODE_ENV === 'production' 
        } 
    };

// Configure CORS
app.use(cors({
    origin: 'http://localhost:8080', // *** Ensure this matches your frontend port ***
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


// dev
app.use(morgan('common'));
//

// undefined routes
app.use((req, res) => {
    res.status(404).render("NOT FOUND")
})

// error handling
app.use((err, req, res, next) => {
    
    console.log("Error handled")
    console.log(err)
    const { status = 500, message = 'Something went wrong' } = err;
    res.status(status).json({ message: message });
})

app.listen(port, () => {
    console.log(`Sever is running on PORT ${port}`);
})