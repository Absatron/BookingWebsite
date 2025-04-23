import express from 'express';
import { Booking } from '../models.js';
import { wrapAsync } from '../utils/error-utils.js';
import { formatBooking } from '../utils/booking-utils.js';
import { isAdminUser } from '../utils/auth-utils.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const router = express.Router();

const { ADMIN_EMAIL } = process.env;

const isValidBooking = wrapAsync(async (req, res, next) => {
    const { date, startTime, endTime } = req.body;

    const overlappingBookings = await Booking.findOne({
        date,
        $or: [
            {
                // Event starts within the existing event
                startTime: { $gte: startTime, $lt: endTime },
            },
            {
                // Event ends within the existing event
                endTime: { $gt: startTime, $lte: endTime },
            },
            {
                // Event completely overlaps the existing event
                startTime: { $lte: startTime },
                endTime: { $gte: endTime },
            },
        ],
    });

    if (!overlappingBookings) {
        return next();
    }

    return res.status(409).json({ success: false, message: "Time slot is already booked.", calendarEventInfo: {} });
});

const isHourBooking = (req, res, next) => {
    const { startTime, endTime } = req.body;

    const getMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    if (getMinutes(endTime) - getMinutes(startTime) === 60) {
        return next();
    }

    return res.status(409).json({ success: false, message: "Duration of time slot is not an hour", calendarEventInfo: {} });
}

async function createSlot({ date, startTime, endTime, price }) {
    console.log("Creating slot with price 2:", price);
     // Construct the environment variable key dynamically
     const priceIdEnvKey = `STRIPE_PRICE_ID_${price}`;
     // Correctly access the environment variable using bracket notation
     const stripePriceId = process.env[priceIdEnvKey];

     if (!stripePriceId) {
          const errorMessage = `Configuration error: Stripe Price ID not found in .env for price: ${price}. Key checked: ${priceIdEnvKey}`;
          console.error(`Error: ${errorMessage}`);
          // Throw an error instead of trying to use 'res'
          throw new Error(errorMessage);
     }

    const booking = new Booking({ date, startTime, endTime, price, stripePriceId, status:'available', bookedBy:null });
    return await booking.save();
}


// deletes event in database 
router.delete('/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
        return res.status(404).json({ error: "Event not found" });
    }

    res.json({ message: "Event successfully deleted" });

})); // Corrected closing parenthesis placement

// creates availability in database
router.post('/', isValidBooking, wrapAsync(async (req, res) => {
    const { date, startTime, endTime, price } = req.body;

    console.log("Creating slot with price:", price);
    try {
        // saves booking in the database
        const savedSlot = await createSlot({
            date,
            startTime,
            endTime,
            price,
        });

        // Correct variable name check
        if (!savedSlot) {
            // Although createSlot should throw on failure now, keep a check just in case.
            return res.status(500).json({ message: "Failed to create event slot." });
        }

        // Return the created event object
        return res.status(201).json({ // Use 201 Created status code
            message: "Time slot created successfully", // Add a success message
            event: formatBooking(savedSlot),
        });
    } catch (error) {
        // Catch errors thrown from createSlot (like missing price ID)
        console.error("Error creating time slot:", error.message);
        // Send a specific error message back to the client
        return res.status(400).json({ message: error.message || "Failed to create event slot due to a configuration or server error." });
    }
}));




// gets all the events from the database
router.get('/', wrapAsync(async (req, res, next) => {
    const bookingDocuments = await Booking.find({}); 
    
    if (!bookingDocuments) {
        return res.status(500).json({ message: "Failed to fetch events." });
    }

    const formattedBookings = bookingDocuments.map(formatBooking); 

    // Return the formatted bookings
    return res.json({ events: formattedBookings });
}))

export default router;