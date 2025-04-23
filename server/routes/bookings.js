import express from 'express';
import mongoose from 'mongoose'; // <-- Add this import
import { Booking } from '../models.js';
import { wrapAsync } from '../utils/error-utils.js';

const router = express.Router();

// Initiate booking
router.post('/initiate', wrapAsync(async (req, res) => {
    const { slotId } = req.body;
    const userId = req.session.user_id;

    console.log(req.session);

    // Add a check for userId here since isAuthenticated is removed
    // PROBLEM WITH THIS: userId 
    if (!userId) {
        return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    if (!slotId) {
        return res.status(400).json({ message: 'Slot ID is required.' });
    }

    const booking = await Booking.findById(slotId);

    if (!booking) {
        return res.status(404).json({ message: 'Booking slot not found.' });
    }

    if (booking.status !== 'available') {
        return res.status(409).json({ message: 'This slot is no longer available.' });
    }

    // Update booking status to pending and assign user
    booking.status = 'pending';
    booking.bookedBy = userId;
    await booking.save();

    console.log("Booking initiated (/initate):", booking);

    res.status(200).json({
        message: 'Booking initiated successfully.',
        bookingId: booking._id,
        stripePriceId: booking.stripePriceId
    });
}));

// Get specific booking details by ID
router.get('/:bookingId', wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.session.user_id; // Optional: Check if the user owns this booking if needed

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID format.' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
    }

    // Optional: Add authorization check if only the user who booked it should see it
    // if (booking.bookedBy && booking.bookedBy.toString() !== userId) {
    //     return res.status(403).json({ message: 'Forbidden: You do not have access to this booking.' });
    // }

    // Convert date to yyyy-MM-dd format before sending if needed, or handle on frontend
    // const formattedBooking = { ...booking.toObject(), date: format(booking.date, 'yyyy-MM-dd') };

    res.status(200).json(booking); // Send the full booking object
}));

// Add other booking-related routes here (e.g., confirm payment, get user bookings)

export default router;
