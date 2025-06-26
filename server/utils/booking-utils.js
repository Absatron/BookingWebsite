import { wrapAsync } from './error-utils.js';
import { Booking } from '../models.js';

export function formatBooking(booking) {
    return {
        id: booking._id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        price: booking.price,
        stripePriceId: booking.stripePriceId,
        status: booking.status,
        bookedBy: booking.bookedBy,
    };
}

export const isValidBooking = wrapAsync(async (req, res, next) => {
    const { date, startTime, endTime } = req.body;

    // Basic validation for input presence
    if (!date || !startTime || !endTime) {
        return res.status(400).json({ success: false, message: "Missing date, startTime, or endTime." });
    }

    // Validate date format 
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
         return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD." });
    }

    // Validate time format 
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
         return res.status(400).json({ success: false, message: "Invalid time format. Use HH:MM." });
    }

    // Check for overlapping bookings
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

    return next(); 
});

export async function createSlot({ date, startTime, endTime, price }) {

    console.log("Attempting to create slot with price:", price);

     // Get the Stripe Price ID from environment variables based on the price
     const priceIdEnvKey = `STRIPE_PRICE_ID_${price}`;
     const stripePriceId = process.env[priceIdEnvKey];

     if (!stripePriceId) {
          const errorMessage = `Configuration error: Stripe Price ID not found in .env for price: ${price}. Key checked: ${priceIdEnvKey}`;
          console.error(`Error: ${errorMessage}`);
          throw new Error("Price not configured in .env file.")
     }

     console.log(`Found Stripe Price ID: ${stripePriceId} for price ${price}`);

     // Create an available booking 
    const booking = new Booking({
        date,
        startTime,
        endTime,
        price,
        stripePriceId,
        status: 'available', 
        bookedBy: null       
    });
    return await booking.save();
}