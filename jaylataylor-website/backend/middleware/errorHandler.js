// Global Error Handler Middleware

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
    }
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || null;

    // Log error for debugging (sanitized - no sensitive data)
    const sanitizedError = {
        message: err.message,
        statusCode: statusCode,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    };

    // Only log stack trace in development
    if (process.env.NODE_ENV === 'development') {
        sanitizedError.stack = err.stack;
        // Log body only for non-payment endpoints
        if (!req.path.includes('payment') && !req.path.includes('webhook')) {
            sanitizedError.body = req.body;
        }
    }

    console.error('Error:', sanitizedError);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        details = err.errors;
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    }

    // Stripe specific errors
    if (err.type && err.type.includes('Stripe')) {
        statusCode = 400;
        if (err.type === 'StripeCardError') {
            message = 'Card error: ' + err.message;
        } else if (err.type === 'StripeInvalidRequestError') {
            message = 'Invalid request to payment processor';
        } else if (err.type === 'StripeAPIError') {
            statusCode = 500;
            message = 'Payment processor error';
        }
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: message,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
    const error = new ApiError(404, `Not found - ${req.originalUrl}`);
    next(error);
};

module.exports = {
    ApiError,
    asyncHandler,
    errorHandler,
    notFound
};
