# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Jayla Taylor's fashion design portfolio and e-commerce website featuring luxury collections including bucket hats, swimwear, and lingerie. The project combines a static frontend with an Express.js payment gateway backend.

## Common Development Commands

### Frontend Development (Static Site)
```bash
# Development server (use any simple HTTP server)
cd jaylataylor-website
python -m http.server 8000
# Or use Live Server extension in VS Code

# Alternative with Node.js http-server
npx http-server -p 8000
```

### Backend Development (Payment Gateway)
```bash
# Setup
cd jaylataylor-website/backend
npm install

# Development with auto-reload
npm run dev

# Production
npm start

# Environment setup
cp .env.example .env
# Edit .env with Stripe keys and configuration
```

### Product Data Management
```bash
# Validate product data structure
node -e "console.log(JSON.parse(require('fs').readFileSync('data/products.json', 'utf8')))"

# Backup product data before changes
cp data/products.json data/products.backup.json
```

## High-Level Architecture

### Frontend Architecture (Static HTML/CSS/JS)
```
jaylataylor-website/
├── index.html              # Homepage with hero section
├── shop.html              # Product catalog with filtering
├── cart.html              # Shopping cart management
├── checkout.html          # Stripe payment integration
├── gallery.html           # Fashion photography showcase
├── nyc-fashion-week.html  # NYC Fashion Week content
├── paris-fashion-week.html # Paris Fashion Week content
├── about.html             # Designer biography
├── contact.html           # Contact form
├── css/                   # Modular stylesheets per page
├── js/                    # Vanilla JavaScript modules
├── data/
│   └── products.json      # Product catalog data
└── assets/                # Images and media
```

### Backend Architecture (Express.js Payment Gateway)
```
backend/
├── server.js              # Main Express application
├── routes/
│   └── api.js            # Payment and webhook endpoints
├── middleware/
│   ├── cors.js           # CORS configuration
│   └── errorHandler.js   # Error handling middleware
├── utils/
│   ├── stripe.js         # Stripe configuration
│   └── productValidator.js # Server-side product validation
└── data/
    └── products.json     # Server-side product data mirror
```

### Data Flow Architecture
1. **Product Display**: Frontend loads from `data/products.json`
2. **Cart Management**: Local storage for cart persistence
3. **Payment Processing**: Frontend → Backend API → Stripe
4. **Collection Restrictions**: Server enforces purchasable collections

### Key Design Patterns

#### Collection-Based Purchase Restrictions
- **Purchasable**: `bucket-hats`, `swim`, `lingerie`
- **Display Only**: `timeless` (archive pieces, `notForSale: true`)
- Server validates all purchases against collection rules

#### Price Validation Flow
```javascript
// Frontend sends cart items with IDs and quantities
{ cartItems: [{ id: "prod-001", quantity: 2 }] }

// Backend validates against server-side product data
// Creates Stripe PaymentIntent with verified amounts
// Returns client secret for frontend completion
```

#### Responsive Image Architecture
- Product images hosted externally (jaylataylor.com domain)
- Gallery content organized by collection type
- Lazy loading implementation in gallery.js

## Configuration Requirements

### Environment Variables (.env)
```env
# Required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8000
```

### Stripe Integration Points
- **Frontend**: `js/checkout.js` requires publishable key
- **Backend**: Payment intent creation and webhook handling
- **Testing**: Use Stripe test cards (4242 4242 4242 4242)

## Content Management

### Product Data Structure
Each product requires:
- Unique ID, name, category, price
- Size and color options
- Fabric content details
- Image URLs and stock status
- Collection-specific metadata

### Image Organization
```
content/
├── Bucket Hats/           # Product photography
├── Swim Collection/       # Swimwear photos
├── Lingerie Collection/   # Intimate apparel
├── Timeless Collection/   # Archive pieces
├── Fashion Week Content/  # Event photography
└── Magazine Features/     # Press coverage
```

## Security Considerations

### Payment Security
- Server-side price validation prevents tampering
- Webhook signature verification for payment confirmation
- No sensitive data stored in frontend JavaScript

### Input Validation
- Product ID validation against server-side catalog
- Quantity limits and type checking
- Collection restriction enforcement

## Testing Strategy

### Backend API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Create payment intent
curl -X POST http://localhost:3001/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [{"id": "prod-001", "quantity": 1}]}'
```

### Frontend Testing
- Test cart functionality across browser refresh
- Verify responsive design on mobile devices
- Test payment flow with Stripe test cards
- Validate collection filtering and sorting

### Collection Restriction Testing
- Attempt purchase of `timeless` collection items (should fail)
- Verify purchasable collections work correctly
- Test mixed cart scenarios

## Deployment Considerations

### Frontend Deployment
- Static hosting (Netlify, Vercel, GitHub Pages)
- No build process required
- Update image paths for production domain

### Backend Deployment
- Node.js hosting (Heroku, DigitalOcean, AWS)
- Environment variables for production Stripe keys
- HTTPS required for Stripe in production
- Configure webhook endpoint in Stripe Dashboard

### Content Delivery
- Image optimization for web delivery
- CDN configuration for global performance
- Gallery content organization and compression