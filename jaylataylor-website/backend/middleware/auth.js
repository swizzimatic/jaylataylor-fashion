// Secure Authentication Middleware
const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

// Generate secure session token
const generateSecureToken = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
};

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || generateSecureToken();

// Session store (in production, use Redis)
const sessions = new Map();

// Create session
const createSession = (sessionData) => {
    const sessionId = generateSecureToken();
    const token = jwt.sign(
        {
            sessionId,
            ...sessionData,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        },
        JWT_SECRET
    );

    sessions.set(sessionId, {
        ...sessionData,
        createdAt: new Date(),
        lastAccess: new Date()
    });

    return { sessionId, token };
};

// Verify session
const verifySession = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            // Allow guest checkout but mark as unauthenticated
            req.isAuthenticated = false;
            req.session = null;
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const session = sessions.get(decoded.sessionId);

        if (!session) {
            throw new ApiError(401, 'Invalid session');
        }

        // Update last access
        session.lastAccess = new Date();
        sessions.set(decoded.sessionId, session);

        req.isAuthenticated = true;
        req.session = session;
        req.sessionId = decoded.sessionId;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Session expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Invalid token');
        }
        next(error);
    }
};

// Require authentication for sensitive endpoints
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated) {
        throw new ApiError(401, 'Authentication required');
    }
    next();
};

// Rate limit by session/IP
const getClientIdentifier = (req) => {
    if (req.sessionId) return req.sessionId;

    // Fall back to IP address for unauthenticated requests
    return req.ip ||
           req.headers['x-forwarded-for'] ||
           req.connection.remoteAddress;
};

// Clean up expired sessions (run periodically)
const cleanupSessions = () => {
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.createdAt.getTime() > expirationTime) {
            sessions.delete(sessionId);
        }
    }
};

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

module.exports = {
    generateSecureToken,
    createSession,
    verifySession,
    requireAuth,
    getClientIdentifier,
    sessions
};