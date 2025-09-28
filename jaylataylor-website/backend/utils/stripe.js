// Stripe Configuration
const Stripe = require('stripe');
require('dotenv').config();

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Verify Stripe is properly configured
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('WARNING: Stripe secret key is not configured!');
    console.error('Please set STRIPE_SECRET_KEY in your .env file');
}

module.exports = stripe;
