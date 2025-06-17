import express from 'express';
import { Booking } from '../models.js';
import { wrapAsync } from '../utils/error-utils.js';
import { formatBooking } from '../utils/booking-utils.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const router = express.Router();

const isValidBooking = wrapAsync(async (req, res, next) => {
    const { date, startTime, endTime } = req.body;

    // Basic validation for input presence
    if (!date || !startTime || !endTime) {
        return res.status(400).json({ success: false, message: "Missing date, startTime, or endTime." });
    }

    // Validate date format (simple check, consider more robust validation)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
         return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD." });
    }

    // Validate time format (simple check)
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
         return res.status(400).json({ success: false, message: "Invalid time format. Use HH:MM." });
    }


    const overlappingBookings = await Booking.findOne({
        date,
        status: { $ne: 'cancelled' }, // Don't check against cancelled bookings
        $or: [
            { startTime: { $lt: endTime, $gte: startTime } }, // New start is within existing
            { endTime: { $lte: endTime, $gt: startTime } },   // New end is within existing
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } } // New completely overlaps existing
        ],
    });

    if (overlappingBookings) {
        console.warn(`Overlap detected for ${date} ${startTime}-${endTime} with existing booking ${overlappingBookings._id}`);
        return res.status(409).json({ success: false, message: "Time slot overlaps with an existing booking.", calendarEventInfo: {} });
    }

    return next(); // No overlap found
});

async function createSlot({ date, startTime, endTime, price }) {
    console.log("Attempting to create slot with price:", price);
     // Construct the environment variable key dynamically
     const priceIdEnvKey = `STRIPE_PRICE_ID_${price}`;
     // Correctly access the environment variable using bracket notation
     const stripePriceId = process.env[priceIdEnvKey];

     if (!stripePriceId) {
          const errorMessage = `Configuration error: Stripe Price ID not found in .env for price: ${price}. Key checked: ${priceIdEnvKey}`;
          console.error(`Error: ${errorMessage}`);
          // Throw an error instead of trying to use 'res'
          throw new Error("Price not configured in .env file.")
     }
     console.log(`Found Stripe Price ID: ${stripePriceId} for price ${price}`);


    // Create new booking with 'available' status and null bookedBy
    const booking = new Booking({
        date,
        startTime,
        endTime,
        price,
        stripePriceId,
        status: 'available', // Explicitly set status
        bookedBy: null       // Explicitly set bookedBy
    });
    return await booking.save();
}


// deletes event (time slot) in database
router.delete('/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    // Optionally, only allow deletion if the slot is 'available'
    // const booking = await Booking.findOne({ _id: id, status: 'available' });
    // if (!booking) {
    //    return res.status(404).json({ error: "Event not found or cannot be deleted (might be booked/pending)." });
    // }
    // const deletedBooking = await Booking.findByIdAndDelete(id);

    // For now, allow deletion regardless of status (admin action)
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
        return res.status(404).json({ error: "Event not found" });
    }

    res.json({ message: "Event successfully deleted" });

}));

// creates availability (a new time slot) in database
// Added isAdminUser middleware check here if needed, assuming it's defined elsewhere
// router.post('/', isAdminUser, isValidBooking, wrapAsync(async (req, res) => {
router.post('/', isValidBooking, wrapAsync(async (req, res) => { // Removed isAdminUser for now if not implemented
    const { date, startTime, endTime, price } = req.body;

    // Add validation for price
    if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: "Invalid or missing price." });
    }


    console.log("Received request to create slot:", { date, startTime, endTime, price });
    try {
        // saves booking in the database
        const savedSlot = await createSlot({
            date,
            startTime,
            endTime,
            price,
        });

        // Check if slot was saved (should be redundant due to error throwing in createSlot)
        if (!savedSlot) {
            return res.status(500).json({ message: "Failed to create event slot." });
        }

        console.log("Slot created successfully:", savedSlot._id);
        // Return the created event object using the formatter
        return res.status(201).json({ // Use 201 Created status code
            message: "Time slot created successfully",
            event: formatBooking(savedSlot), // Use formatter
        });
    } catch (error) {
        // Catch errors thrown from createSlot (like missing price ID) or validation
        console.error("Error creating time slot:", error.message);
        // Send a specific error message back to the client
        return res.status(400).json({ message: error.message || "Failed to create event slot due to a configuration or server error." });
    }
}));




// gets all the events (time slots) from the database
router.get('/', wrapAsync(async (req, res, next) => {
    // Fetch all bookings regardless of status for the calendar/admin view
    // Filter on the frontend if needed (e.g., only show 'available' in BookingCalendar)
    const bookingDocuments = await Booking.find({}).sort({ date: 1, startTime: 1 }); // Sort by date/time

    if (!bookingDocuments) {
        // This case is unlikely with find(), it returns [] if none found
        return res.status(500).json({ message: "Failed to fetch events." });
    }

    // Format all bookings before sending
    const formattedBookings = bookingDocuments.map(formatBooking);

    // Return the formatted bookings
    return res.json({ events: formattedBookings });
}))

export default router;