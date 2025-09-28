# 🚀 Stripe Connect Quick Reference

## Jayla's Account Details

```
Account ID: acct_1DI4ATKrJePIAxsA
Platform Fee: 10%
Account Type: Express/Standard
```

## Essential Code Snippets

### Create Payment with Platform Fee

```javascript
// Customer pays $100, Jayla gets $90, PRSM gets $10
const paymentIntent = await stripe.paymentIntents.create({
    amount: 10000, // $100 in cents
    currency: 'usd',
    transfer_data: {
        amount: 9000, // $90 to Jayla (after 10% fee)
        destination: 'acct_1DI4ATKrJePIAxsA'
    }
});
```

### Check Jayla's Balance

```javascript
const balance = await stripe.balance.retrieve({
    stripeAccount: 'acct_1DI4ATKrJePIAxsA'
});
console.log('Available:', balance.available);
console.log('Pending:', balance.pending);
```

### Generate Dashboard Link

```javascript
const loginLink = await stripe.accounts.createLoginLink(
    'acct_1DI4ATKrJePIAxsA'
);
// Send loginLink.url to Jayla (expires in 5 min)
```

### List Recent Transfers

```javascript
const transfers = await stripe.transfers.list({
    destination: 'acct_1DI4ATKrJePIAxsA',
    limit: 10
});
```

## API Endpoints

```bash
# Create payment
POST /api/connect/payment-intent
Body: { "cartItems": [...] }

# Get balance
GET /api/connect/balance

# Get dashboard URL
GET /api/connect/dashboard-url

# List transfers
GET /api/connect/transfers

# List payouts
GET /api/connect/payouts

# Check account status
GET /api/connect/account-status
```

## Testing Commands

```bash
# Test the Connect setup
node scripts/test-connect.js

# Test payment creation
curl -X POST http://localhost:3001/api/connect/payment-intent \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [{"id": "prod-001", "quantity": 1}]}'

# Check account status
curl http://localhost:3001/api/connect/account-status
```

## Environment Variables

```env
# Your platform keys (PRSM Tech)
STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...

# Jayla's account (just the ID!)
JAYLA_STRIPE_ACCOUNT_ID=acct_1DI4ATKrJePIAxsA

# Platform settings
PLATFORM_FEE_PERCENTAGE=10

# Webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...
```

## Webhook Events to Handle

```javascript
// Payment successful - money transferred to Jayla
'payment_intent.succeeded'

// Transfer to Jayla created
'transfer.created'

// Payout to Jayla's bank
'payout.created'
'payout.paid'

// Account status changes
'account.updated'
```

## Common Operations

### Calculate Platform Fee
```javascript
const amount = 10000; // $100
const platformFee = Math.round(amount * 0.10); // $10
const sellerAmount = amount - platformFee; // $90
```

### Verify Account Can Accept Payments
```javascript
const account = await stripe.accounts.retrieve('acct_1DI4ATKrJePIAxsA');
if (account.charges_enabled && account.payouts_enabled) {
    // Good to go!
}
```

### Handle Refunds
```javascript
// Refund automatically pulls back from Jayla's balance
const refund = await stripe.refunds.create({
    payment_intent: 'pi_xxxxx',
    amount: 5000 // Partial refund of $50
});
```

## Important URLs

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Connect Settings**: https://dashboard.stripe.com/settings/connect
- **Webhook Endpoints**: https://dashboard.stripe.com/webhooks
- **Test Cards**: https://stripe.com/docs/testing

## Remember

✅ **DO**: Use YOUR platform keys
✅ **DO**: Reference Jayla by ID only
✅ **DO**: Let Stripe handle the money

❌ **DON'T**: Use Jayla's API keys
❌ **DON'T**: Store sensitive keys
❌ **DON'T**: Handle money manually

## Support

- **Stripe Connect Docs**: https://stripe.com/docs/connect
- **Express Accounts**: https://stripe.com/docs/connect/express-accounts
- **Testing Connect**: https://stripe.com/docs/connect/testing