# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL DEPLOYMENT WARNING

**NEVER** create or modify `vercel.json` files in subdirectories! The ONLY vercel.json should be at the repository root with this exact configuration:

```json
{
  "version": 2,
  "buildCommand": "echo 'No build required'",
  "outputDirectory": "jaylataylor-website",
  "framework": null
}
```

See `DEPLOYMENT_SAFEGUARDS.md` for full details on preventing 404 errors.

## Repository Overview

Jayla Taylor's luxury fashion e-commerce platform with static frontend and secure payment processing. The architecture separates presentation (static HTML/CSS/JS) from payment processing (Express.js/Stripe backend).

## Common Development Commands

### Frontend Development
```bash
# Start development server (from repository root)
cd jaylataylor-website && python -m http.server 8000
# OR
npx http-server jaylataylor-website -p 8000
```

### Backend Development (Payment Gateway)
```bash
cd jaylataylor-website/backend

# Install dependencies
npm install

# Development with auto-reload (uses nodemon)
npm run dev

# Production mode
npm start

# Security checks
npm run security-check
npm run security-fix

# Generate new security tokens
npm run generate-secrets
```

### Testing Payment Flow
```bash
# Test backend health
curl http://localhost:3001/api/health

# Test payment intent creation (use Stripe test card: 4242424242424242)
curl -X POST http://localhost:3001/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [{"id": "prod-001", "quantity": 1}]}'
```

### Deployment Commands
```bash
# Deploy to Vercel (from root, never from subdirectory!)
vercel --prod --yes

# Verify deployment
curl -I https://www.jaylataylor.com
```

## High-Level Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                   │
│         Static HTML/CSS/JS (jaylataylor-website/)        │
│  • Product catalog (shop.html + shop.js)                 │
│  • Shopping cart (localStorage + cart.html)              │
│  • Checkout flow (checkout.html + Stripe Elements)       │
└─────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────┐
│                    PAYMENT GATEWAY LAYER                 │
│          Express.js Backend (backend/server-secured.js)  │
│  • Price validation (server-side products.json)          │
│  • Stripe payment intents with platform fees             │
│  • Security middleware (helmet, rate limiting, CORS)     │
│  • Webhook processing for payment confirmation           │
└─────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                     │
│  • Stripe API (payment processing + Connect)             │
│  • Supabase (cart persistence - in development)          │
│  • Cloudinary (image CDN)                                │
└─────────────────────────────────────────────────────────┘
```

### Critical Data Flows

#### Payment Processing Flow
1. **Cart Creation**: User adds items → stored in localStorage
2. **Price Calculation**: Frontend calculates display price from `data/products.json`
3. **Payment Intent**: Backend validates prices against server-side `products.json`
4. **Stripe Processing**: Creates payment intent with 10% platform fee
5. **Webhook Confirmation**: Stripe webhook confirms successful payment

#### Security Architecture
```javascript
// Backend security layers (order matters!)
app.use(securityHeaders);        // helmet, CSP, HSTS
app.use(corsOptions);            // Whitelist specific origins
app.use(rateLimiter);            // Prevent abuse
app.use(sessionMiddleware);      // Secure sessions
app.use(validateRequest);        // Input sanitization
app.use(authenticateJWT);        // JWT verification (where needed)
```

#### Collection Restrictions
- **Purchasable Collections**: `bucket-hats`, `swim`, `lingerie`
- **Display-Only Collections**: `timeless` (notForSale: true)
- Enforcement happens at backend payment validation, not frontend

### Key JavaScript Modules

#### Frontend Modules
- `shop.js` / `shop-secured.js`: Product catalog and filtering logic
- `checkout.js`: Stripe Elements integration and payment flow
- `supabase-client.js`: Cart persistence (TODO: needs Supabase config)
- `security.js`: Frontend security utilities (XSS prevention)
- `stripe-connect.js`: Platform fee calculation and display

#### Backend Modules
- `server-secured.js`: Main Express app with all security middleware
- `routes/api-secured.js`: Payment endpoints with validation
- `middleware/security.js`: Security headers and protections
- `utils/stripe.js`: Stripe client configuration

### Environment Configuration

#### Required Environment Variables
```env
# Stripe (NEVER commit actual keys!)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
JAYLA_STRIPE_ACCOUNT_ID=acct_...

# Security
JWT_SECRET=[64-byte hex string]
SESSION_SECRET=[32-byte hex string]

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=10
```

#### Vercel Deployment Variables
All sensitive variables must be configured in Vercel Dashboard:
- Settings → Environment Variables
- Add for Production environment
- Never store in code or .env files in repository

### Product Data Structure

Products exist in two places (must stay synchronized):
- `jaylataylor-website/data/products.json` (frontend display)
- `jaylataylor-website/backend/data/products.json` (price validation)

```javascript
{
  "id": "unique-product-id",
  "name": "Product Name",
  "price": 299,              // Integer in dollars
  "category": "bucket-hats", // Must match collection rules
  "sizes": ["S", "M", "L"],
  "colors": ["Black", "White"],
  "fabric": "100% Cotton",
  "notForSale": false,       // true for timeless collection
  "images": ["url1", "url2"],
  "inStock": true
}
```

### Serverless Function Configuration

The project uses Vercel serverless functions via `jaylataylor-website/api/index.js`:
- Wraps the Express backend with `serverless-http`
- Validates environment variables on cold start
- Provides health checks and logging

### Testing Strategy

#### Payment Testing Checklist
1. Test with Stripe test cards (4242 4242 4242 4242)
2. Verify platform fee calculation (10% to PRSM Tech)
3. Check collection restrictions (timeless items should fail)
4. Validate webhook signature verification
5. Test rate limiting (100 requests per 15 minutes)

#### Security Testing
```bash
# Check for vulnerabilities
npm audit

# Test CORS restrictions
curl -H "Origin: https://malicious-site.com" http://localhost:3001/api/health

# Verify rate limiting
for i in {1..101}; do curl http://localhost:3001/api/health; done
```

## Deployment Safeguards

1. **Always deploy from repository root**: `vercel --prod`
2. **Never create subdirectory configs**: Only `/vercel.json`
3. **Check before deploying**: See `.github/DEPLOYMENT_CHECKLIST.md`
4. **Verify after deployment**: Test all critical paths

## Current Development Status

### Completed
- ✅ Static site with product catalog
- ✅ Stripe payment integration with platform fees
- ✅ Security middleware implementation
- ✅ Vercel deployment configuration

### In Progress
- 🔄 Supabase integration for cart persistence (credentials needed)
- 🔄 Email confirmation system (SendGrid setup required)

### TODO
- ⏳ Complete Stripe Connect onboarding for Jayla's account
- ⏳ Configure production Supabase instance
- ⏳ Implement order management dashboard