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

