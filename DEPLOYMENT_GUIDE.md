# Deployment Guide - JayLaTaylor Website & PRSM Tech Marketplace

## Overview
This guide covers deploying both the frontend static site and backend API server for the JayLaTaylor e-commerce website with PRSM Tech Stripe Connect marketplace integration.

## Architecture Components
1. **Frontend**: Static HTML/CSS/JS site
2. **Backend**: Node.js/Express API server with Stripe integration
3. **Database**: Currently using local storage (Phase 2 will add database)
4. **Payment Processing**: Stripe Connect for marketplace payments
5. **Email Service**: Nodemailer with Gmail/SendGrid

## Frontend Deployment

### Option 1: Netlify (Recommended for Frontend)
1. **Connect GitHub Repository**
   ```bash
   # Push your code to GitHub first
   git init
   git add .
   git commit -m "Initial deployment"
   git remote add origin https://github.com/yourusername/jaylataylor-website.git
   git push -u origin main
   ```

2. **Deploy to Netlify**
   - Login to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect GitHub and select repository
   - Build settings:
     - Base directory: `jaylataylor-website`
     - Build command: (leave empty - static site)
     - Publish directory: `jaylataylor-website`
   - Click "Deploy site"

3. **Custom Domain Setup**
   - Go to Site settings > Domain management
   - Add custom domain: jaylataylor.com
   - Update DNS records with your domain provider

### Option 2: Vercel
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd jaylataylor-website
   vercel
   # Follow prompts
   ```

3. **Production Deployment**
   ```bash
   vercel --prod
   ```

### Option 3: GitHub Pages
1. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Source: Deploy from branch
   - Branch: main
   - Folder: / (root)
   - Save

## Backend Deployment

### Option 1: Render (Recommended - Free Tier Available)
1. **Create Render Account**
   - Sign up at [render.com](https://render.com)

2. **Deploy from GitHub**
   - New > Web Service
   - Connect GitHub repository
   - Settings:
     - Name: jaylataylor-backend
     - Region: Oregon (US West)
     - Branch: main
     - Root Directory: jaylataylor-website/backend
     - Build Command: `npm install`
     - Start Command: `node server.js`

3. **Environment Variables**
   Add in Render Dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://jaylataylor.com
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   PLATFORM_FEE_PERCENTAGE=10
   EMAIL_USER=noreply@jaylataylor.com
   EMAIL_PASSWORD=app_specific_password
   ```

### Option 2: Heroku
1. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**
   ```bash
   cd jaylataylor-website/backend
   heroku create jaylataylor-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set STRIPE_SECRET_KEY=sk_live_...
   heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_...
   heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
   heroku config:set PLATFORM_FEE_PERCENTAGE=10
   heroku config:set FRONTEND_URL=https://jaylataylor.com
   heroku config:set EMAIL_USER=noreply@jaylataylor.com
   heroku config:set EMAIL_PASSWORD=app_specific_password
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform
1. **Create App**
   - Login to DigitalOcean
   - Create > App Platform
   - Connect GitHub repository
   - Select branch and folder

2. **Configure**
   - Type: Web Service
   - Build Command: `npm install`
   - Run Command: `node server.js`
   - HTTP Port: 3001

3. **Environment Variables**
   Add all required environment variables in App settings

## Stripe Configuration

### 1. Production API Keys
1. Login to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to Production mode (toggle in dashboard)
3. Get production keys from Developers > API keys
4. Update backend environment variables

### 2. Webhook Setup
1. Go to Developers > Webhooks
2. Add endpoint:
   - Endpoint URL: `https://your-backend-url.com/api/webhook`
   - Events to listen:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.succeeded`
3. Copy webhook signing secret
4. Update `STRIPE_WEBHOOK_SECRET` environment variable

### 3. Stripe Connect Webhook
1. Add separate endpoint for Connect events:
   - Endpoint URL: `https://your-backend-url.com/api/stripe-connect/webhook`
   - Events:
     - `account.updated`
     - `account.application.authorized`
     - `account.application.deauthorized`
     - `transfer.created`
     - `payout.created`
2. Update `STRIPE_CONNECT_WEBHOOK_SECRET`

## Email Service Setup

### Option 1: Gmail with App Password
1. Enable 2-factor authentication on Gmail
2. Generate app-specific password:
   - Go to Google Account settings
   - Security > 2-Step Verification
   - App passwords
   - Generate password for "Mail"
3. Update environment variables:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=app_specific_password
   ```

### Option 2: SendGrid
1. Create SendGrid account
2. Get API key from Settings > API Keys
3. Update environment variable:
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   ```

## Frontend Configuration Updates

### 1. Update API Base URL
Edit `jaylataylor-website/js/main.js`:
```javascript
const cart = {
    apiBaseUrl: 'https://your-backend-url.com/api', // Update this
    // ...
}
```

Edit `jaylataylor-website/js/checkout.js`:
```javascript
const backendUrl = 'https://your-backend-url.com'; // Update this
```

Edit `jaylataylor-website/js/stripe-connect.js`:
```javascript
const API_BASE_URL = 'https://your-backend-url.com/api'; // Update this
```

### 2. Update Stripe Publishable Key
Edit `jaylataylor-website/js/checkout.js`:
```javascript
const stripe = Stripe('pk_live_your_publishable_key_here'); // Update this
```

## SSL/HTTPS Configuration

### Frontend (Netlify/Vercel)
- SSL is automatically provided
- Force HTTPS in domain settings

### Backend (Render/Heroku)
- SSL is automatically provided
- Ensure all API calls use HTTPS

### Custom Domain SSL
1. Use Cloudflare for free SSL
2. Or use Let's Encrypt certificates

## Testing Production Deployment

### 1. Frontend Tests
```bash
# Test homepage loads
curl https://jaylataylor.com

# Test static assets
curl https://jaylataylor.com/css/main.css

# Test shop page
curl https://jaylataylor.com/shop.html
```

### 2. Backend Tests
```bash
# Test health endpoint
curl https://your-backend-url.com/api/health

# Test CORS headers
curl -H "Origin: https://jaylataylor.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-backend-url.com/api/health
```

### 3. End-to-End Tests
1. Browse website
2. Add items to cart
3. Proceed to checkout
4. Complete test purchase (use Stripe test mode first)
5. Verify emails are sent
6. Test seller dashboard

## Monitoring & Maintenance

### 1. Application Monitoring
- **Render**: Built-in metrics dashboard
- **Heroku**: Heroku Metrics or New Relic
- **Custom**: Set up Google Analytics

### 2. Error Tracking
- Install Sentry for error tracking:
  ```bash
  npm install @sentry/node
  ```
- Add to server.js:
  ```javascript
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: 'your-sentry-dsn' });
  ```

### 3. Uptime Monitoring
- Use UptimeRobot or Pingdom
- Monitor endpoints:
  - `https://jaylataylor.com`
  - `https://your-backend-url.com/api/health`

## Backup & Recovery

### 1. Code Backup
- Keep GitHub repository up to date
- Enable GitHub branch protection for main branch

### 2. Environment Variables
- Document all environment variables
- Store securely in password manager
- Never commit to repository

### 3. Stripe Data
- Stripe maintains transaction history
- Export data regularly from Stripe Dashboard

## Scaling Considerations

### When to Scale
- Response times > 2 seconds
- Error rate > 1%
- Memory usage > 80%
- CPU usage consistently > 70%

### Scaling Options
1. **Vertical Scaling**: Upgrade to larger server
2. **Horizontal Scaling**: Add more server instances
3. **CDN**: Use Cloudflare for static assets
4. **Database**: Add PostgreSQL or MongoDB (Phase 2)

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Environment variables for sensitive data
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all forms
- [ ] SQL injection prevention (when database added)
- [ ] XSS protection headers
- [ ] CORS properly configured
- [ ] Regular dependency updates
- [ ] Strong password policy
- [ ] 2FA on all admin accounts

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL environment variable
   - Ensure backend CORS middleware is configured

2. **Stripe Webhook Failures**
   - Verify webhook secret is correct
   - Check webhook endpoint URL
   - Ensure raw body parsing for webhook route

3. **Email Not Sending**
   - Verify email credentials
   - Check spam folder
   - Review email service logs

4. **Cart Not Persisting**
   - Check localStorage in browser
   - Verify API endpoints are accessible
   - Check browser console for errors

## Support & Documentation

### Stripe Support
- Documentation: https://stripe.com/docs
- Support: https://support.stripe.com

### Platform Support
- Render: https://render.com/docs
- Heroku: https://devcenter.heroku.com
- Netlify: https://docs.netlify.com

### Contact
- Technical Support: tech@prsmtech.com
- Stripe Integration: payments@prsmtech.com

## Deployment Checklist

### Pre-Deployment
- [ ] All code committed to GitHub
- [ ] Environment variables documented
- [ ] Stripe account verified
- [ ] Email service configured
- [ ] SSL certificates ready
- [ ] Domain DNS configured

### Deployment
- [ ] Deploy backend to production
- [ ] Update environment variables
- [ ] Deploy frontend to production
- [ ] Update API URLs in frontend
- [ ] Configure Stripe webhooks
- [ ] Test payment flow

### Post-Deployment
- [ ] Verify all pages load
- [ ] Test cart functionality
- [ ] Complete test purchase
- [ ] Check email delivery
- [ ] Monitor error logs
- [ ] Set up uptime monitoring

---

## Quick Commands Reference

```bash
# Start local development
cd jaylataylor-website/backend
npm run dev

# Deploy to Heroku
git push heroku main

# Deploy to Render
git push origin main  # Render auto-deploys

# View Heroku logs
heroku logs --tail

# Restart Heroku app
heroku restart

# Update environment variable
heroku config:set KEY=value
```

---

Last Updated: January 2025
Version: 1.0.0