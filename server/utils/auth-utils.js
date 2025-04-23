import { User } from '../models.js'; // Import User model
import { wrapAsync } from './error-utils.js'; // Import wrapAsync for error handling

// Synchronous function to check if an email matches the admin email
export const checkIfEmailIsAdmin = (email) => {
    return email === process.env.ADMIN_EMAIL;
};

// Middleware to check if a user is logged in
export const isAuthenticated = (req, res, next) => {
    if (!req.session.user_id) {
        return res.status(401).json({ message: "Authentication required. Please log in." });
    }
    next();
};

// Middleware to check if the logged-in user is an admin
export const isAdminUser = wrapAsync(async (req, res, next) => {
    const userId = req.session.user_id;

    if (!userId) {
        // No user logged in
        return res.status(401).json({ message: "Authentication required." });
    }

    const user = await User.findById(userId);

    if (!user) {
        // User not found in DB (session might be stale)
        return res.status(401).json({ message: "Invalid session. Please log in again." });
    }

    if (user.email === process.env.ADMIN_EMAIL) {
        // User is admin, proceed to the next middleware/route handler
        return next();
    } else {
        // User is not admin
        return res.status(403).json({ message: "Forbidden: Admin access required." });
    }
});