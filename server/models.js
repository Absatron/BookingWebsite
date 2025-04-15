import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import cron from 'node-cron';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
});

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// encrypts password before saving to mongoDB
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
        next();
    } catch (err) {
        next(err);
    }
});

export const User = mongoose.model('User', userSchema);

const eventSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: User
    }
})

export const Event = mongoose.model('Event', eventSchema);

// Function to delete old events
async function deleteOldEvents() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Delete events older than 30 days

    try {
        const result = await Event.deleteMany({ date: { $lt: cutoffDate } });
        console.log(`Deleted ${result.deletedCount} old events`);
    } catch (error) {
        console.error('Error deleting old events:', error);
    }
}

// Schedule the task to run daily at midnight
cron.schedule('0 0 * * *', () => {
    console.log('Running automated event deletion');
    deleteOldEvents();
});