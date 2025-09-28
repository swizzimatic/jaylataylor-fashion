// Express App (shared between local server and Vercel serverless)

const express = require('express');
const bodyParser = require('body-parser');
const corsMiddleware = require('./middleware/cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/api');
const stripeConnectRoutes = require('./routes/stripe-connect');

// Create Express app
const app = express();

// Apply CORS
app.use(corsMiddleware);

// Body parsing middleware
// Webhook needs raw body, while other endpoints need JSON
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook' || req.originalUrl === '/api/stripe-connect/webhook') {
        next();
    } else {
        bodyParser.json()(req, res, next);
    }
});

// Health route at root
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Jayla Taylor Payment Gateway API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            createPaymentIntent: 'POST /api/create-payment-intent',
            webhook: 'POST /api/webhook',
            config: '/api/config'
        }
    });
});

// Mount routes
app.use('/api', apiRoutes);
app.use('/api/stripe-connect', stripeConnectRoutes);

// 404 and global error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;


