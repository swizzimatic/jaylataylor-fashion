// CORS Middleware Configuration
const cors = require('cors');

// Configure CORS options
const getCorsOptions = () => {
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:8000',
        'http://localhost:3000', // Alternative frontend port
        'http://127.0.0.1:8000',
        'http://127.0.0.1:3000'
    ];

    return {
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Allow cookies to be sent
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
        exposedHeaders: ['stripe-signature']
    };
};

// Export configured CORS middleware
module.exports = cors(getCorsOptions());
