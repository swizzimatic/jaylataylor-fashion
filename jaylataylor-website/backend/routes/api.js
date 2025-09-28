// API Routes for Payment Processing
const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const { validateCartItems } = require('../utils/productValidator');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// For webhook endpoint - we need raw body
const bodyParser = require('body-parser');

/**
 * POST /api/create-payment-intent
 * Create a Stripe Payment Intent for the user's order
 * 
 * Expected body: { cartItems: [{ id: 'prod-001', quantity: 2 }, ...] }
 */
router.post('/create-payment-intent', asyncHandler(async (req, res) => {
    const { cartItems } = req.body;

    // Log incoming request for debugging
    console.log('Payment Intent Request:', { 
        cartItems, 
        timestamp: new Date().toISOString() 
    });

    // Validate cart items and calculate total
    const validation = validateCartItems(cartItems);

    // If validation failed, return error with details
    if (!validation.success) {
        console.error('Cart validation failed:', validation.errors);
        
        // Check if there are restricted items
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
        items: JSON.stringify(validation.validItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        }))),
        orderTotal: validation.total.toString(),
        timestamp: new Date().toISOString()
    };

    try {
        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: metadata
        });

        console.log('Payment Intent created:', {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status
        });

        // Send success response
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount: amountInCents,
            currency: 'usd'
        });

    } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        throw new ApiError(500, 'Failed to create payment intent', {
            type: stripeError.type,
            message: stripeError.message
        });
    }
}));

/**
 * POST /api/webhook
 * Handle Stripe webhook events
 * 
 * This endpoint receives events from Stripe about payment status
 */
router.post('/webhook', 
    // Use raw body for webhook signature verification
    bodyParser.raw({ type: 'application/json' }), 
    asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('Webhook secret not configured!');
            throw new ApiError(500, 'Webhook configuration error');
        }

        let event;

        try {
            // Verify webhook signature and construct event
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new ApiError(400, `Webhook Error: ${err.message}`);
        }

        // Log the event
        console.log('Webhook event received:', {
            type: event.type,
            id: event.id,
            timestamp: new Date().toISOString()
        });

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;
                console.log('Payment succeeded:', {
                    id: paymentIntentSucceeded.id,
                    amount: paymentIntentSucceeded.amount,
                    metadata: paymentIntentSucceeded.metadata
                });
                
                // TODO: In Phase 2 with Strapi CMS:
                // - Create order record in database
                // - Update inventory
                // - Send confirmation email
                // - Update customer purchase history
                
                break;

            case 'payment_intent.payment_failed':
                const paymentIntentFailed = event.data.object;
                console.error('Payment failed:', {
                    id: paymentIntentFailed.id,
                    amount: paymentIntentFailed.amount,
                    error: paymentIntentFailed.last_payment_error
                });
                
                // TODO: In Phase 2 with Strapi CMS:
                // - Log failed payment attempt
                // - Send failure notification to admin
                // - Update analytics
                
                break;

            case 'payment_method.attached':
                const paymentMethod = event.data.object;
                console.log('Payment method attached:', {
                    id: paymentMethod.id,
                    type: paymentMethod.type
                });
                break;

            case 'charge.succeeded':
                const charge = event.data.object;
                console.log('Charge succeeded:', {
                    id: charge.id,
                    amount: charge.amount,
                    payment_intent: charge.payment_intent
                });
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.status(200).json({ received: true });
    })
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Payment API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * GET /api/config
 * Get public configuration (useful for frontend)
 */
router.get('/config', (req, res) => {
    res.json({
        success: true,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * Cart Management Endpoints
 */

/**
 * GET /api/cart/:sessionId
 * Retrieve cart for a session
 */
router.get('/cart/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    // In a real application, you'd retrieve this from a database
    // For now, we'll return a success response since frontend handles storage
    res.json({
        success: true,
        message: 'Cart endpoint available',
        sessionId,
        timestamp: new Date().toISOString()
    });
}));

/**
 * POST /api/cart/:sessionId/add
 * Add item to cart
 */
router.post('/cart/:sessionId/add', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { productId, quantity, selectedColor, selectedSize } = req.body;
    
    console.log('Add to cart request:', { 
        sessionId, 
        productId, 
        quantity, 
        selectedColor, 
        selectedSize,
        timestamp: new Date().toISOString() 
    });
    
    // Validate required fields
    if (!productId || !quantity) {
        throw new ApiError(400, 'Product ID and quantity are required');
    }
    
    // In a real application, you'd:
    // 1. Validate the product exists
    // 2. Check inventory
    // 3. Save to database
    // 4. Return updated cart
    
    res.json({
        success: true,
        message: 'Item added to cart successfully',
        data: {
            sessionId,
            productId,
            quantity,
            selectedColor,
            selectedSize,
            addedAt: new Date().toISOString()
        }
    });
}));

/**
 * PUT /api/cart/:sessionId/update
 * Update cart item quantity
 */
router.put('/cart/:sessionId/update', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { productId, quantity } = req.body;
    
    console.log('Update cart request:', { 
        sessionId, 
        productId, 
        quantity,
        timestamp: new Date().toISOString() 
    });
    
    if (!productId || !quantity || quantity < 1) {
        throw new ApiError(400, 'Valid product ID and quantity are required');
    }
    
    res.json({
        success: true,
        message: 'Cart updated successfully',
        data: {
            sessionId,
            productId,
            quantity,
            updatedAt: new Date().toISOString()
        }
    });
}));

/**
 * DELETE /api/cart/:sessionId/remove/:productId
 * Remove item from cart
 */
router.delete('/cart/:sessionId/remove/:productId', asyncHandler(async (req, res) => {
    const { sessionId, productId } = req.params;
    
    console.log('Remove from cart request:', { 
        sessionId, 
        productId,
        timestamp: new Date().toISOString() 
    });
    
    res.json({
        success: true,
        message: 'Item removed from cart successfully',
        data: {
            sessionId,
            productId,
            removedAt: new Date().toISOString()
        }
    });
}));

/**
 * DELETE /api/cart/:sessionId/clear
 * Clear entire cart
 */
router.delete('/cart/:sessionId/clear', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    console.log('Clear cart request:', { 
        sessionId,
        timestamp: new Date().toISOString() 
    });
    
    res.json({
        success: true,
        message: 'Cart cleared successfully',
        data: {
            sessionId,
            clearedAt: new Date().toISOString()
        }
    });
}));

/**
 * POST /api/cart/sync
 * Sync cart from frontend to backend
 */
router.post('/cart/sync', asyncHandler(async (req, res) => {
    const { cartItems, sessionId } = req.body;
    
    console.log('Cart sync request:', { 
        sessionId,
        itemCount: cartItems ? cartItems.length : 0,
        timestamp: new Date().toISOString() 
    });
    
    // Validate cart items if provided
    if (cartItems && cartItems.length > 0) {
        const validation = validateCartItems(cartItems);
        
        if (!validation.success) {
            throw new ApiError(400, 'Invalid cart items', { errors: validation.errors });
        }
    }
    
    res.json({
        success: true,
        message: 'Cart synced successfully',
        data: {
            sessionId,
            itemCount: cartItems ? cartItems.length : 0,
            syncedAt: new Date().toISOString()
        }
    });
}));

module.exports = router;
