import express from 'express';
import mongoose from 'mongoose'; // <-- Add this import
import { Booking } from '../models.js';
import { wrapAsync } from '../utils/error-utils.js';
import { generateReceiptPDF } from '../utils/pdf-utils.js';

const router = express.Router();

// Initiate booking
router.post('/initiate', wrapAsync(async (req, res) => {
    const { slotId } = req.body;
    const userId = req.session.user_id;

    console.log(req.session);

    // Add a check for userId here since isAuthenticated is removed
    // PROBLEM WITH THIS: userId - gets logged out too quickly
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
    booking.reservedAt = new Date(); // Set the reservation time
    await booking.save();

    console.log("Booking initiated (/initate):", booking);

    res.status(200).json({
        message: 'Booking initiated successfully.',
        bookingId: booking._id,
        stripePriceId: booking.stripePriceId
    });
}));

// Add a cleanup function for expired pending bookings
const cleanupExpiredBookings = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
  
  try {
    const result = await Booking.updateMany(
      { 
        status: 'pending', 
        reservedAt: { $lt: thirtyMinutesAgo } 
      },
      { 
        status: 'available', 
        bookedBy: null,
        $unset: { reservedAt: 1 } // Remove any expiry field if you add one
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`Cleaned up ${result.modifiedCount} expired pending bookings`);
    }
  } catch (error) {
    console.error('Error cleaning up expired bookings:', error);
  }
};

// Run cleanup every 5 minutes
const cleanupInterval = setInterval(async () => {
  try {
    await cleanupExpiredBookings();
  } catch (error) {
    console.error('Cleanup interval execution failed:', error);
    // Interval continues running even if one execution fails
  }
}, 5 * 60 * 1000);


// Cancel booking (change status from pending to available)
router.post('/:bookingId/cancel', wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.session.user_id;

    console.log("Received request to cancel booking:", bookingId, "for user:", userId);

    if (!userId) {
        return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID format.' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
    }

    console.log("user authenticated and booking found, proceeding to cancel booking:", booking);
    // Check if the user owns this booking
    if (booking.bookedBy && booking.bookedBy.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only cancel your own bookings.' });
    }

    // Only allow cancellation of pending bookings
    if (booking.status !== 'pending') {
        return res.status(400).json({ 
            message: `Cannot cancel booking with status: ${booking.status}. Only pending bookings can be cancelled.` 
        });
    }

    // Reset booking to available state
    booking.status = 'available';
    booking.bookedBy = null;
    booking.reservedAt = undefined; // Clear the reservation time
    await booking.save();

    console.log("Booking cancelled:", booking);

    res.status(200).json({
        message: 'Booking cancelled successfully.',
        bookingId: booking._id
    });
}));

// Get specific booking details by ID
router.get('/:bookingId', wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.session.user_id; // Optional: Check if the user owns this booking if needed

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID format.' });
    }

    const booking = await Booking.findById(bookingId).populate('bookedBy', 'name email');

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
    }

    console.log("Booking details fetched:", booking);
    res.status(200).json(booking); // Send the full booking object
}));

// Add other booking-related routes here (e.g., confirm payment, get user bookings)

// Get user bookings
router.get('/', wrapAsync(async (req, res) => {
    const userId = req.session.user_id;

    if (!userId) {
         console.log("failed to fetch bookings - no userId in session");
        return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    // Fetch bookings for the logged-in user
    const bookings = await Booking.find({ bookedBy: userId });
    console.log("Bookings found for user:", userId, bookings);

    // If no bookings are found, return 200 OK with an empty array
    // This is often preferred over 404 for list endpoints
    if (!bookings) { // Should technically check bookings.length === 0 as find returns [] not null
        console.log("No bookings found for user:", userId);
        return res.status(200).json([]);
    }

    // Return the bookings if found
    return res.status(200).json(bookings);
}));

// Download receipt (PDF) for a booking
router.get('/:bookingId/receipt', wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.session.user_id;

    console.log("Received request to download receipt for booking:", bookingId, "by user:", userId);

    if (!userId) {
        return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID format.' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check if the user owns this booking
    if (booking.bookedBy && booking.bookedBy.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only download receipts for your own bookings.' });
    }

    // Generate PDF receipt
    const receiptPDF = await generateReceiptPDF(booking);

    // Set the content type and disposition for PDF download
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${bookingId}.pdf"`,
        'Content-Length': receiptPDF.length
    });

    // Send the PDF buffer as the response
    res.send(receiptPDF);
}));


export default router;
