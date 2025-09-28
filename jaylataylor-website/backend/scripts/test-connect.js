#!/usr/bin/env node

/**
 * Test Script for Stripe Connect Integration
 * Verifies that Jayla's account (acct_1DI4ATKrJePIAxsA) is properly connected
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const JAYLA_ACCOUNT_ID = 'acct_1DI4ATKrJePIAxsA';

console.log('🔍 Testing Stripe Connect Integration');
console.log('=====================================\n');

async function testConnectSetup() {
    try {
        // 1. Verify Platform API Key
        console.log('1️⃣ Verifying Platform API Key...');
        const platformAccount = await stripe.accounts.retrieve();
        console.log('✅ Platform account verified:', {
            id: platformAccount.id,
            email: platformAccount.email
        });

    } catch (error) {
        console.log('❌ Platform API key invalid. Please check STRIPE_SECRET_KEY');
        console.error(error.message);
        return;
    }

    try {
        // 2. Verify Jayla's Connected Account
        console.log('\n2️⃣ Verifying Jayla\'s Connected Account...');
        const jaylasAccount = await stripe.accounts.retrieve(JAYLA_ACCOUNT_ID);

        console.log('✅ Connected account found:', {
            id: jaylasAccount.id,
            type: jaylasAccount.type,
            charges_enabled: jaylasAccount.charges_enabled,
            payouts_enabled: jaylasAccount.payouts_enabled,
            capabilities: jaylasAccount.capabilities
        });

        // Check account status
        if (!jaylasAccount.charges_enabled) {
            console.log('⚠️  Warning: Charges are not enabled for this account');
            console.log('   Jayla needs to complete onboarding');
        }

        if (!jaylasAccount.payouts_enabled) {
            console.log('⚠️  Warning: Payouts are not enabled for this account');
            console.log('   Bank account information may be required');
        }

    } catch (error) {
        console.log('❌ Cannot access Jayla\'s account:', JAYLA_ACCOUNT_ID);
        console.error('Error:', error.message);
        console.log('\nPossible issues:');
        console.log('1. The account ID is incorrect');
        console.log('2. Your platform doesn\'t have access to this account');
        console.log('3. The account needs to authorize your platform');
        return;
    }

    try {
        // 3. Test Creating a Payment Intent
        console.log('\n3️⃣ Testing Payment Intent Creation...');

        const amount = 10000; // $100.00
        const platformFee = Math.round(amount * 0.10); // 10% fee
        const sellerAmount = amount - platformFee;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            transfer_data: {
                amount: sellerAmount,
                destination: JAYLA_ACCOUNT_ID,
            },
            metadata: {
                test: 'true',
                platform: 'PRSM Tech',
                seller: 'Jayla Taylor'
            }
        });

        console.log('✅ Test payment intent created:', {
            id: paymentIntent.id,
            amount: amount,
            platform_fee: platformFee,
            seller_receives: sellerAmount,
            status: paymentIntent.status
        });

        // Cancel the test payment intent
        await stripe.paymentIntents.cancel(paymentIntent.id);
        console.log('   (Test payment intent cancelled)');

    } catch (error) {
        console.log('❌ Failed to create payment intent');
        console.error('Error:', error.message);
    }

    try {
        // 4. Check Balance Access
        console.log('\n4️⃣ Checking Balance Access...');

        const balance = await stripe.balance.retrieve({
            stripeAccount: JAYLA_ACCOUNT_ID
        });

        console.log('✅ Can access Jayla\'s balance:', {
            available: balance.available[0] || { amount: 0, currency: 'usd' },
            pending: balance.pending[0] || { amount: 0, currency: 'usd' }
        });

    } catch (error) {
        console.log('❌ Cannot access balance');
        console.error('Error:', error.message);
    }

    try {
        // 5. Test Dashboard Link Generation
        console.log('\n5️⃣ Testing Dashboard Link Generation...');

        const loginLink = await stripe.accounts.createLoginLink(JAYLA_ACCOUNT_ID);

        console.log('✅ Dashboard link created successfully');
        console.log('   URL expires in 5 minutes');

    } catch (error) {
        console.log('❌ Cannot create dashboard link');
        console.error('Error:', error.message);
    }

    // Summary
    console.log('\n📊 Summary');
    console.log('==========');
    console.log('Platform: PRSM Tech');
    console.log('Seller: Jayla Taylor');
    console.log('Account ID:', JAYLA_ACCOUNT_ID);
    console.log('Platform Fee: 10%');
    console.log('\n✨ Connect integration is ready for testing!');
    console.log('\n📝 Next Steps:');
    console.log('1. Ensure Jayla completes Stripe onboarding if not done');
    console.log('2. Test with real payment using test cards');
    console.log('3. Configure webhooks in Stripe Dashboard');
    console.log('4. Switch to live keys when ready for production');
}

// Run the test
testConnectSetup().catch(console.error);