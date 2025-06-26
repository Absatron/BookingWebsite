import express from 'express';
import mongoose from 'mongoose'; 
import cron from 'node-cron';
import { Booking } from '../models.js';
import { wrapAsync } from '../utils/error-utils.js';
import { generateReceiptPDF } from '../utils/pdf-utils.js';
import { authenticateToken, requireAdmin } from '../utils/jwt-utils.js';
import { formatBooking, isValidBooking, createSlot } from '../utils/booking-utils.js';

const router = express.Router();

router.delete('/:id', authenticateToken, requireAdmin, wrapAsync(async (req, res) => {
    const { id } = req.params;

    console.log("Received request to delete booking with ID:", id);

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    // Find the booking by ID
    const booking = await Booking.findById(id);

    console.log("Booking found:", booking);

    if (!booking) {
       return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.status !== 'available') {
        return res.status(400).json({ error: "Cannot delete a booking that is not available." });
    }

    // Delete the booking
    const deletedBooking = await Booking.findByIdAndDelete(id);

    res.status(200).json({ deletedBooking: deletedBooking, message: "Booking successfully deleted" });

}));

router.post('/', authenticateToken, requireAdmin, isValidBooking, wrapAsync(async (req, res) => {
    const { date, startTime, endTime, price } = req.body;

    // Validate required fields
    if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: "Invalid or missing price." });
    }

    console.log("Received request to create slot:", { date, startTime, endTime, price });


    try {
        // Save booking in the database
        const savedBooking = await createSlot({
            date,
            startTime,
            endTime,
            price,
        });

        // Verify the booking was saved
        if (!savedBooking) {
            return res.status(500).json({ message: "Failed to create booking slot." });
        }

        console.log("Booking created successfully:", savedBooking._id);

        return res.status(201).json({ 
            message: "Time slot created successfully",
            booking: formatBooking(savedBooking), 
        });
        
    } catch (error) {
        console.error("Error creating time slot:", error.message);
        return res.status(400).json({ message: "Failed to create booking slot due to a configuration or server error." });
    }
}));

router.get('/', wrapAsync(async (req, res, next) => {

    console.log("Received request to fetch all bookings");

    try {
        const bookingDocuments = await Booking.find({}).sort({ date: 1, startTime: 1 }); // Sort by date/time

        // Format all bookings before sending
        const formattedBookings = bookingDocuments.map(formatBooking);

        console.log(`Found ${formattedBookings.length} bookings`);
        
        return res.json({ bookings: formattedBookings });
        
    } catch (error) {
        console.error("Error fetching bookings:", error.message);
        return res.status(500).json({ message: "Failed to fetch bookings due to a server error." });
    }
    
}))

router.get('/confirmed', authenticateToken, requireAdmin, wrapAsync(async (req, res) => {
    
    console.log("Admin requested all confirmed bookings");

    // Fetch all confirmed bookings with user details
    const bookings = await Booking.find({ status: 'confirmed' })
        .populate('bookedBy', 'name email')
        .sort({ date: 1, startTime: 1 }); // Sort by date and time
    
    console.log("Confirmed bookings found: ", bookings.length);

    return res.status(200).json(bookings);
}));

// Get user bookings
router.get('/user', authenticateToken, wrapAsync(async (req, res) => {
    
    console.log("User requested their bookings");
    const userId = req.user.userId;

    // Fetch bookings for user
    const bookings = await Booking.find({ bookedBy: userId });
    console.log("Bookings found for user:", userId, bookings);

    if (!bookings) {
        console.log("No bookings found for user:", userId);
        return res.status(200).json([]);
    }

    // Return the bookings if found
    return res.status(200).json(bookings);
}));

router.post('/initiate', authenticateToken, wrapAsync(async (req, res) => {
    const { bookingId } = req.body;
    const userId = req.user.userId;

    console.log('Initiating booking for user (JWT):', req.user);

    if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required.' });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        return res.status(404).json({ message: 'Booking slot not found.' });
    }

    if (booking.status !== 'available') {
        return res.status(409).json({ message: 'This slot is no longer available.' });
    }

    // Update booking details
    booking.status = 'pending';
    booking.bookedBy = userId;
    booking.reservedAt = new Date(); // Set the reservation time
    await booking.save();

    console.log("Booking initiated:", booking);

    res.status(200).json({
        message: 'Booking initiated successfully.',
        bookingId: booking._id,
        stripePriceId: booking.stripePriceId
    });
}));

// Get specific booking details by ID
router.get('/:bookingId', authenticateToken, wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.userId; // Check if the user owns this booking

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

// Cancel booking (change status from pending to available)
router.post('/:bookingId/cancel', authenticateToken, wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    console.log("Received request to cancel booking:", bookingId, "for user:", userId);

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

// Run cleanup immediately on server start
cleanupExpiredBookings().catch(error => {
  console.error('Initial cleanup execution failed:', error);
});

// Run cleanup every 5 minutes
const cleanupInterval = setInterval(async () => {
  try {
    await cleanupExpiredBookings();
  } catch (error) {
    console.error('Cleanup interval execution failed:', error);
    // Interval continues running even if one execution fails
  }
}, 5 * 60 * 1000);

// Function to delete old bookings (older than 30 days)
async function deleteOldBookings() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); 

    try {
        const result = await Booking.deleteMany({ date: { $lt: cutoffDate } });
        console.log(`Deleted ${result.deletedCount} old bookings`);
    } catch (error) {
        console.error('Error deleting old bookings:', error);
    }
}

// Schedule the task to run daily at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running automated booking deletion');
    deleteOldBookings();
});

// Download receipt (PDF) for a booking
router.get('/:bookingId/receipt', authenticateToken, wrapAsync(async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.userId;

    console.log("Received request to download receipt for booking:", bookingId, "by user:", userId);

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
    const receiptPDF = await generateReceiptPDF(booking, bookingId);

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
