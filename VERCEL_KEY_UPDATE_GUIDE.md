# Updating Stripe Keys in Vercel After Rotation

## Where to Update Keys: VERCEL DASHBOARD

Your project uses Vercel for deployment, so keys must be updated in **Vercel's Environment Variables**, NOT just local files.

## Step 1: Rotate Keys in Stripe
1. In Stripe Dashboard, select "in 7 days" expiration
2. Click "Rotate API key"
3. **COPY THE NEW SECRET KEY IMMEDIATELY** (shown only once)

## Step 2: Update in Vercel Dashboard

### Navigate to Environment Variables:
1. Go to: https://vercel.com/dashboard
2. Click on your project: **jaylataylor-fashion**
3. Go to: **Settings** tab
4. Click: **Environment Variables** (left sidebar)

### Update These Variables:
```
STRIPE_SECRET_KEY = sk_live_[YOUR_NEW_KEY_HERE]
STRIPE_PUBLISHABLE_KEY = pk_live_[YOUR_EXISTING_PK]
STRIPE_WEBHOOK_SECRET = whsec_[FROM_STRIPE_WEBHOOKS]
JAYLA_STRIPE_ACCOUNT_ID = acct_1DI4ATKrJePIAxsA
PLATFORM_FEE_PERCENTAGE = 10
JWT_SECRET = [KEEP_EXISTING_VALUE]
```

### Environment Scope:
- ✅ Production
- ✅ Preview
- ✅ Development (optional)

## Step 3: Redeploy to Apply Changes

### Option A: Automatic Redeploy
After saving environment variables, Vercel should prompt:
"Redeploy with new environment variables?" → Click **Redeploy**

### Option B: Manual Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots (⋮) menu
4. Select **Redeploy**

### Option C: Via Command Line
```bash
cd jaylataylor-website
vercel --prod
```

## Step 4: Update Webhook Secret

### In Stripe Dashboard:
1. Go to: **Developers** → **Webhooks**
2. Find: `https://jaylataylor.com/api/webhoks/stripe`
3. Click to view details
4. Copy the **Signing secret** (starts with `whsec_`)

### In Vercel Dashboard:
Add/Update environment variable:
```
STRIPE_WEBHOOK_SECRET = whsec_[COPIED_VALUE]
```

## Step 5: Verify Everything Works

### Test from Command Line:
```bash
# Check API health
curl https://jaylataylor.com/api/health

# Should return:
# {"status":"healthy","environment":"production"}
```

### Test Payment Flow:
1. Visit https://jaylataylor.com
2. Add item to cart
3. Proceed to checkout
4. Use test card: 4242 4242 4242 4242
5. Check Stripe Dashboard for successful payment

## Step 6: Update Local Development (Optional)

For local development, update your local `.env`:
```bash
cd jaylataylor-website/backend
nano .env
# Update STRIPE_SECRET_KEY with new value
```

## Important Notes:

1. **Vercel is Primary**: Production keys MUST be in Vercel, not just local files
2. **Instant Updates**: Changes apply immediately after redeployment
3. **Both Keys Work**: During 7-day transition, old and new keys both work
4. **Monitor Logs**: Check Vercel Functions logs for any errors

## Troubleshooting:

### If payments fail after update:
1. Check Vercel Functions logs: Dashboard → Functions → Logs
2. Verify environment variable names match exactly
3. Ensure no extra spaces in key values
4. Check webhook secret is updated

### If webhook fails:
1. Remember the typo: `/api/webhoks/stripe` (not webhooks)
2. Verify STRIPE_WEBHOOK_SECRET is set in Vercel
3. Check Stripe Dashboard webhook logs

## Security Reminder:
Your OLD keys were exposed in our conversation. The rotation is CRITICAL for security. After the 7-day transition period, the old keys will stop working completely.