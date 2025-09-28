// Secured API Routes for Payment Processing
const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const { validateCartItems } = require('../utils/productValidator');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const {
    verifySession,
    requireAuth,
    createSession
} = require('../middleware/auth');
const {
    rateLimiters,
    csrfProtection,
    sanitizeInput,
    validators,
    handleValidationErrors,
    acquirePaymentLock,
    releasePaymentLock
} = require('../middleware/security');

// For webhook endpoint - we need raw body
const bodyParser = require('body-parser');

/**
 * POST /api/session/create
 * Create a secure session for guest checkout
 */
router.post('/session/create',
    rateLimiters.auth,
    asyncHandler(async (req, res) => {
        // Create a guest session
        const sessionData = {
            type: 'guest',
            createdAt: new Date(),
            userAgent: req.headers['user-agent'],
            ip: req.ip
        };

        const { sessionId, token } = createSession(sessionData);

        res.json({
            success: true,
            token,
            expiresIn: 86400 // 24 hours in seconds
        });
    })
);

/**
 * POST /api/create-payment-intent
 * Create a Stripe Payment Intent for the user's order (SECURED)
 *
 * Expected body: { cartItems: [{ id: 'prod-001', quantity: 2 }, ...] }
 */
router.post('/create-payment-intent',
    rateLimiters.payment, // Rate limiting
    verifySession, // Session verification
    sanitizeInput, // Input sanitization
    validators.createPaymentIntent, // Input validation
    handleValidationErrors,
    csrfProtection.validate, // CSRF protection
    asyncHandler(async (req, res) => {
        const { cartItems } = req.body;

        // Get client identifier for mutex lock
        const clientId = req.sessionId || req.ip;
        let lockKey = null;

        try {
            // Acquire payment lock to prevent race conditions
            lockKey = await acquirePaymentLock(clientId);

            // Log incoming request (sanitized)
            console.log('Payment Intent Request:', {
                sessionId: req.sessionId,
                itemCount: cartItems.length,
                timestamp: new Date().toISOString()
            });

            // Validate cart items and calculate total
            const validation = validateCartItems(cartItems);

            // If validation failed, return error with details
            if (!validation.success) {
                if (validation.invalidItems.length > 0) {
                    const restrictedItemNames = validation.invalidItems.map(item => item.name);
                    throw new ApiError(400,
                        `Products from restricted collections cannot be purchased`,
                        {
                            restrictedItems: restrictedItemNames,
                            errors: validation.errors
                        }
                    );
                }

                throw new ApiError(400, 'Invalid cart items', { errors: validation.errors });
            }

            // Calculate amount in cents for Stripe
            const amountInCents = Math.round(validation.total * 100);

            // Create metadata for the payment
            const metadata = {
                sessionId: req.sessionId,
                items: JSON.stringify(validation.validItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }))),
                orderTotal: validation.total.toString(),
                timestamp: new Date().toISOString()
            };

            // Create Stripe Payment Intent with atomic operation
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: metadata,
                // Add idempotency key to prevent duplicate charges
                idempotencyKey: `${clientId}_${Date.now()}`
            });

            console.log('Payment Intent created:', {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                status: paymentIntent.status,
                sessionId: req.sessionId
            });

            // Send success response
            res.json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                amount: amountInCents,
                currency: 'usd'
            });

        } finally {
            // Always release the payment lock
            if (lockKey) {
                releasePaymentLock(lockKey);
            }
        }
    })
);

/**
 * POST /api/webhook
 * Handle Stripe webhook events (NO CSRF PROTECTION FOR WEBHOOKS)
 *
 * Note: This endpoint needs the raw body for signature verification
 */
router.post('/webhook',
    bodyParser.raw({ type: 'application/json' }),
    asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!endpointSecret) {
            console.error('Webhook secret not configured');
            throw new ApiError(500, 'Webhook configuration error');
        }

        let event;

        try {
            // Verify the webhook signature
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new ApiError(400, 'Invalid webhook signature');
        }

        // Handle the event
        console.log('Webhook event received:', {
            type: event.type,
            id: event.id,
            timestamp: new Date().toISOString()
        });

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('Payment successful:', {
                    id: paymentIntent.id,
                    amount: paymentIntent.amount,
                    metadata: paymentIntent.metadata
                });

                // TODO: Update order status in database
                // TODO: Send confirmation email
                // TODO: Clear cart for session

                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.log('Payment failed:', {
                    id: failedPayment.id,
                    error: failedPayment.last_payment_error?.message
                });

                // TODO: Send failure notification
                // TODO: Log for retry attempts

                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
        res.json({ received: true });
    })
);

/**
 * GET /api/csrf-token
 * Generate CSRF token for frontend
 */
router.get('/csrf-token',
    rateLimiters.general,
    verifySession,
    csrfProtection.generate,
    (req, res) => {
        res.json({
            success: true,
            csrfToken: res.locals.csrfToken
        });
    }
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        secure: true
    });
});

module.exports = router;