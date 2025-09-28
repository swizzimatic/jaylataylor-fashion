// Production Webhook Handler for Stripe
// Endpoint: https://jaylataylor.com/api/webhooks/stripe

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Production webhook endpoint matching Stripe configuration
 * URL: https://jaylataylor.com/api/webhooks/stripe
 *
 * Updated: Typo has been fixed in Stripe Dashboard
 */

// Primary webhook endpoint (corrected URL)
router.post('/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
);

// Keep legacy endpoint for backward compatibility during transition
router.post('/webhoks/stripe',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
);

async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];

    // Get the webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('⚠️ Webhook secret not configured in environment');
        return res.status(500).json({ error: 'Webhook not configured' });
    }

    let event;

    try {
        // Verify the webhook signature
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
        );
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // Log the event
    console.log(`📨 Webhook received: ${event.type}`);
    console.log('Event ID:', event.id);

    // Handle the event
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailure(event.data.object);
                break;

            case 'charge.succeeded':
                await handleChargeSuccess(event.data.object);
                break;

            case 'transfer.created':
                await handleTransferCreated(event.data.object);
                break;

            case 'transfer.paid':
                await handleTransferPaid(event.data.object);
                break;

            case 'payout.created':
                await handlePayoutCreated(event.data.object);
                break;

            case 'payout.paid':
                await handlePayoutPaid(event.data.object);
                break;

            case 'account.updated':
                await handleAccountUpdate(event.data.object);
                break;

            case 'checkout.session.completed':
                await handleCheckoutComplete(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        // Return success response
        res.json({ received: true, type: event.type });

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}

// Event Handlers

async function handlePaymentSuccess(paymentIntent) {
    console.log('✅ Payment succeeded:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
    });

    // Extract platform fee and seller amount
    if (paymentIntent.transfer_data) {
        const totalAmount = paymentIntent.amount;
        const sellerAmount = paymentIntent.transfer_data.amount;
        const platformFee = totalAmount - sellerAmount;

        console.log('💰 Payment distribution:', {
            total: totalAmount / 100,
            platformFee: platformFee / 100,
            sellerReceives: sellerAmount / 100,
            currency: paymentIntent.currency
        });
    }

    // TODO: Update order status in database
    // TODO: Send confirmation email to customer
    // TODO: Notify Jayla of new sale
}

async function handlePaymentFailure(paymentIntent) {
    console.log('❌ Payment failed:', {
        id: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message
    });

    // TODO: Send failure notification to customer
    // TODO: Log for retry attempts
}

async function handleChargeSuccess(charge) {
    console.log('💳 Charge succeeded:', {
        id: charge.id,
        amount: charge.amount,
        fee: charge.application_fee_amount,
        transfer: charge.transfer
    });
}

async function handleTransferCreated(transfer) {
    console.log('💸 Transfer to Jayla created:', {
        id: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency,
        destination: transfer.destination
    });
}

async function handleTransferPaid(transfer) {
    console.log('✅ Transfer paid to Jayla:', {
        id: transfer.id,
        amount: transfer.amount / 100,
        currency: transfer.currency
    });
}

async function handlePayoutCreated(payout) {
    console.log('🏦 Payout to bank initiated:', {
        id: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency,
        arrival_date: new Date(payout.arrival_date * 1000)
    });
}

async function handlePayoutPaid(payout) {
    console.log('✅ Payout completed:', {
        id: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency
    });
}

async function handleAccountUpdate(account) {
    console.log('🔄 Connected account updated:', {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
    });

    // Check if Jayla's account
    if (account.id === process.env.JAYLA_STRIPE_ACCOUNT_ID) {
        console.log('This is Jayla\'s account update');

        if (!account.charges_enabled) {
            console.log('⚠️ Jayla cannot accept charges - onboarding may be required');
        }

        if (!account.payouts_enabled) {
            console.log('⚠️ Jayla cannot receive payouts - bank info may be required');
        }
    }
}

async function handleCheckoutComplete(session) {
    console.log('🛒 Checkout session completed:', {
        id: session.id,
        amount_total: session.amount_total / 100,
        currency: session.currency,
        customer_email: session.customer_email
    });

    // TODO: Fulfill the order
    // TODO: Clear customer's cart
    // TODO: Send order confirmation
}

module.exports = router;