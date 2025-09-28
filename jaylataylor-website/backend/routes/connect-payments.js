// Stripe Connect Payment Routes for PRSM Tech Platform
// Properly implements marketplace payments with Jayla Taylor as connected seller

const express = require('express');
const router = express.Router();
const {
    stripe,
    config,
    calculatePlatformFee,
    getConnectedAccount,
    verifyAccountConnection,
    createConnectedPaymentIntent,
    createTransfer,
    getAccountBalance,
    listTransfers,
    listPayouts,
    createDashboardLink,
    createLoginLink
} = require('../config/stripe-connect');
const { validateCartItems } = require('../utils/productValidator');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// PLATFORM FEE CONFIGURATION
const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '10');

/**
 * CRITICAL: How Stripe Connect Works in This Implementation
 *
 * 1. PRSM Tech (You) = Platform Account (uses STRIPE_SECRET_KEY)
 * 2. Jayla Taylor = Connected Account (referenced by account ID only)
 * 3. Payment Flow: Customer -> Platform -> Seller (with fee deduction)
 * 4. Platform takes 10% fee automatically
 */

/**
 * POST /api/connect/payment-intent
 * Create payment intent with proper Connect configuration
 */
router.post('/payment-intent', asyncHandler(async (req, res) => {
    const { cartItems } = req.body;

    // Validate cart
    const validation = validateCartItems(cartItems);
    if (!validation.success) {
        throw new ApiError(400, 'Invalid cart items', validation.errors);
    }

    const amountInCents = Math.round(validation.total * 100);
    const platformFeeAmount = Math.round(amountInCents * (PLATFORM_FEE_PERCENTAGE / 100));

    // Get Jayla's connected account ID (from env or database)
    const jaylasAccountId = process.env.JAYLA_STRIPE_ACCOUNT_ID;

    if (!jaylasAccountId) {
        throw new ApiError(500, 'Seller account not configured');
    }

    try {
        // CORRECT CONNECT IMPLEMENTATION
        // Using DESTINATION charges (recommended for marketplaces)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',

            // This is the key part - transfers to connected account
            transfer_data: {
                // Jayla gets the amount minus platform fee
                amount: amountInCents - platformFeeAmount,
                destination: jaylasAccountId, // Just the account ID!
            },

            // Optional: charge on behalf of connected account
            // on_behalf_of: jaylasAccountId,

            metadata: {
                platform: 'PRSM Tech',
                seller: 'Jayla Taylor',
                platform_fee: platformFeeAmount,
                items: JSON.stringify(validation.validItems)
            },

            // Important: Use automatic payment methods
            automatic_payment_methods: {
                enabled: true,
            },

            // Statement descriptor shows on customer's bank statement
            statement_descriptor_suffix: 'JAYLA'
        });

        console.log('Connect Payment Intent created:', {
            id: paymentIntent.id,
            total: amountInCents,
            platformFee: platformFeeAmount,
            sellerReceives: amountInCents - platformFeeAmount
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            amount: amountInCents,
            platformFee: platformFeeAmount,
            sellerAmount: amountInCents - platformFeeAmount
        });

    } catch (error) {
        console.error('Connect payment error:', error);
        throw new ApiError(500, 'Payment processing failed', error.message);
    }
}));

/**
 * POST /api/connect/webhook
 * Handle Connect-specific webhook events
 */
router.post('/webhook',
    express.raw({ type: 'application/json' }),
    asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            throw new ApiError(400, 'Invalid signature');
        }

        // Handle Connect events
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('Payment successful:', {
                    id: paymentIntent.id,
                    amount: paymentIntent.amount,
                    transfer: paymentIntent.transfer_data
                });

                // The transfer to Jayla happens automatically with destination charges
                // No manual transfer needed!
                break;

            case 'charge.succeeded':
                const charge = event.data.object;
                console.log('Charge succeeded:', {
                    id: charge.id,
                    amount: charge.amount,
                    transfer: charge.transfer // Auto-created transfer ID
                });
                break;

            case 'transfer.created':
                const transfer = event.data.object;
                console.log('Transfer to seller created:', {
                    id: transfer.id,
                    amount: transfer.amount,
                    destination: transfer.destination
                });
                break;

            case 'payout.paid':
                const payout = event.data.object;
                console.log('Payout to seller completed:', {
                    id: payout.id,
                    amount: payout.amount
                });
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    })
);

/**
 * GET /api/connect/dashboard-url
 * Get Stripe Express Dashboard URL for Jayla
 */
router.get('/dashboard-url', asyncHandler(async (req, res) => {
    const jaylasAccountId = process.env.JAYLA_STRIPE_ACCOUNT_ID;

    if (!jaylasAccountId) {
        throw new ApiError(500, 'Seller account not configured');
    }

    try {
        // Create login link for Stripe Express Dashboard
        const loginLink = await stripe.accounts.createLoginLink(jaylasAccountId);

        res.json({
            success: true,
            url: loginLink.url,
            expiresAt: new Date(loginLink.created * 1000 + 300000) // 5 minutes
        });

    } catch (error) {
        console.error('Dashboard link error:', error);
        throw new ApiError(500, 'Failed to create dashboard link');
    }
}));

/**
 * GET /api/connect/account-status
 * Check Jayla's account status
 */
router.get('/account-status', asyncHandler(async (req, res) => {
    const jaylasAccountId = process.env.JAYLA_STRIPE_ACCOUNT_ID;

    if (!jaylasAccountId) {
        throw new ApiError(500, 'Seller account not configured');
    }

    try {
        const account = await stripe.accounts.retrieve(jaylasAccountId);

        res.json({
            success: true,
            account: {
                id: account.id,
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                requirements: account.requirements,
                capabilities: account.capabilities
            }
        });

    } catch (error) {
        console.error('Account status error:', error);
        throw new ApiError(500, 'Failed to retrieve account status');
    }
}));

/**
 * GET /api/connect/balance
 * Get Jayla's Stripe balance
 */
router.get('/balance', asyncHandler(async (req, res) => {
    const jaylasAccountId = process.env.JAYLA_STRIPE_ACCOUNT_ID;

    if (!jaylasAccountId) {
        throw new ApiError(500, 'Seller account not configured');
    }

    try {
        // Get balance for connected account
        const balance = await stripe.balance.retrieve({
            stripeAccount: jaylasAccountId // This is how you access connected account data
        });

        res.json({
            success: true,
            balance: {
                available: balance.available.map(b => ({
                    amount: b.amount,
                    currency: b.currency
                })),
                pending: balance.pending.map(b => ({
                    amount: b.amount,
                    currency: b.currency
                }))
            }
        });

    } catch (error) {
        console.error('Balance retrieval error:', error);
        throw new ApiError(500, 'Failed to retrieve balance');
    }
}));

/**
 * GET /api/connect/transfers
 * List recent transfers to Jayla
 */
router.get('/transfers', asyncHandler(async (req, res) => {
    const jaylasAccountId = process.env.JAYLA_STRIPE_ACCOUNT_ID;

    if (!jaylasAccountId) {
        throw new ApiError(500, 'Seller account not configured');
    }

    try {
        // List transfers to connected account
        const transfers = await stripe.transfers.list({
            destination: jaylasAccountId,
            limit: 10
        });

        res.json({
            success: true,
            transfers: transfers.data.map(t => ({
                id: t.id,
                amount: t.amount,
                currency: t.currency,
                created: new Date(t.created * 1000),
                description: t.description
            }))
        });

    } catch (error) {
        console.error('Transfer list error:', error);
        throw new ApiError(500, 'Failed to retrieve transfers');
    }
}));

/**
 * GET /api/connect/payouts
 * List Jayla's payouts (to her bank)
 */
router.get('/payouts', asyncHandler(async (req, res) => {
    const jaylasAccountId = process.env.JAYLA_STRIPE_ACCOUNT_ID;

    if (!jaylasAccountId) {
        throw new ApiError(500, 'Seller account not configured');
    }

    try {
        // List payouts for connected account
        const payouts = await stripe.payouts.list(
            { limit: 10 },
            { stripeAccount: jaylasAccountId } // Access connected account
        );

        res.json({
            success: true,
            payouts: payouts.data.map(p => ({
                id: p.id,
                amount: p.amount,
                currency: p.currency,
                arrival_date: new Date(p.arrival_date * 1000),
                status: p.status
            }))
        });

    } catch (error) {
        console.error('Payout list error:', error);
        throw new ApiError(500, 'Failed to retrieve payouts');
    }
}));

module.exports = router;