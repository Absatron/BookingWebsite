import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config()

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
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    passwordResetToken: {
        type: String,
        required: false
    },
    passwordResetExpiry: {
        type: Date,
        required: false
    }
});

const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 1 : parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Encrypts password before saving to mongoDB
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


export const User = mongoose.model('User', userSchema);

const bookingSchema = new mongoose.Schema({
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
    price: {
        type: Number,
        required: true
    },
    stripePriceId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'pending', 'confirmed'],
        default: 'available',
        required: true
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId, ref: User
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reservedAt: {
        type: Date,
        index: true // Index for faster queries
    }
})

export const Booking = mongoose.model('Booking', bookingSchema);