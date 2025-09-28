// Stripe Connect Configuration for PRSM Tech Platform
// Jayla Taylor is a connected account seller on the platform

require('dotenv').config();
const Stripe = require('stripe');

// Initialize Stripe with PLATFORM (PRSM Tech) credentials
// NOT the connected account's credentials
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Platform configuration
const config = {
    // PRSM Tech Platform Settings
    platform: {
        name: 'PRSM Tech Marketplace',
        feePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '10'), // 10% platform fee
        fixedFee: parseFloat(process.env.PLATFORM_FIXED_FEE || '0'), // Optional fixed fee
        currency: 'usd'
    },

    // Jayla Taylor's Connected Account
    // This should come from database in production
    connectedAccounts: {
        jaylaTaylor: {
            accountId: process.env.JAYLA_STRIPE_ACCOUNT_ID || 'acct_1DI4ATKrJePIAxsA', // Her Connect account ID
            displayName: 'Jayla Taylor Fashion',
            email: 'jayla@jaylataylor.com',
            businessType: 'individual', // or 'company'
            capabilities: ['card_payments', 'transfers'],
            payoutSchedule: 'daily', // daily, weekly, monthly
            statementDescriptor: 'JAYLA TAYLOR'
        }
    },

    // Charge Types for Different Scenarios
    chargeTypes: {
        // Direct charge: Customer pays seller directly, platform takes fee
        direct: {
            method: 'direct',
            description: 'Payment goes directly to seller with platform fee'
        },
        // Destination charge: Platform processes payment, then transfers to seller
        destination: {
            method: 'destination',
            description: 'Platform processes payment and transfers to seller'
        },
        // Separate charges: Most control, platform holds funds temporarily
        separate: {
            method: 'separate',
            description: 'Platform holds funds and transfers separately'
        }
    },

    // Webhook endpoints for Connect events
    webhooks: {
        // Platform webhook endpoint
        platform: '/api/webhook',
        // Connect-specific webhook endpoint
        connect: '/api/connect/webhook',
        // Events to listen for
        events: [
            'account.updated',
            'account.application.authorized',
            'account.application.deauthorized',
            'capability.updated',
            'payment_intent.succeeded',
            'payment_intent.payment_failed',
            'charge.succeeded',
            'transfer.created',
            'transfer.paid',
            'payout.created',
            'payout.paid',
            'payout.failed'
        ]
    }
};

// Helper function to calculate platform fee
const calculatePlatformFee = (amount) => {
    const percentageFee = Math.round(amount * (config.platform.feePercentage / 100));
    const totalFee = percentageFee + config.platform.fixedFee;
    return totalFee;
};

// Get connected account by ID or use default (Jayla)
const getConnectedAccount = (accountId = null) => {
    // In production, fetch from database
    if (!accountId || accountId === 'jayla') {
        return config.connectedAccounts.jaylaTaylor;
    }

    // Look up other sellers if marketplace expands
    return config.connectedAccounts[accountId] || config.connectedAccounts.jaylaTaylor;
};

// Verify platform has access to connected account
const verifyAccountConnection = async (accountId) => {
    try {
        const account = await stripe.accounts.retrieve(accountId);
        return {
            connected: true,
            account: {
                id: account.id,
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                capabilities: account.capabilities,
                requirements: account.requirements
            }
        };
    } catch (error) {
        console.error('Account verification failed:', error);
        return {
            connected: false,
            error: error.message
        };
    }
};

// Create a payment intent with Connect
const createConnectedPaymentIntent = async (amount, accountId, chargeType = 'destination') => {
    const platformFee = calculatePlatformFee(amount);

    const params = {
        amount,
        currency: config.platform.currency,
        metadata: {
            platform: config.platform.name,
            seller: accountId,
            charge_type: chargeType
        }
    };

    switch (chargeType) {
        case 'direct':
            // Direct charge on connected account
            return await stripe.paymentIntents.create({
                ...params,
                application_fee_amount: platformFee
            }, {
                stripeAccount: accountId // Charge on connected account
            });

        case 'destination':
            // Destination charge - platform processes, auto-transfer to seller
            return await stripe.paymentIntents.create({
                ...params,
                transfer_data: {
                    amount: amount - platformFee, // Seller gets amount minus fee
                    destination: accountId
                }
            });

        case 'separate':
            // Separate charge - platform holds funds
            // Transfer happens separately after fulfillment
            return await stripe.paymentIntents.create(params);

        default:
            throw new Error('Invalid charge type');
    }
};

// Create a transfer to connected account (for separate charges)
const createTransfer = async (amount, accountId, chargeId = null) => {
    const params = {
        amount,
        currency: config.platform.currency,
        destination: accountId,
        metadata: {
            platform: config.platform.name
        }
    };

    // Link to original charge if provided
    if (chargeId) {
        params.source_transaction = chargeId;
    }

    return await stripe.transfers.create(params);
};

// Get account balance
const getAccountBalance = async (accountId = null) => {
    if (accountId) {
        // Get connected account balance
        return await stripe.balance.retrieve({
            stripeAccount: accountId
        });
    }
    // Get platform balance
    return await stripe.balance.retrieve();
};

// List transfers to/from connected account
const listTransfers = async (accountId, limit = 10) => {
    return await stripe.transfers.list({
        destination: accountId,
        limit
    });
};

// List payouts for connected account
const listPayouts = async (accountId, limit = 10) => {
    return await stripe.payouts.list({
        limit
    }, {
        stripeAccount: accountId
    });
};

// Create Express dashboard link for seller
const createDashboardLink = async (accountId) => {
    return await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.FRONTEND_URL}/seller/reauth`,
        return_url: `${process.env.FRONTEND_URL}/seller/dashboard`,
        type: 'account_onboarding'
    });
};

// Create login link for Express dashboard
const createLoginLink = async (accountId) => {
    return await stripe.accounts.createLoginLink(accountId);
};

module.exports = {
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
};