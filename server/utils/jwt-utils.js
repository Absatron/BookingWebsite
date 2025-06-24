import jwt from 'jsonwebtoken';
import { User } from '../models.js';
import { checkIfEmailIsAdmin } from './auth-utils.js';

// Generate JWT token
export const generateToken = (user) => {
    const isAdmin = checkIfEmailIsAdmin(user.email);
    
    const payload = {
        userId: user._id,
        email: user.email,
        name: user.name,
        isAdmin
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { 
            expiresIn: '1h',
            issuer: 'time-ticket-oasis'
        }
    );
};

// Verify JWT token
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error('JWT verification error:', error.message);
        return null;
    }
};

// JWT Authentication middleware
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        console.log('🔑 JWT Auth Debug:');
        console.log('   Auth header:', authHeader);
        console.log('   Token exists:', !!token);

        if (!token) {
            return res.status(401).json({ 
                message: 'Access token required',
                code: 'NO_TOKEN'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(403).json({ 
                message: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        // Verify user still exists in database
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(403).json({ 
                message: 'User no longer exists',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user is still verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                message: 'User email not verified',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        // Add user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            isAdmin: decoded.isAdmin
        };

        console.log('✅ JWT Auth successful for user:', decoded.email);
        next();
    } catch (error) {
        console.error('❌ JWT Auth error:', error);
        return res.status(500).json({ 
            message: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Optional JWT Authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            req.user = null;
            return next();
        }

        // Verify user still exists
        const user = await User.findById(decoded.userId);
        if (!user || !user.isVerified) {
            req.user = null;
            return next();
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            isAdmin: decoded.isAdmin
        };

        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        req.user = null;
        next();
    }
};

// Admin-only middleware
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({ 
            message: 'Admin access required',
            code: 'ADMIN_REQUIRED'
        });
    }

    next();
};
