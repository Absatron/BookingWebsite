import { Booking } from '../models.js';
import { sendBookingConfirmationEmail } from '../utils/email-service.js';

export const confirmBooking = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId).populate('bookedBy');
        
        if (booking && booking.status === 'pending') {
            booking.status = 'confirmed';
            booking.confirmedAt = new Date();
            await booking.save();
            console.log(`Booking ${bookingId} status updated to confirmed.`);
            
            // Send confirmation email if user exists and has email
            if (booking.bookedBy && booking.bookedBy.email) {
                try {
                    // Check if email service is configured
                    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                        console.warn('Email service not configured - skipping confirmation email');
                    } else {
                        const bookingDetails = {
                            bookingId: booking._id,
                            date: booking.date,
                            startTime: booking.startTime,
                            endTime: booking.endTime,
                            price: booking.price
                        };
                        
                        await sendBookingConfirmationEmail(
                            booking.bookedBy.email,
                            booking.bookedBy.name,
                            bookingDetails
                        );
                        console.log(`Confirmation email sent to ${booking.bookedBy.email} for booking ${bookingId}`);
                    }
                } catch (emailError) {
                    // Log email error but don't fail the booking confirmation
                    console.error(`Failed to send confirmation email for booking ${bookingId}:`, emailError);
                }
            }
            
            return { success: true, message: 'Booking confirmed' };
        } else if (booking) {
            console.warn(`Webhook Warning: Booking ${bookingId} already processed or not in pending state. Status: ${booking.status}`);
            return { success: false, message: 'Booking already processed' };
        } else {
            console.error(`Webhook Error: Booking ${bookingId} not found`);
            return { success: false, message: 'Booking not found' };
        }
    } catch (error) {
        console.error(`Database Error: Failed to confirm booking ${bookingId}: ${error.message}`);
        throw error; // Re-throw so webhook can handle it
    }
}

export const cancelBooking = async (bookingId) => {
    try {
        const booking = await Booking.findById(bookingId);
        
        if (booking && booking.status === 'pending') {
            booking.status = 'available';
            booking.bookedBy = null;
            await booking.save();
            console.log(`Booking ${bookingId} reset due to session expiry.`);
            return { success: true, message: 'Booking cancelled' };
        } else if (booking) {
            console.warn(`Webhook Warning: Booking ${bookingId} not in pending state. Status: ${booking.status}`);
            return { success: false, message: 'Booking not in pending state' };
        } else {
            console.error(`Webhook Error: Booking ${bookingId} not found`);
            return { success: false, message: 'Booking not found' };
        }
    } catch (error) {
        console.error(`Database Error: Failed to cancel booking ${bookingId}: ${error.message}`);
        throw error; // Re-throw so webhook can handle it
    }
};