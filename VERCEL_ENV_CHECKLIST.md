# 🔐 Vercel Environment Variables Checklist

## Critical Environment Variables Required

### ✅ **Must be set in Vercel Dashboard → Settings → Environment Variables**

| Variable | Value | Status | Scope |
|----------|-------|--------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_[your_rotated_key]` | ⏳ Required | Production |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_51Rj8Zj2Merftqq0YTMKToftS39ZWGIr6PfRnCBUFdFSiGmrpt7wYaq8rPLaDxYHqiOAkRp1uINym51HON72QyKBl00wfPFKWh0` | ⏳ Required | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_dOLRDHjwOQFbjJR7dXpZNKmYE8p20EoM` | ⏳ Required | Production |
| `JAYLA_STRIPE_ACCOUNT_ID` | `acct_1DI4ATKrJePIAxsA` | ⏳ Required | Production |
| `PLATFORM_FEE_PERCENTAGE` | `10` | ⏳ Required | Production |
| `JWT_SECRET` | `22452869ddb175de0b71854a0e7700e9d93f9429b4cf166784534319d4a0b9e96ca6af2d2008f02338ffbb0188f38544bc9e3361b4511c7678852779628b2059` | ⏳ Required | Production |

### 🛠️ **Optional Environment Variables**

| Variable | Value | Purpose | Scope |
|----------|-------|---------|-------|
| `NODE_ENV` | `production` | Environment detection | Production |
| `FRONTEND_URL` | `https://jaylataylor.com` | CORS configuration | Production |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limiting window | Production |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Rate limiting max requests | Production |

## 🔍 **Verification Steps**

### Step 1: Check Environment Variables in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: **jaylataylor-fashion**
3. Go to **Settings** → **Environment Variables**
4. Verify all 6 required variables are present
5. Ensure they're set for **Production** scope

### Step 2: Test Deployment Status
After setting environment variables, the deployment should automatically trigger.

**Test with curl:**
```bash
# Health check (should return 200)
curl -I https://jaylataylor.com/health

# API health check (should return JSON)
curl https://jaylataylor.com/api/health
```

**Expected health response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-19T12:00:00.000Z",
  "environment": "production",
  "serverless": true,
  "security": {
    "stripe-connect": true,
    "webhook-secret": true,
    "jwt-auth": true,
    "jayla-account": true
  }
}
```

### Step 3: Monitor Function Logs
```bash
# Check Vercel function logs for startup messages
vercel logs jaylataylor.com --since 5m
```

**Look for these startup messages:**
```
🔐 Security features initialized:
   - JWT Authentication: ✅
   - Stripe Connect: ✅
   - Webhook Security: ✅
   - Platform Fee: 10%
```

## 🚨 **Troubleshooting**

### If deployment fails:
1. **Check missing variables**: Look for `❌ Missing environment variables` in logs
2. **Verify values**: Ensure no extra spaces or incorrect values
3. **Redeploy**: Sometimes Vercel needs a manual redeploy after env changes

### If functions show errors:
1. **Check import paths**: Ensure `../backend/server-secured` can be resolved
2. **Verify dependencies**: Check if all npm packages are properly installed
3. **Review build logs**: Look for compilation errors

### If Stripe integration fails:
1. **Key rotation**: Ensure you're using the NEW rotated secret key
2. **Webhook secret**: Verify the webhook secret from correct Stripe endpoint
3. **Account ID**: Confirm Jayla's account ID is correct

## 📋 **Post-Deployment Testing**

### Test Checklist:
- [ ] Health endpoint returns 200: `https://jaylataylor.com/health`
- [ ] API health shows all security features enabled
- [ ] Frontend loads correctly: `https://jaylataylor.com`
- [ ] Static assets load (CSS, JS, images)
- [ ] Payment flow can be initiated (test with Stripe test card)
- [ ] Webhook endpoint responds: `https://jaylataylor.com/api/webhooks/stripe`

### Test Payment Flow:
1. Visit `https://jaylataylor.com`
2. Add item to cart
3. Proceed to checkout
4. Use test card: `4242 4242 4242 4242`
5. Check Stripe Dashboard for:
   - Payment intent created
   - Platform fee applied (10%)
   - Transfer to Jayla's account
   - Webhook events received

## 🎯 **Success Criteria**

Your deployment is successful when:
✅ All 6 environment variables are set in Vercel
✅ Function logs show security features initialized
✅ Health endpoint returns all security features as `true`
✅ Frontend loads and is functional
✅ Test payment completes successfully
✅ Stripe webhook events are received and processed

## 📞 **Next Steps After Success**

1. **Rotate any test keys** to production keys if still using test mode
2. **Monitor function performance** for the first few transactions
3. **Set up monitoring** for webhook delivery and payment processing
4. **Document the deployment process** for future updates