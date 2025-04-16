import express from 'express';
import { User, Event } from '../models.js';
import { wrapAsync } from '../utils/error-utils.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const { ADMIN_EMAIL } = process.env;

const isValidBooking = wrapAsync(async (req, res, next) => {
    const { date, startTime, endTime } = req.body;

    const overlappingEvents = await Event.findOne({
        date,
        $or: [
            {
                // All day event
                startTime: "00:00",
                endTime: "00:00"
            },
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

    if (!overlappingEvents || startTime === endTime) {
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

// deletes event in database 
router.delete('/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.json({ success: true, message: "Event successfully deleted" });

}))

// creates event in database
router.post('/', isValidBooking, wrapAsync(async (req, res, next) => {
    const { date, startTime, endTime } = req.body;
    const currentUser = await User.findOne({ _id: req.session.user_id });
    const newEvent = new Event({ date, startTime, endTime, user: currentUser._id });
    const savedEvent = await newEvent.save();
    const calendarEventInfo = { id: savedEvent._id, title: `booking by ${currentUser.name}` };
    return res.json({ success: true, message: "Event successfully created", calendarEventInfo });

}))

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
    const eventsDocuments = await Event.find({}).populate('user', 'name email');
    const events = eventsDocuments.map(event => ({
        id: event._id,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        userId: event.user._id,
        userName: event.user.name,
        setByAdmin: event.user.email === ADMIN_EMAIL,
        allDay: event.startTime === event.endTime
    }));

    return res.json({ success: true, events });
}))

export default router;