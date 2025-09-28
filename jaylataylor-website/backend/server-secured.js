// Secure Express Server Configuration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const winston = require('winston');

// Security middleware
const { securityHeaders } = require('./middleware/security');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const apiRoutes = require('./routes/api-secured');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure logger (no sensitive data logging)
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
    format: winston.format.json(),
    defaultMeta: { service: 'jaylataylor-backend' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Apply security headers first
app.use(securityHeaders);

// CORS configuration (restrictive)
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:8000',
            'http://localhost:3000',
            'https://jaylataylor.com',
            'https://www.jaylataylor.com'
        ];

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for webhook signature verification
        if (req.originalUrl === '/api/webhook') {
            req.rawBody = buf.toString('utf8');
        }
    }
}));

app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

// Request logging (sanitized)
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes with security
app.use('/api', apiRoutes);

// Webhook routes (including typo URL from Stripe)
const webhookRoutes = require('./routes/webhook-handler');
app.use('/api', webhookRoutes);

// Connect payment routes
const connectRoutes = require('./routes/connect-payments');
app.use('/api/connect', connectRoutes);

// Static file serving is handled by Vercel routing in production
// Only serve static files locally for development
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, '../')));

    app.get('*', (req, res) => {
        if (!req.url.startsWith('/api') && !req.url.startsWith('/health')) {
            res.sendFile(path.join(__dirname, '../index.html'));
        }
    });
}

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);


// Validate environment variables
const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    logger.error('Please check your .env file or Vercel environment variables');

    // Generate example .env if missing vars
    if (missingEnvVars.includes('JWT_SECRET')) {
        const crypto = require('crypto');
        const generatedSecret = crypto.randomBytes(64).toString('hex');
        logger.info(`Generated JWT_SECRET example: ${generatedSecret}`);
        logger.info('Add this to your .env file: JWT_SECRET=' + generatedSecret);
    }

    // Only exit in production if not running on Vercel (env vars may be set at runtime)
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL && require.main === module) {
        process.exit(1);
    }
}

// Start server only when run directly (not when required)
if (require.main === module && (process.env.NODE_ENV !== 'production' || !process.env.VERCEL)) {
    const server = app.listen(PORT, () => {
        logger.info(`🔐 Secure server running on port ${PORT}`);
        logger.info(`🛡️ Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`✅ Security features enabled:`);
        logger.info(`   - Rate limiting`);
        logger.info(`   - CSRF protection`);
        logger.info(`   - XSS prevention`);
        logger.info(`   - Session management`);
        logger.info(`   - Input sanitization`);
        logger.info(`   - Secure headers`);
        logger.info(`   - Payment mutex locks`);

        if (process.env.NODE_ENV === 'development') {
            logger.info(`📝 API Documentation: http://localhost:${PORT}/health`);
        }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        logger.info('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    });
} else {
    logger.info(`🔐 Serverless mode - app exported for Vercel`);
    logger.info(`🛡️ Environment: ${process.env.NODE_ENV || 'development'}`);
}

module.exports = app;