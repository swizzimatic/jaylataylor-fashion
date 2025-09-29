# 🔐 Vercel Environment Variables Setup Guide

## ⚠️ CRITICAL SECURITY ALERT

**PRODUCTION STRIPE KEYS WERE EXPOSED** in `.env.supabase.local`. These keys must be:
1. **ROTATED IMMEDIATELY** in Stripe Dashboard
2. **NEVER committed to version control**
3. **ONLY stored in Vercel Dashboard**

## Immediate Actions Required

### 1. Rotate Compromised Stripe Keys NOW
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Click "Roll key" next to each compromised key:
   - Secret Key (sk_live_...)
   - Webhook Secret (whsec_...)
3. Save the new keys securely

### 2. Configure Vercel Environment Variables

#### Access Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `jaylataylor-website`
3. Navigate to **Settings** → **Environment Variables**

#### Add Required Variables

Click "Add New" for each variable:

| Variable Name | Environment | Value Type | Where to Find |
|--------------|-------------|------------|---------------|
| `STRIPE_SECRET_KEY` | Production | Encrypted | Stripe Dashboard → API Keys |
| `STRIPE_PUBLISHABLE_KEY` | Production | Plain | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Production | Encrypted | Stripe Dashboard → Webhooks |
| `JAYLA_STRIPE_ACCOUNT_ID` | Production | Plain | Stripe Dashboard → Connect |
| `JWT_SECRET` | Production | Encrypted | Generate (see below) |
| `SESSION_SECRET` | Production | Encrypted | Generate (see below) |
| `PLATFORM_FEE_PERCENTAGE` | Production | Plain | `10` |

#### Generate Security Tokens

Run these commands locally to generate secure tokens:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Optional Variables (if using)

| Variable Name | Purpose | Where to Find |
|--------------|---------|---------------|
| `SUPABASE_URL` | Database | Supabase Dashboard |
| `SUPABASE_ANON_KEY` | Database | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Database | Supabase Dashboard (keep secret!) |
| `SENDGRID_API_KEY` | Email | SendGrid Dashboard |

## Local Development Setup

### For Local Testing Only

1. Copy the template:
```bash
cp .env.template .env.local
```

2. Add **TEST** keys only:
```env
# Use TEST keys for local development
STRIPE_SECRET_KEY=sk_test_... # TEST key only!
STRIPE_PUBLISHABLE_KEY=pk_test_... # TEST key only!
```

### Never Do This
- ❌ Never commit .env files
- ❌ Never use production keys locally
- ❌ Never share keys in chat/email/slack
- ❌ Never hardcode keys in JavaScript

## Verification Steps

### 1. Check Vercel Deployment
```bash
vercel env ls
```

### 2. Test Production Deployment
After adding variables, redeploy:
```bash
vercel --prod --yes
```

### 3. Verify API Health
```bash
curl https://www.jaylataylor.com/api/health
```

## Security Best Practices

### Key Rotation Schedule
- **Immediate**: If keys are exposed (like now!)
- **Quarterly**: Regular rotation for security
- **After team changes**: When developers leave

### Access Control
- Only admin users should access production keys
- Use Vercel's team features for access control
- Enable 2FA on Stripe and Vercel accounts

### Monitoring
- Enable Stripe webhook logs
- Monitor for unusual payment patterns
- Set up alerts for failed payments

## Emergency Contact

If keys are compromised:
1. **Immediately rotate keys** in Stripe Dashboard
2. **Update Vercel environment** variables
3. **Redeploy application** with `vercel --prod`
4. **Monitor for unauthorized usage** in Stripe Dashboard

## Checklist for Current Situation

- [ ] Rotate all Stripe keys in Dashboard
- [ ] Add new keys to Vercel Environment Variables
- [ ] Delete any local .env files with production keys
- [ ] Verify .gitignore includes all .env patterns
- [ ] Redeploy application with new keys
- [ ] Test payment flow with TEST cards
- [ ] Monitor Stripe Dashboard for unauthorized activity
- [ ] Enable Stripe webhook signature verification

---

**Remember**: Production keys should ONLY exist in:
1. Stripe Dashboard (source)
2. Vercel Environment Variables (deployment)

Never anywhere else!