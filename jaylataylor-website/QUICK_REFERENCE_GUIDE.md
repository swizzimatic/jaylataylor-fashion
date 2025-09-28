# Quick Reference Guide - Jayla Taylor E-Commerce Operations

## Daily 10-Minute Checklist ✅

### Morning Operations (Every Day)
1. **Check Stripe Dashboard** (3 min)
   - Login: https://dashboard.stripe.com
   - Review "Payments" tab for new orders
   - Check for any failed payments or issues

2. **Verify System Health** (2 min)
   - Visit: `https://yourbackend.com/api/health`
   - Should show: "Payment API is running"
   - If not working, contact technical support immediately

3. **Quick Test Purchase** (5 min)
   - Add item to cart on your website
   - Go through checkout with test card: `4242 4242 4242 4242`
   - Verify payment completes successfully

---

## Critical Information 🚨

### Live vs Test Mode
- **Test Keys**: Start with `sk_test_` and `pk_test_` (for testing only)
- **Live Keys**: Start with `sk_live_` and `pk_live_` (for real customers)
- **NEVER mix test and live keys**

### Collection Rules
- ✅ **Can Be Purchased**: Bucket Hats, Swim Collection, Lingerie Collection
- ❌ **Display Only**: Timeless Collection (these are archive pieces)

### Emergency Numbers
- **Stripe Support**: 1-888-926-2289 (24/7)
- **Hosting Provider**: [Your hosting support number]
- **Technical Emergency**: [Your developer contact]

---

## Common Customer Issues & Quick Fixes

### "My payment failed"
**Quick Response:**
1. "Let me help you with that immediately!"
2. Check Stripe dashboard for the specific error
3. Common fixes:
   - Try different card
   - Check card details are correct
   - Contact their bank to approve the transaction

### "I can't add Timeless collection items to cart"
**Quick Response:**
"The Timeless collection features archive pieces that are for display only and not available for purchase. Our current collections available for purchase are Bucket Hats, Swim Collection, and Lingerie Collection."

### "My order isn't going through"
**Steps:**
1. Check if backend API is running: `https://yourbackend.com/api/health`
2. If down, contact technical support immediately
3. Can process order manually through Stripe dashboard if needed

---

## Stripe Dashboard Quick Navigation

### Finding Information
- **All Payments**: Dashboard Home → Payments tab
- **Failed Payments**: Payments tab → Filter by "Failed"
- **Customer Details**: Click any payment → See customer info
- **Refunds**: Find payment → Click "Refund" button
- **Webhooks**: Developers → Webhooks (check if failing)

### Processing Refunds
1. Find the payment in Stripe dashboard
2. Click "Refund"
3. Enter amount (full or partial)
4. Click "Refund [amount]"
5. Customer gets refund in 5-10 business days

---

## Weekly Tasks (30 minutes every Sunday)

1. **Review Week's Sales** (10 min)
   - Total revenue
   - Best-selling products
   - Any patterns in failed payments

2. **Update Inventory** (10 min)
   - Check what's low in stock
   - Update `products.json` if items sold out
   - Set `"inStock": false` for unavailable items

3. **Test Full System** (10 min)
   - Complete purchase flow
   - Test each payment method
   - Verify mobile checkout works

---

## Red Flags - Contact Support Immediately 🚨

- Payment success rate below 90%
- Backend health check fails
- More than 5 payment failures in 1 hour
- Webhook delivery failures in Stripe dashboard
- Any security warnings from Stripe

---

## Customer Service Templates

### Payment Issue Response
"Hi [Name], I understand your payment didn't go through and I'm here to help! This can happen for a few reasons:

- Card details entered incorrectly
- Bank security settings blocking the transaction
- Insufficient funds

Could you please try:
1. Double-checking your card details
2. Using a different card if available
3. Contacting your bank to approve the transaction

If you're still having trouble, I can help process your order manually. Just reply with your preferred contact method!"

### Order Confirmation Template
"Thank you for your Jayla Taylor order! 

Your order #[ID] has been confirmed:
- Items: [List]
- Total: $[Amount]
- Estimated delivery: [Date]

You'll receive tracking information once your order ships (within 24 hours).

Thank you for supporting Jayla Taylor! 💕"

---

## Technical Notes for Developers

### Backend Endpoints
- Health Check: `GET /api/health`
- Create Payment: `POST /api/create-payment-intent`
- Webhook Handler: `POST /api/webhook`
- Config: `GET /api/config`

### Frontend Files
- Checkout Logic: `/js/checkout.js`
- Cart Management: `/js/main.js`
- Product Data: `/data/products.json`

### Key Configuration Files
- Backend Environment: `/backend/.env`
- Server Setup: `/backend/server.js`
- Payment Routes: `/backend/routes/api.js`

### Testing Cards
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Insufficient Funds: `4000 0000 0000 9995`

---

## Need More Help?

📖 **Full Documentation**: See `STRIPE_INTEGRATION_DOCUMENTATION.md`
🌐 **Stripe Docs**: https://stripe.com/docs
💬 **Stripe Support**: Live chat in dashboard when logged in

**Remember**: When in doubt, check the Stripe dashboard first - it has the most up-to-date information about payments and issues!