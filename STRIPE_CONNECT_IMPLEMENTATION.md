# 🎯 Stripe Connect Implementation Guide

## Platform Architecture: PRSM Tech + Jayla Taylor

This implementation correctly sets up **PRSM Tech as the platform** and **Jayla Taylor as a connected seller account**.

### ✅ Key Principle: You NEVER Use Connected Account Keys!

```javascript
// ❌ WRONG - Never do this:
const stripe = Stripe(jaylasSecretKey); // NO!

// ✅ CORRECT - Always do this:
const stripe = Stripe(yourPlatformSecretKey); // YES!
// Then reference Jayla by account ID only:
{ stripeAccount: 'acct_jaylasAccountId' }
```

## 📁 Files Created

### 1. **`config/stripe-connect.js`**
Central configuration for all Connect operations:
- Platform fee calculation (10%)
- Payment intent creation with proper destination charges
- Transfer and payout management
- Dashboard link generation

### 2. **`routes/connect-payments.js`**
API endpoints for Connect operations:
- `/api/connect/payment-intent` - Create payments with platform fee
- `/api/connect/webhook` - Handle Connect-specific webhooks
- `/api/connect/dashboard-url` - Get Stripe Express Dashboard link
- `/api/connect/balance` - Check Jayla's balance
- `/api/connect/transfers` - List transfers to Jayla
- `/api/connect/payouts` - List payouts to Jayla's bank

### 3. **`seller-dashboard.html`**
Frontend dashboard for Jayla to:
- View her balance (available & pending)
- See recent transfers from sales
- Track payouts to her bank
- Access Stripe Express Dashboard

## 🔧 Environment Configuration

Add these to your `.env` file:

```env
# PLATFORM Keys (PRSM Tech - YOUR keys)
STRIPE_SECRET_KEY=sk_live_YOUR_PLATFORM_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PLATFORM_KEY

# Jayla's Account ID (NOT her keys!)
JAYLA_STRIPE_ACCOUNT_ID=acct_xxxxxxxxxxxxx

# Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_platform_webhook
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_connect_webhook

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=10
```

## 💰 Payment Flow Explained

### How Money Moves:

1. **Customer pays $100** on Jayla's product
2. **Payment goes to PRSM platform account** first
3. **Platform automatically takes 10% fee** ($10)
4. **Remaining $90 transfers to Jayla** automatically
5. **Jayla receives daily/weekly payouts** to her bank

### The Code:
```javascript
// In connect-payments.js
const paymentIntent = await stripe.paymentIntents.create({
    amount: 10000, // $100 in cents
    currency: 'usd',

    // This is the magic - automatic transfer to Jayla
    transfer_data: {
        amount: 9000, // $90 to Jayla (after 10% fee)
        destination: 'acct_jaylasAccountId', // Just her ID!
    }
});
```

## 🔌 Webhook Configuration

### In Stripe Dashboard:

1. **Platform Webhook** (for general events):
   - URL: `https://yourdomain.com/api/webhook`
   - Events: `payment_intent.succeeded`, `charge.succeeded`

2. **Connect Webhook** (for Connect-specific events):
   - URL: `https://yourdomain.com/api/connect/webhook`
   - Events: `transfer.created`, `payout.paid`, `account.updated`

## 🚀 Integration Steps

### 1. Update Server to Use Connect Routes

```javascript
// In server.js or server-secured.js
const connectRoutes = require('./routes/connect-payments');
app.use('/api/connect', connectRoutes);
```

### 2. Update Frontend Checkout

```javascript
// In checkout.js - use Connect endpoint
const response = await fetch('/api/connect/payment-intent', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cartItems })
});
```

### 3. Test the Flow

```bash
# Test payment creation
curl -X POST http://localhost:3001/api/connect/payment-intent \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [{"id": "prod-001", "quantity": 1}]}'

# Check Jayla's balance
curl http://localhost:3001/api/connect/balance

# Get dashboard link
curl http://localhost:3001/api/connect/dashboard-url
```

## 📊 Seller Dashboard Features

The seller dashboard (`seller-dashboard.html`) provides:

- **Real-time Balance**: Available and pending funds
- **Transfer History**: All payments from customers
- **Payout Tracking**: Bank transfers status
- **Stripe Dashboard Access**: Direct link to Express Dashboard
- **Account Status**: Charges/payouts enabled status

## ⚠️ Important Security Notes

### DO:
- ✅ Use YOUR platform keys in the code
- ✅ Reference Jayla by account ID only
- ✅ Let Stripe handle the money movement
- ✅ Use destination charges for automatic transfers
- ✅ Verify webhook signatures

### DON'T:
- ❌ Store or use Jayla's API keys
- ❌ Try to charge "as" the connected account
- ❌ Handle transfers manually (unless using separate charges)
- ❌ Expose account IDs to public

## 🧪 Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/connect/webhook

# Trigger test events
stripe trigger payment_intent.succeeded \
  --override payment_intent:transfer_data.destination=acct_jaylasAccountId

# Create test connected account (if needed)
stripe accounts create \
  --type=express \
  --country=US \
  --email=jayla@test.com
```

## 📈 Monitoring & Reporting

### Platform Dashboard Metrics:
- Total sales volume
- Platform fees collected
- Number of successful transfers
- Active seller accounts

### Seller Metrics (Jayla):
- Sales revenue (after fees)
- Pending payouts
- Transfer history
- Customer transaction details

## 🔄 Common Scenarios

### Scenario 1: Regular Sale
```javascript
// Customer buys $50 item
// Platform gets $5 (10%)
// Jayla gets $45
// Automatic transfer happens immediately
```

### Scenario 2: Refund
```javascript
// Refund initiated on platform account
// Platform fee automatically returned
// Money pulled back from Jayla's balance
```

### Scenario 3: Failed Payout
```javascript
// If Jayla's bank rejects payout
// Funds return to her Stripe balance
// She can update bank details and retry
```

## 🎉 Implementation Complete!

Your Stripe Connect implementation is now properly configured with:

1. ✅ Platform account (PRSM Tech) handling payments
2. ✅ Connected account (Jayla) receiving funds automatically
3. ✅ 10% platform fee deduction
4. ✅ Webhook handling for all Connect events
5. ✅ Seller dashboard for earnings tracking
6. ✅ Proper security (no exposed connected account keys)

### Next Steps:
1. Add Jayla's real Connect account ID to `.env`
2. Configure webhooks in Stripe Dashboard
3. Test with Stripe test mode first
4. Deploy and switch to live keys

Remember: **You're the platform, Jayla is the seller, and you only need her account ID!**