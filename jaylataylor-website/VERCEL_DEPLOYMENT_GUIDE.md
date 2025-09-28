# Vercel Deployment Guide for Jayla Taylor Website

## ✅ Deployment Fixes Implemented

The following issues have been resolved:

1. **Serverless Entry Point**: Created `api/index.js` with proper serverless-http wrapper
2. **Vercel Configuration**: Updated `vercel.json` with correct routing for hybrid frontend/backend
3. **Static File Serving**: Configured Vercel to handle static files with proper caching
4. **Environment Variables**: Made server compatible with Vercel's environment variable injection
5. **Package Dependencies**: Added root `package.json` for proper dependency resolution

## 🚀 Deployment Steps

### 1. Environment Variables (Required)

Set these environment variables in the Vercel Dashboard:

#### Required Stripe Variables
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard webhook settings)
```

#### Required Security Variables
```
JWT_SECRET=ab59c932c83b26a96d9dd378fddcd62f7d7794575d40612d53b9d89ae8f13d74e73a9e8d3816adbe722ad4ff80c32838b6d9ac6d25230dd08b7ad09916725799
NODE_ENV=production
```

#### Jayla's Stripe Connect Configuration
```
JAYLA_STRIPE_ACCOUNT_ID=acct_1DI4ATKrJePIAxsA
PLATFORM_FEE_PERCENTAGE=10
```

#### Optional Variables (with defaults)
```
FRONTEND_URL=https://your-domain.vercel.app
ALLOWED_ORIGINS=https://jaylataylor.com,https://www.jaylataylor.com
LOG_LEVEL=error
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Deploy to Vercel

```bash
# Make sure you're in the project root
cd jaylataylor-website

# Deploy to Vercel
vercel --prod

# Or use Vercel CLI for first-time setup
npx vercel
```

### 3. Configure Stripe Webhook

After deployment, update your Stripe webhook endpoint:
- **Endpoint URL**: `https://your-domain.vercel.app/api/webhook`
- **Events**: `payment_intent.succeeded`, `payment_intent.payment_failed`

## 🔧 Architecture Overview

### File Structure
```
jaylataylor-website/
├── api/
│   └── index.js                 # Serverless entry point
├── backend/
│   ├── server-secured.js        # Main Express app
│   ├── routes/                  # API route handlers
│   ├── middleware/              # Security middleware
│   └── utils/                   # Helper utilities
├── css/, js/, assets/           # Frontend static files
├── *.html                       # Static HTML pages
├── package.json                 # Root dependencies
└── vercel.json                  # Vercel configuration
```

### Routing Configuration

The new `vercel.json` handles:
- **API Routes**: `/api/*` → `api/index.js` (Express serverless function)
- **Health Check**: `/health` → `api/index.js`
- **Static Assets**: CSS, JS, images served directly with caching
- **HTML Pages**: Served directly from root
- **Homepage**: `/` → `index.html`

### Security Features Enabled

- ✅ Rate limiting
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ Session management
- ✅ Input sanitization
- ✅ Secure headers
- ✅ Payment mutex locks

## 🧪 Testing the Deployment

### 1. Health Check
```bash
curl https://your-domain.vercel.app/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "environment": "production"
}
```

### 2. API Endpoints
```bash
# Create payment session
curl -X POST https://your-domain.vercel.app/api/session/create

# Test payment intent (requires session token)
curl -X POST https://your-domain.vercel.app/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"cartItems": [{"id": "prod-001", "quantity": 1}]}'
```

### 3. Frontend Pages
- Homepage: `https://your-domain.vercel.app/`
- Shop: `https://your-domain.vercel.app/shop.html`
- Cart: `https://your-domain.vercel.app/cart.html`
- Checkout: `https://your-domain.vercel.app/checkout.html`

## ⚠️ Important Notes

### Environment Variable Security
- Never commit actual Stripe keys to git
- Use Vercel's environment variable management
- Stripe test keys start with `sk_test_` and `pk_test_`
- Production keys start with `sk_live_` and `pk_live_`

### Domain Configuration
After deployment, update:
1. Stripe webhook endpoint URL
2. CORS allowed origins in environment variables
3. Frontend API URLs if using custom domain

### Monitoring
- Check Vercel function logs for errors
- Monitor Stripe dashboard for payment issues
- Set up Vercel monitoring for uptime

## 🔄 Local Development

For local development, the server will run normally:

```bash
cd backend
npm install
npm run dev
```

The serverless detection prevents server startup when deployed to Vercel.

## 📊 Performance Optimizations

The deployment includes:
- Static asset caching (1 year max-age)
- Serverless function with 30s timeout
- Optimized Express middleware loading
- Production logging configuration

## 🛠️ Troubleshooting

### Common Issues

1. **404 on API routes**: Check environment variables are set
2. **CORS errors**: Verify ALLOWED_ORIGINS includes your domain
3. **Payment failures**: Confirm Stripe keys are correct
4. **Session errors**: Check JWT_SECRET is set

### Debug Commands
```bash
# Check deployment logs
vercel logs your-deployment-url

# Test local serverless function
node -e "const handler = require('./api/index.js'); console.log('Handler ready');"
```

The deployment should now work correctly with all the fixes implemented!