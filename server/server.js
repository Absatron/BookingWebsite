import express from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import eventsRouter from './routes/events.js';
import paymentRouter from './routes/payment.js';
import userRouter from './routes/user.js';
import bookingsRouter from './routes/bookings.js'; // Import the new bookings router
import session from 'express-session';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

mongoose.connect('mongodb://127.0.0.1:27017/bookingApp')
    .then(() => console.log("CONNECTED TO DATABASE"))
    .catch((err) => console.log(err))

const sessionOptions = { secret: 'terriblesecret', resave: false, saveUninitialized: false };

// Configure CORS
app.use(cors({
    origin: 'http://localhost:8080', // *** Ensure this matches your frontend port ***
    credentials: true, // Allow credentials (cookies, authorization headers, etc)
}));

app.use(express.static("dist"));
app.use(express.json());
app.use(session(sessionOptions));
app.use('/api/events', eventsRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/user', userRouter);
app.use('/api/bookings', bookingsRouter); // Mount the new bookings router

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