# Supabase Setup Guide for JaylaTaylor.com

This guide will walk you through setting up Supabase for your e-commerce platform.

## 📋 Prerequisites

- GitHub account (for OAuth)
- Stripe account with API keys
- Domain verified (jaylataylor.com)

## 🚀 Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name**: `jaylataylor-fashion`
   - **Database Password**: (Generate a strong password and save it!)
   - **Region**: `US East (N. Virginia)` (closest to your users)
   - **Plan**: Start with Free tier (upgrade later if needed)

## 📊 Step 2: Set Up Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click "Run" to create all tables and functions
5. Verify tables were created in the **Table Editor**

## 🔐 Step 3: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider:
   - Enable email confirmations: ON
   - Enable email signup: ON
   - Minimum password length: 8

3. Go to **Authentication** → **Email Templates**
4. Customize the confirmation email:
   ```html
   <h2>Welcome to Jayla Taylor Fashion!</h2>
   <p>Please confirm your email to complete your registration.</p>
   <a href="{{ .ConfirmationURL }}">Confirm Email</a>
   ```

## ⚡ Step 4: Deploy Edge Functions

### Install Supabase CLI:
```bash
# On macOS with Homebrew
brew install supabase/tap/supabase

# Or with npm
npm install -g supabase
```

### Login and Link Project:
```bash
# Login to Supabase
supabase login

# Link your project (you'll need project ref from dashboard)
cd /path/to/jaylataylor-website
supabase link --project-ref YOUR_PROJECT_REF
```

### Deploy Functions:
```bash
# Deploy all Edge Functions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy cart-sync
```

## 🔑 Step 5: Set Environment Variables

### In Supabase Dashboard:

1. Go to **Edge Functions** → **Functions**
2. Click on each function
3. Click "Secrets" tab
4. Add these environment variables:

```env
# Stripe Keys (PRODUCTION - use your live keys)
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY  # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET  # Get from Stripe Webhooks
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY  # Get from Stripe Dashboard

# Stripe Connect (if using platform model)
JAYLA_STRIPE_ACCOUNT_ID=acct_xxxxxxxxxxxxx  # Get from Stripe Connect dashboard
PLATFORM_FEE_PERCENTAGE=3  # PRSM Tech takes 3%

# Email Service (optional - for order confirmations)
SENDGRID_API_KEY=your_sendgrid_key  # Or use Supabase's built-in email
```

## 🌐 Step 6: Configure Frontend

1. Get your Supabase credentials:
   - Go to **Settings** → **API**
   - Copy **Project URL** and **Anon Key**

2. Update `jaylataylor-website/js/supabase-client.js`:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

3. Add Supabase script to your HTML pages:
```html
<!-- Add to cart.html, checkout.html, and any page using authentication -->
<script src="js/supabase-client.js"></script>
```

## 📦 Step 7: Import Product Data

1. Go to **SQL Editor**
2. Run this query with your products:

```sql
-- Import your existing products
SELECT import_products_from_json('[
  {
    "id": "bucket-hat-001",
    "name": "Classic Bucket Hat",
    "category": "bucket-hats",
    "price": 45.00,
    "inventory": 50,
    "sizes": ["S", "M", "L"],
    "colors": ["Black", "White", "Beige"],
    "images": ["https://jaylataylor.com/..."],
    "fabric": "100% Cotton",
    "available": true,
    "notForSale": false
  }
  -- Add all your products here
]'::jsonb);
```

## 🔗 Step 8: Set Up Stripe Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Set endpoint URL:
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.created`
   - `customer.updated`

5. Copy the webhook signing secret and add it to Supabase environment variables

## 🧪 Step 9: Test the Integration

### Test Cart Sync:
1. Open your website
2. Open browser console
3. Check for "✅ Cart backend online with Supabase"
4. Add items to cart
5. Refresh page - items should persist

### Test Authentication:
1. Click "Sign In" / "Create Account"
2. Register with a test email
3. Check email for confirmation
4. Sign in and verify cart syncs

### Test Checkout:
1. Add items to cart
2. Proceed to checkout
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete purchase
5. Check Supabase dashboard for order record

## 📊 Step 10: Monitor and Maintain

### Daily Monitoring:
- Check **Database** → **Usage** for storage and bandwidth
- Review **Authentication** → **Users** for new signups
- Monitor **Logs** → **Edge Functions** for errors

### Weekly Tasks:
- Review orders in database
- Check inventory levels
- Export customer emails for newsletter

### Monthly Tasks:
- Analyze sales reports
- Review and optimize slow queries
- Update product inventory

## 🚨 Troubleshooting

### Cart Shows Offline:
1. Check Supabase project is active
2. Verify API keys in `supabase-client.js`
3. Check browser console for errors
4. Ensure CORS is configured properly

### Payment Fails:
1. Verify Stripe keys in Edge Functions
2. Check webhook is receiving events
3. Review Edge Function logs
4. Ensure products have valid prices

### Authentication Issues:
1. Check email templates are configured
2. Verify confirmation emails are sending
3. Check user exists in database
4. Review auth provider settings

## 🎯 Next Steps

1. **Enable RLS Policies**: Secure your data with Row Level Security
2. **Set Up Backups**: Configure automatic daily backups
3. **Add Monitoring**: Set up alerts for errors and downtime
4. **Optimize Performance**: Add indexes for frequently queried columns
5. **Scale as Needed**: Upgrade plan when you exceed free tier limits

## 📞 Support

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: Report bugs in our repository

## 🎉 Congratulations!

Your e-commerce platform is now powered by Supabase with:
- ✅ Real-time cart synchronization
- ✅ Customer authentication
- ✅ Secure payment processing
- ✅ Order management system
- ✅ Inventory tracking
- ✅ Newsletter management

The backend is now professional, scalable, and ready for growth!