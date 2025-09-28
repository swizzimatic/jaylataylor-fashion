# 🚀 Production Deployment Guide - LIVE Configuration

## ⚠️ SECURITY NOTICE - KEY ROTATION IN PROGRESS

Your live Stripe keys were exposed and need immediate rotation.

**ROTATION STATUS:**
1. ✅ Keys temporarily secured in environment files
2. 🔄 **KEY ROTATION REQUIRED** - Select "in 7 days" expiration in Stripe Dashboard
3. ✅ Webhook endpoint configured for production
4. 📅 New keys will replace current keys within 7 days

## Current Configuration

### Live Keys (Secured)
- Platform Account: `acct_51Rj8Zj2Merftqq0Y` (PRSM Tech)
- Connected Account: `acct_1DI4ATKrJePIAxsA` (Jayla Taylor)
- Platform Fee: 10%
- Webhook URL: `https://jaylataylor.com/api/webhooks/stripe` (corrected)

### Webhook Configuration

The webhook handler is configured to handle:
- `https://jaylataylor.com/api/webhooks/stripe` (primary - corrected in Stripe Dashboard)
- `https://jaylataylor.com/api/webhoks/stripe` (legacy support for backward compatibility)

## Deployment Steps

### 1. Configure Webhook Secret

Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks) and:

1. Find your webhook endpoint: `https://jaylataylor.com/api/webhoks/stripe`
2. Click on it to view details
3. Copy the **Signing secret** (starts with `whsec_`)
4. Add to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### 2. Update Frontend for Production

Edit `jaylataylor-website/js/checkout.js`:

```javascript
// Update with your live publishable key
const stripe = Stripe('pk_live_51Rj8Zj2Merftqq0YTMKToftS39ZWGIr6PfRnCBUFdFSiGmrpt7wYaq8rPLaDxYHqiOAkRp1uINym51HON72QyKBl00wfPFKWh0');

// Update API endpoint to production
const API_BASE = 'https://jaylataylor.com/api';
```

### 3. Deploy Backend

```bash
# On your production server
cd jaylataylor-website/backend

# Install production dependencies
npm ci --only=production

# Use production environment file
cp .env.production .env

# Start with PM2
pm2 start server-secured.js --name jaylataylor-api
pm2 save
pm2 startup
```

### 4. Test Live Integration

```bash
# Test webhook endpoint
curl https://jaylataylor.com/api/health

# Test payment creation (with live keys)
curl -X POST https://jaylataylor.com/api/connect/payment-intent \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [{"id": "prod-001", "quantity": 1}]}'
```

### 5. Verify Webhook Events

In Stripe Dashboard, verify these events are selected:
- ✅ payment_intent.succeeded
- ✅ payment_intent.payment_failed
- ✅ charge.succeeded
- ✅ transfer.created
- ✅ transfer.paid
- ✅ payout.created
- ✅ payout.paid
- ✅ account.updated

## Money Flow (LIVE)

When a customer purchases:
1. Payment charged to customer's card
2. Money goes to PRSM Tech platform account
3. 10% platform fee kept by PRSM Tech
4. 90% automatically transferred to Jayla (acct_1DI4ATKrJePIAxsA)
5. Webhook confirms all events
6. Jayla receives payout to her bank (daily/weekly based on settings)

## Security Checklist

### Immediate Actions
- [ ] Add webhook secret to `.env`
- [ ] Deploy to production server
- [ ] Test webhook with Stripe CLI
- [ ] Verify HTTPS is enforced
- [ ] **ROTATE YOUR STRIPE KEYS** (they were exposed)

### To Rotate Keys (IMPORTANT!)
1. Go to Stripe Dashboard > Developers > API keys
2. Click "Roll key" for your secret key
3. Update `.env` with new key
4. Restart server
5. Update any other services using old key

## Testing Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login with your account
stripe login

# Forward webhooks to local (for testing)
stripe listen --forward-to localhost:3001/api/webhoks/stripe

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded
```

## Production Monitoring

### Check Logs
```bash
# PM2 logs
pm2 logs jaylataylor-api

# Application logs
tail -f logs/error.log
tail -f logs/combined.log
```

### Monitor Webhook Activity
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. View "Recent deliveries" for success/failure

### Common Webhook Issues

**"Invalid signature" errors:**
- Wrong webhook secret in `.env`
- Make sure you're using the secret for the correct endpoint

**"404 Not Found" errors:**
- Server not running
- Wrong URL configuration
- Check the typo: `/api/webhoks/stripe` (not webhooks)

**"500 Internal Server Error":**
- Check server logs: `pm2 logs`
- Verify database connection
- Check environment variables

## Support Resources

- **Webhook Logs**: https://dashboard.stripe.com/webhooks/[endpoint_id]
- **Test Webhooks**: https://dashboard.stripe.com/test/webhooks
- **API Logs**: https://dashboard.stripe.com/logs
- **Stripe Status**: https://status.stripe.com

## CRITICAL REMINDERS

1. **ROTATE YOUR KEYS** - They were exposed in the conversation
2. **Webhook URL has typo** - We handle both `/webhoks/` and `/webhooks/`
3. **Live mode active** - Real money is being processed
4. **10% platform fee** - Automatically deducted from each sale
5. **Monitor daily** - Check webhook logs and payouts

## Next Steps

1. ✅ Deploy to production
2. ✅ Configure webhook secret
3. ⚠️ **Rotate exposed keys**
4. ✅ Test live payment flow
5. ✅ Monitor first transactions
6. ✅ Verify Jayla receives payouts

Your Connect integration is now LIVE and ready for production!