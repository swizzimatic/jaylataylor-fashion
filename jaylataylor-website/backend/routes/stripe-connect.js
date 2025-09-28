// Stripe Connect API Routes for PRSM Tech Marketplace
// Handles seller onboarding and payment processing with platform fees

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

// Platform fee percentage (10% for PRSM Tech)
const PLATFORM_FEE_PERCENTAGE = process.env.PLATFORM_FEE_PERCENTAGE || 10;

/**
 * POST /api/stripe-connect/create-platform-account
 * Creates a new connected account for a seller
 */
router.post('/create-platform-account', asyncHandler(async (req, res) => {
    const { email, businessName, businessType = 'individual' } = req.body;

    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    try {
        // Create a Standard connected account
        const account = await stripe.accounts.create({
            type: 'standard',
            email: email,
            metadata: {
                businessName: businessName || '',
                platform: 'PRSM Tech',
                createdAt: new Date().toISOString()
            }
        });

        console.log('Connected account created:', {
            accountId: account.id,
            email: email,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            accountId: account.id,
            message: 'Connected account created successfully'
        });
    } catch (error) {
        console.error('Error creating connected account:', error);
        throw new ApiError(500, 'Failed to create connected account', {
            error: error.message
        });
    }
}));

/**
 * POST /api/stripe-connect/onboard-seller
 * Creates an account link for seller onboarding
 */
router.post('/onboard-seller', asyncHandler(async (req, res) => {
    const { accountId, returnUrl, refreshUrl } = req.body;

    if (!accountId) {
        throw new ApiError(400, 'Account ID is required');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    
    try {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl || `${baseUrl}/seller-dashboard?refresh=true`,
            return_url: returnUrl || `${baseUrl}/seller-dashboard?success=true`,
            type: 'account_onboarding',
        });

        console.log('Account link created:', {
            accountId: accountId,
            url: accountLink.url,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            url: accountLink.url,
            expiresAt: accountLink.expires_at
        });
    } catch (error) {
        console.error('Error creating account link:', error);
        throw new ApiError(500, 'Failed to create onboarding link', {
            error: error.message
        });
    }
}));

/**
 * POST /api/stripe-connect/create-account-link
 * Creates a new account link for existing connected accounts
 */
router.post('/create-account-link', asyncHandler(async (req, res) => {
    const { accountId, type = 'account_onboarding' } = req.body;

    if (!accountId) {
        throw new ApiError(400, 'Account ID is required');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
    
    try {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${baseUrl}/seller-dashboard?refresh=true`,
            return_url: `${baseUrl}/seller-dashboard?updated=true`,
            type: type, // 'account_onboarding' or 'account_update'
        });

        res.json({
            success: true,
            url: accountLink.url,
            expiresAt: accountLink.expires_at
        });
    } catch (error) {
        console.error('Error creating account link:', error);
        throw new ApiError(500, 'Failed to create account link', {
            error: error.message
        });
    }
}));

/**
 * POST /api/stripe-connect/create-payment-intent
 * Creates a payment intent with destination charges for marketplace
 */
router.post('/create-payment-intent', asyncHandler(async (req, res) => {
    const { amount, sellerAccountId, cartItems, customerEmail } = req.body;

    // Validate required fields
    if (!amount || !sellerAccountId) {
        throw new ApiError(400, 'Amount and seller account ID are required');
    }

    // Calculate platform fee (10%)
    const platformFeeAmount = Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100));
    
    try {
        // Create payment intent with destination charge
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            // Platform fee configuration
            application_fee_amount: platformFeeAmount,
            // Destination for the remaining amount after platform fee
            transfer_data: {
                destination: sellerAccountId,
            },
            metadata: {
                platform: 'PRSM Tech',
                sellerAccountId: sellerAccountId,
                platformFee: platformFeeAmount,
                customerEmail: customerEmail || '',
                items: JSON.stringify(cartItems || []),
                timestamp: new Date().toISOString()
            }
        });

        console.log('Marketplace payment intent created:', {
            id: paymentIntent.id,
            amount: amount,
            platformFee: platformFeeAmount,
            sellerPayout: amount - platformFeeAmount,
            sellerAccountId: sellerAccountId,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            platformFee: platformFeeAmount,
            sellerPayout: amount - platformFeeAmount
        });
    } catch (error) {
        console.error('Error creating marketplace payment intent:', error);
        throw new ApiError(500, 'Failed to create payment intent', {
            error: error.message
        });
    }
}));

/**
 * GET /api/stripe-connect/account-status/:accountId
 * Gets the status of a connected account
 */
router.get('/account-status/:accountId', asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    if (!accountId) {
        throw new ApiError(400, 'Account ID is required');
    }

    try {
        const account = await stripe.accounts.retrieve(accountId);

        // Determine account status
        const isActive = account.charges_enabled && account.payouts_enabled;
        const requiresInfo = account.requirements && account.requirements.currently_due.length > 0;
        
        res.json({
            success: true,
            account: {
                id: account.id,
                email: account.email,
                businessProfile: account.business_profile,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                isActive: isActive,
                requiresInfo: requiresInfo,
                requirements: account.requirements,
                created: account.created,
                metadata: account.metadata
            }
        });
    } catch (error) {
        console.error('Error retrieving account status:', error);
        throw new ApiError(500, 'Failed to retrieve account status', {
            error: error.message
        });
    }
}));

/**
 * POST /api/stripe-connect/webhook
 * Handles Stripe Connect webhooks
 */
router.post('/webhook', 
    express.raw({ type: 'application/json' }), 
    asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('Webhook secret not configured!');
            throw new ApiError(500, 'Webhook configuration error');
        }

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                webhookSecret
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new ApiError(400, `Webhook Error: ${err.message}`);
        }

        // Handle Connect-specific events
        switch (event.type) {
            case 'account.updated':
                const accountUpdated = event.data.object;
                console.log('Connected account updated:', {
                    accountId: accountUpdated.id,
                    chargesEnabled: accountUpdated.charges_enabled,
                    payoutsEnabled: accountUpdated.payouts_enabled
                });
                break;

            case 'account.application.authorized':
                const accountAuthorized = event.data.object;
                console.log('Account authorized:', accountAuthorized.id);
                break;

            case 'account.application.deauthorized':
                const accountDeauthorized = event.data.object;
                console.log('Account deauthorized:', accountDeauthorized.id);
                // Handle account disconnection
                break;

            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                if (paymentIntent.transfer_data) {
                    console.log('Marketplace payment succeeded:', {
                        paymentIntentId: paymentIntent.id,
                        amount: paymentIntent.amount,
                        platformFee: paymentIntent.application_fee_amount,
                        sellerAccountId: paymentIntent.transfer_data.destination
                    });
                    // TODO: Send confirmation emails to buyer and seller
                }
                break;

            case 'transfer.created':
                const transfer = event.data.object;
                console.log('Transfer created to seller:', {
                    transferId: transfer.id,
                    amount: transfer.amount,
                    destination: transfer.destination
                });
                break;

            case 'payout.created':
                const payout = event.data.object;
                console.log('Payout created for seller:', {
                    payoutId: payout.id,
                    amount: payout.amount,
                    arrivalDate: payout.arrival_date
                });
                break;

            default:
                console.log(`Unhandled Connect event type: ${event.type}`);
        }

        res.status(200).json({ received: true });
    })
);

/**
 * GET /api/stripe-connect/dashboard-link/:accountId
 * Creates a login link for the Stripe Express Dashboard
 */
router.get('/dashboard-link/:accountId', asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    if (!accountId) {
        throw new ApiError(400, 'Account ID is required');
    }

    try {
        const loginLink = await stripe.accounts.createLoginLink(accountId);

        res.json({
            success: true,
            url: loginLink.url
        });
    } catch (error) {
        console.error('Error creating dashboard link:', error);
        throw new ApiError(500, 'Failed to create dashboard link', {
            error: error.message
        });
    }
}));

/**
 * GET /api/stripe-connect/balance/:accountId
 * Gets the balance for a connected account
 */
router.get('/balance/:accountId', asyncHandler(async (req, res) => {
    const { accountId } = req.params;

    if (!accountId) {
        throw new ApiError(400, 'Account ID is required');
    }

    try {
        const balance = await stripe.balance.retrieve({
            stripeAccount: accountId
        });

        res.json({
            success: true,
            balance: {
                available: balance.available,
                pending: balance.pending,
                connectReserved: balance.connect_reserved
            }
        });
    } catch (error) {
        console.error('Error retrieving balance:', error);
        throw new ApiError(500, 'Failed to retrieve balance', {
            error: error.message
        });
    }
}));

module.exports = router;