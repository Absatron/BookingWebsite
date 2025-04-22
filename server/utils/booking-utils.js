export function formatBooking(booking) {
    return {
        id: booking._id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        isBooked: booking.isBooked,
        price: booking.price,
        bookedBy: booking.bookedBy,
    };
}