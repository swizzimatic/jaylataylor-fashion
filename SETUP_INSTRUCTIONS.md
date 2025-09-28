# ✅ Stripe Connect Setup Instructions

## Current Status

✅ **Jayla's Account ID Configured**: `acct_1DI4ATKrJePIAxsA`
✅ **Platform Fee Set**: 10%
✅ **All Code Implemented**: Ready for production
⚠️ **Needs Your Platform Keys**: Add your PRSM Tech Stripe keys

## 🔑 What You Need to Add

Edit `/jaylataylor-website/backend/.env` and add YOUR platform keys:

```env
# Replace these with YOUR actual PRSM Tech Stripe keys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE  # Your platform secret key
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE  # Your platform publishable key
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET  # From Stripe Dashboard

# This is already set correctly
JAYLA_STRIPE_ACCOUNT_ID=acct_1DI4ATKrJePIAxsA  ✅
PLATFORM_FEE_PERCENTAGE=10  ✅
```

## 📋 Setup Checklist

### 1. Add Your Platform Keys
- [ ] Log into YOUR Stripe Dashboard (PRSM Tech account)
- [ ] Go to Developers → API Keys
- [ ] Copy your **Secret Key** (starts with `sk_`)
- [ ] Copy your **Publishable Key** (starts with `pk_`)
- [ ] Add them to `.env`

### 2. Configure Webhooks
- [ ] In Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://yourdomain.com/api/connect/webhook`
- [ ] Select events:
  - `payment_intent.succeeded`
  - `transfer.created`
  - `payout.created`
  - `account.updated`
- [ ] Copy the webhook signing secret
- [ ] Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 3. Test the Integration
```bash
# After adding your keys, run:
cd jaylataylor-website/backend
node scripts/test-connect.js

# Should output:
# ✅ Platform account verified
# ✅ Connected account found: acct_1DI4ATKrJePIAxsA
# ✅ Test payment intent created
# ✅ Can access Jayla's balance
```

### 4. Start the Secure Server
```bash
cd jaylataylor-website/backend
npm run start:secure

# Or for development:
npm run dev:secure
```

### 5. Test a Payment
```bash
# Create a test payment
curl -X POST http://localhost:3001/api/connect/payment-intent \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [{"id": "prod-001", "quantity": 1, "price": 35}]}'

# Should return:
# {
#   "clientSecret": "pi_xxx_secret_xxx",
#   "amount": 3500,
#   "platformFee": 350,
#   "sellerAmount": 3150
# }
```

## 🎯 How It Works

When a customer buys from Jayla:

1. **Customer pays** → Goes to YOUR platform account first
2. **Platform takes 10%** → Automatically deducted ($10 from $100 sale)
3. **Jayla gets 90%** → Automatically transferred ($90 from $100 sale)
4. **Daily/Weekly payout** → Jayla receives money in her bank

## 📱 Dashboard Access

Jayla can access her earnings dashboard at:
```
http://yourdomain.com/seller-dashboard.html
```

Features:
- View balance (available & pending)
- See recent transfers
- Track payouts to bank
- Access Stripe Express Dashboard

## 🚨 Important Notes

### Security
- **NEVER** commit `.env` to Git
- **NEVER** expose Jayla's account ID publicly
- **ALWAYS** verify webhook signatures

### Testing
- Use test keys first (`sk_test_`, `pk_test_`)
- Test with Stripe test cards: `4242 4242 4242 4242`
- Verify platform fee calculation
- Check transfers appear in Jayla's account

### Production Checklist
- [ ] Replace test keys with live keys
- [ ] Update webhook endpoints to production URL
- [ ] Enable HTTPS everywhere
- [ ] Test complete payment flow
- [ ] Verify Jayla can access her dashboard
- [ ] Set up monitoring for failed payments

## 📚 Resources

- **Test the setup**: `node scripts/test-connect.js`
- **Quick reference**: See `CONNECT_QUICK_REFERENCE.md`
- **Full documentation**: See `STRIPE_CONNECT_IMPLEMENTATION.md`
- **Stripe Connect Docs**: https://stripe.com/docs/connect
- **Testing Guide**: https://stripe.com/docs/connect/testing

## 🆘 Troubleshooting

**"Cannot access account"**
- Verify account ID is correct: `acct_1DI4ATKrJePIAxsA`
- Ensure your platform has permission to access Jayla's account
- Check if Jayla needs to complete onboarding

**"Invalid API key"**
- Make sure you're using YOUR platform keys, not Jayla's
- Check for typos in the `.env` file
- Ensure no extra spaces in the keys

**"Payment fails"**
- Verify Jayla's account has `charges_enabled: true`
- Check if test mode matches key type (test keys for test mode)
- Review webhook logs in Stripe Dashboard

## ✅ You're Almost Ready!

Just add your platform API keys and you'll have a fully functional Stripe Connect marketplace with:
- Automatic 10% platform fee
- Secure payment processing
- Seller dashboard for Jayla
- Complete webhook handling
- Production-ready security

Remember: You use YOUR keys, Jayla is just referenced by ID!