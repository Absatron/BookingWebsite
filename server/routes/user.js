import express from 'express';
import { wrapAsync } from '../server-utils.js';
import { User } from '../models.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

router.post('/register', wrapAsync(async (req, res) => {
    const { name, email, password } = req.body;
    const matchingUser = await User.findOne({ email });

    if (matchingUser) {
        return res.status(409).json({ message: 'User is already registered' });
    }
    // Proceed to register
    const newUser = new User({ name, email, password });
    await newUser.save();
    
    const isAdmin = newUser.email === ADMIN_EMAIL && newUser.password === ADMIN_PASSWORD;
    req.session.user_id = newUser._id;
    req.session.admin = isAdmin;

    return res.json({
        userId: newUser._id,
        email: newUser.email,
        name: newUser.name, 
        isAdmin,
      });
}))

router.post('/login', wrapAsync(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isAdmin = user.email === ADMIN_EMAIL && user.password === ADMIN_PASSWORD;
    req.session.user_id = user._id;
    req.session.admin = isAdmin;

    return res.json({
        userId: user._id,
        email: user.email,
        name: user.name, 
        isAdmin,
      });
}));


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