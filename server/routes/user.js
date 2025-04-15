import express from 'express';
import { wrapAsync } from '../server-utils.js';
import { User } from '../models.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const { ADMIN_EMAIL } = process.env;

const setAdmin = (req, res, next) => {
    req.session.admin = req.body.email === ADMIN_EMAIL;
    return next();
}

router.post('/register', setAdmin, wrapAsync(async (req, res, next) => {
    const { name, email, password } = req.body;
    const matchingUser = await User.findOne({ email });
    if (!matchingUser) {
        const newUser = new User({ name, email, password });
        await newUser.save();
        req.session.user_id = newUser._id;
        res.json({ success: true, message: 'Successfully registered' });
    } else {
        res.json({ success: false, message: 'User is already registered' });
    }
}))

router.post('/login', setAdmin, wrapAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const returningUser = await User.findOne({ email });
    if (returningUser) {
        const validPassword = await bcrypt.compare(password, returningUser.password);
        if (validPassword) {
            req.session.user_id = returningUser._id;
            res.json({ success: true, message: 'Successfully logged in' });
        } else {
            res.json({ success: false, message: 'Your email or password was incorrect' });
        }

    } else {
        res.json({ success: false, message: 'Your email or password was incorrect' });
    }
}))

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'User was successfully logged out' });
})

router.get('/authorise', (req, res) => {
    const userId = req.session.userId;
    const isLoggedIn = !!req.session?.user_id;
    const isAdmin = !!req.session?.admin;
    res.json({ isLoggedIn, isAdmin, userId });
})

export default router;