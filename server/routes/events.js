import express from 'express';
import { User, Booking } from '../models.js';
import { wrapAsync } from '../utils/error-utils.js';
import { formatBooking } from '../utils/booking-utils.js';
import { isAdminUser } from '../utils/auth-utils.js';
import dotenv from 'dotenv';

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

async function createBooking({ userId, date, startTime, endTime, price, isBooked, bookedBy }) {
    if (bookedBy != null) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");
        bookedBy = user._id;
    } 

    const booking = new Booking({ date, startTime, endTime, isBooked, price, bookedBy });
    return await booking.save();
}


// deletes event in database 
router.delete('/:id', isAdminUser, wrapAsync(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }

    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
        return res.status(404).json({ error: "Event not found" });
    }

    res.json({ message: "Event successfully deleted" });

}))

// creates availability in database
router.post('/', isAdminUser, isValidBooking, wrapAsync(async (req, res) => {
    const { date, startTime, endTime, price } = req.body;

    // saves booking in the database
    const savedBooking = await createBooking({
        userId: req.session.user_id,
        date,
        startTime,
        endTime,
        price,
        isBooked: false,
        bookedBy: null
    });

    
    if (!savedBooking) {
        return res.status(500).json({ message: "Failed to create event." });
    }

    // Return the created event object
    return res.json({
        event: formatBooking(savedBooking),
    });

}));


// saves event to be payed for by the client
router.post('/userSave', isHourBooking, isValidBooking, wrapAsync(async (req, res, next) => {
    const { date, startTime, endTime } = req.body;
    req.session.savedEvent = { date, startTime, endTime };
    return res.json({ success: true, message: "Event successfully saved" });
}))

// creates the saved event by the user in the database
router.post('/saveSavedEvent', isValidBooking, wrapAsync(async (req, res, next) => {
    if (req.session.savedEvent) {
        const { date, startTime, endTime } = req.session.savedEvent;
        const currentUser = await User.findOne({ _id: req.session.user_id });
        const newEvent = new Event({ date, startTime, endTime, user: currentUser._id });
        await newEvent.save();
        req.session.savedEvent = null;
        return res.json({ success: true, message: "Event was successfully created" });
    } else {
        return res.json({ success: false, message: "Event was not selected" });
    }


}))

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