// Comprehensive Security Middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { body, validationResult } = require('express-validator');
const csrf = require('csrf');
const { getClientIdentifier } = require('./auth');

// CSRF token management
const tokens = new csrf();

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: getClientIdentifier,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const rateLimiters = {
    // Strict limit for payment intents
    payment: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        5, // 5 requests per window
        'Too many payment attempts, please try again later'
    ),

    // Moderate limit for cart operations
    cart: createRateLimiter(
        1 * 60 * 1000, // 1 minute
        30, // 30 requests per window
        'Too many cart operations, please slow down'
    ),

    // General API limit
    general: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        100, // 100 requests per window
        'Too many requests, please try again later'
    ),

    // Auth endpoints (login, register)
    auth: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        5, // 5 attempts per window
        'Too many authentication attempts, please try again later'
    )
};

// CSRF token generation and validation
const csrfProtection = {
    generate: (req, res, next) => {
        const secret = req.session?.csrfSecret || tokens.secretSync();
        const token = tokens.create(secret);

        // Store secret in session
        if (req.session) {
            req.session.csrfSecret = secret;
        }

        res.locals.csrfToken = token;
        next();
    },

    validate: (req, res, next) => {
        // Skip CSRF for webhook endpoints
        if (req.path === '/api/webhook') {
            return next();
        }

        const token = req.headers['x-csrf-token'] || req.body._csrf;
        const secret = req.session?.csrfSecret;

        if (!secret || !token || !tokens.verify(secret, token)) {
            return res.status(403).json({
                success: false,
                error: 'Invalid CSRF token'
            });
        }

        next();
    }
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Remove any MongoDB operators from req.body, req.query, req.params
    mongoSanitize.sanitize(req.body);
    mongoSanitize.sanitize(req.query);
    mongoSanitize.sanitize(req.params);

    // Additional XSS prevention for string inputs
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove script tags and dangerous attributes
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
                    .replace(/javascript:/gi, '');
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);

    next();
};

// Validation rules for different endpoints
const validators = {
    createPaymentIntent: [
        body('cartItems').isArray().withMessage('Cart items must be an array'),
        body('cartItems.*.id').isString().notEmpty().withMessage('Product ID is required'),
        body('cartItems.*.quantity').isInt({ min: 1, max: 100 }).withMessage('Invalid quantity')
    ],

    webhook: [
        // Webhook validation happens via Stripe signature
    ]
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Security headers configuration
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://api.stripe.com"],
            frameSrc: ["https://js.stripe.com"]
        }
    },
    crossOriginEmbedderPolicy: false
});

// Mutex locks for payment operations to prevent race conditions
const paymentMutex = new Map();

const acquirePaymentLock = async (identifier) => {
    const lockKey = `payment_${identifier}`;

    // Check if lock exists
    if (paymentMutex.has(lockKey)) {
        const lock = paymentMutex.get(lockKey);
        const now = Date.now();

        // If lock is older than 30 seconds, consider it stale
        if (now - lock.timestamp > 30000) {
            paymentMutex.delete(lockKey);
        } else {
            throw new Error('Payment already in progress');
        }
    }

    // Acquire lock
    paymentMutex.set(lockKey, {
        timestamp: Date.now()
    });

    return lockKey;
};

const releasePaymentLock = (lockKey) => {
    paymentMutex.delete(lockKey);
};

// Clean up stale locks periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, lock] of paymentMutex.entries()) {
        if (now - lock.timestamp > 30000) {
            paymentMutex.delete(key);
        }
    }
}, 60000); // Every minute

module.exports = {
    securityHeaders,
    rateLimiters,
    csrfProtection,
    sanitizeInput,
    validators,
    handleValidationErrors,
    acquirePaymentLock,
    releasePaymentLock
};