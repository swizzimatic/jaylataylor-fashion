// Main Express Server for Jayla Taylor Backend
// Payment Gateway with Stripe Integration

// Load environment variables
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import dependencies
const app = require('./app');

// Server configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log server startup
console.log('========================================');
console.log('Jayla Taylor Backend Server Starting...');
console.log(`Environment: ${NODE_ENV}`);
console.log(`Port: ${PORT}`);
console.log('========================================');

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// App, routes, and errors are mounted in app.js

// Validate required environment variables
function validateEnvironment() {
    const required = ['STRIPE_SECRET_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nPlease create a .env file based on .env.example');
        process.exit(1);
    }
    
    // Warn about optional but recommended variables
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn('⚠️  WARNING: STRIPE_WEBHOOK_SECRET not set');
        console.warn('   Webhook signature verification will fail');
    }
    
    console.log('✅ Environment variables validated');
}

// Start server
async function startServer() {
    try {
        // Validate environment
        validateEnvironment();
        
        // Start listening
        app.listen(PORT, () => {
            console.log('\n✅ Server started successfully!');
            console.log(`🚀 API running at: http://localhost:${PORT}`);
            console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8000'}`);
            console.log('\nAvailable endpoints:');
            console.log(`  GET  http://localhost:${PORT}/`);
            console.log(`  GET  http://localhost:${PORT}/api/health`);
            console.log(`  GET  http://localhost:${PORT}/api/config`);
            console.log(`  POST http://localhost:${PORT}/api/create-payment-intent`);
            console.log(`  POST http://localhost:${PORT}/api/webhook`);
            console.log('\n========================================');
            
            // Remind about Stripe test mode
            if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
                console.log('💳 Stripe is in TEST MODE');
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});

// Start the server
startServer();
