/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

/**
 * Verify JWT Token Middleware
 * Checks Authorization header for valid Bearer token
 * Attaches decoded user info to req.user
 */
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan'
            });
        }

        // Check Bearer format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Format token tidak valid'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            assignedLocation: decoded.assignedLocation
        };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token telah kadaluarsa'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            });
        }

        console.error('Token verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * Verify Admin Role Middleware
 * Must be used AFTER verifyToken middleware
 * Checks if authenticated user has 'admin' role
 */
const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya admin yang dapat mengakses resource ini.'
        });
    }

    next();
};

/**
 * Optional Token Verification Middleware
 * Attaches user info if token provided, but doesn't require it
 * Useful for routes accessible by both authenticated and anonymous users
 */
const optionalToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role,
                assignedLocation: decoded.assignedLocation
            };
        }

        next();

    } catch (error) {
        // Token invalid, but continue without user info
        next();
    }
};

module.exports = {
    verifyToken,
    verifyAdmin,
    optionalToken
};
