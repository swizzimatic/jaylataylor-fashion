# Jayla Taylor Backend - Payment Gateway

This is the backend server for the Jayla Taylor e-commerce website, providing secure payment processing through Stripe integration.

## Features

- **Secure Payment Processing**: Stripe integration for handling payments
- **Product Validation**: Server-side validation of products and prices
- **Collection Restrictions**: Only products from "Lingerie", "Accessories", and "Swim 2023" collections can be purchased
- **Webhook Support**: Handles Stripe webhook events for payment confirmation
- **CORS Configuration**: Secure cross-origin resource sharing
- **Error Handling**: Comprehensive error handling and logging

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Stripe account (for API keys)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` and add your Stripe keys:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:8000
```

### 3. Getting Stripe Keys

1. Sign up for a [Stripe account](https://stripe.com)
2. Navigate to the [Stripe Dashboard](https://dashboard.stripe.com)
3. Find your API keys in the Developers section
4. Use test keys for development (they start with `sk_test_` and `pk_test_`)

### 4. Setting Up Webhook Secret

To test webhooks locally, use the Stripe CLI:

```bash
# Install Stripe CLI (if not already installed)
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3001/api/webhook

# Copy the webhook signing secret that appears and add it to your .env file
```

## Running the Server

### Development Mode

```bash
npm run dev
```

This will start the server with nodemon for auto-reloading on file changes.

### Production Mode

```bash
npm start
```

## API Endpoints

### `GET /`

Health check and API information

### `GET /api/health`

API health status

### `GET /api/config`

Get public configuration (Stripe publishable key)

### `POST /api/create-payment-intent`

Create a Stripe payment intent

**Request Body:**

```json
{
  "cartItems": [
    {
      "id": "prod-001",
      "quantity": 2
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 59000,
  "currency": "usd"
}
```

### `POST /api/webhook`

Stripe webhook endpoint (requires webhook signature)

## Collection Restrictions

The server enforces the following business rules:

- ✅ **Purchasable Collections:**

  - Lingerie
  - Accessories
  - Swim 2023

- ❌ **Display Only (Not Purchasable):**
  - Timeless

Any attempt to purchase items from restricted collections will result in a 400 error.

## Testing

### Test with Stripe Test Cards

Use these test card numbers:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### Test Collection Restrictions

Try adding products from different collections to test the validation:

```bash
# This will succeed (Lingerie collection)
curl -X POST http://localhost:3001/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [{"id": "prod-001", "quantity": 1}]}'

# This will fail (Timeless collection)
curl -X POST http://localhost:3001/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"cartItems": [{"id": "prod-007", "quantity": 1}]}'
```

## Frontend Integration

Update the frontend `checkout.js` to point to your backend URL:

```javascript
const backendUrl = "http://localhost:3001"; // Adjust if needed
```

Also update the Stripe publishable key in `checkout.js`:

```javascript
const stripe = Stripe("pk_test_your_publishable_key_here");
```

## Production Deployment

1. Use environment variables for all sensitive data
2. Enable HTTPS (required for Stripe in production)
3. Update CORS settings to allow only your production domain
4. Use production Stripe keys (start with `sk_live_` and `pk_live_`)
5. Set up proper logging and monitoring
6. Configure webhook endpoint in Stripe Dashboard

## Troubleshooting

### Missing Environment Variables

If you see an error about missing environment variables, ensure your `.env` file is properly configured.

### CORS Errors

Make sure the `FRONTEND_URL` in your `.env` matches your frontend's URL.

### Webhook Signature Verification Failed

Ensure you're using the correct webhook secret and that the raw body is being passed to the webhook endpoint.

## Future Enhancements (Phase 2)

- Integration with Strapi CMS for product management
- Order management and tracking
- Email notifications
- Inventory management
- Customer accounts and order history
