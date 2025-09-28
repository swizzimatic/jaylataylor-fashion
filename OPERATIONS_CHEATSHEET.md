# Operations Cheat Sheet - JayLaTaylor & PRSM Tech Marketplace

## Quick Reference Guide for Daily Operations

### 🚀 Starting the Application

#### Local Development
```bash
# Start backend server
cd jaylataylor-website/backend
npm run dev

# Start frontend (in new terminal)
cd jaylataylor-website
python -m http.server 8000
# Visit: http://localhost:8000
```

#### Production URLs
- Frontend: https://jaylataylor.com
- Backend API: https://jaylataylor-backend.herokuapp.com (update with actual URL)
- Seller Dashboard: https://jaylataylor.com/seller-dashboard.html

---

## 📦 Product Management

### Adding New Products

1. **Edit Product Data File**
   ```bash
   # Edit the products.json file
   jaylataylor-website/data/products.json
   ```

2. **Product Structure**
   ```json
   {
     "id": "prod-XXX",
     "name": "Product Name",
     "category": "bucket-hats|swim|lingerie",
     "price": 99.99,
     "description": "Product description",
     "sizes": ["S", "M", "L"],
     "colors": ["Color1", "Color2"],
     "images": ["https://jaylataylor.com/assets/images/product.jpg"],
     "featured": true,
     "inStock": true,
     "fabricContent": {
       "shell": "Material description",
       "lining": "Lining material"
     }
   }
   ```

3. **Update Both Locations**
   - Frontend: `jaylataylor-website/data/products.json`
   - Backend: `jaylataylor-website/backend/data/products.json`

### Product Categories
- ✅ **Purchasable**: bucket-hats, swim, lingerie
- ❌ **Display Only**: timeless (set `notForSale: true`)

### Updating Prices
1. Edit products.json
2. Update both frontend and backend copies
3. Restart backend server if running

---

## 💳 Stripe Dashboard Navigation

### Accessing Stripe Dashboard
1. **Login**: https://dashboard.stripe.com
2. **Credentials**: (Store securely - never share)
   - Email: _____________
   - Password: _____________

### Key Sections

#### Payments
- **View Transactions**: Payments > All transactions
- **Refund a Payment**: 
  1. Find transaction
  2. Click on payment
  3. Click "Refund" button
  4. Enter amount and reason

#### Connected Accounts
- **View Sellers**: Connect > Accounts
- **Account Details**: Click on account ID
- **Payouts**: Connect > Payouts
- **Platform Fees**: Connect > Application fees

#### Webhooks
- **View Webhooks**: Developers > Webhooks
- **Check Webhook Logs**: Click on endpoint > View attempts
- **Resend Failed Webhook**: Click on failed attempt > Resend

### Common Stripe Tasks

#### Issue Refund
```
1. Stripe Dashboard > Payments
2. Find transaction
3. Click payment ID
4. Click "Refund"
5. Enter amount (partial or full)
6. Add reason
7. Confirm refund
```

#### View Platform Earnings
```
1. Connect > Application fees
2. Select date range
3. Export as CSV if needed
```

#### Check Seller Payout Status
```
1. Connect > Accounts
2. Click seller account
3. View "Payouts" tab
4. Check status and arrival date
```

---

## 📧 Email Template Management

### Email Templates Location
```
jaylataylor-website/backend/services/emailService.js
```

### Template Types
1. **Order Confirmation** - Sent to customer after purchase
2. **Seller Notification** - Sent to seller for new orders
3. **Shipping Notification** - Sent when order ships
4. **Seller Welcome** - Sent after Stripe onboarding

### Editing Email Templates
1. Open `emailService.js`
2. Find the relevant function:
   - `sendOrderConfirmation()`
   - `sendSellerNotification()`
   - `sendShippingNotification()`
   - `sendSellerWelcome()`
3. Edit HTML content within template literals
4. Restart backend server

### Email Configuration

#### Gmail Setup
```env
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@jaylataylor.com
EMAIL_PASSWORD=app_specific_password
```

#### Getting Gmail App Password
1. Enable 2FA on Gmail account
2. Go to: https://myaccount.google.com/security
3. Select "2-Step Verification"
4. Select "App passwords"
5. Generate password for "Mail"
6. Use this password in EMAIL_PASSWORD

---

## 🖥️ Server Maintenance

### Checking Server Status

#### Local Server
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# View server logs
# Logs appear in terminal where server is running
```

#### Production Server (Heroku)
```bash
# Check status
heroku ps

# View logs
heroku logs --tail

# Restart server
heroku restart

# Scale dynos
heroku ps:scale web=1
```

#### Production Server (Render)
- Dashboard: https://dashboard.render.com
- View logs in service dashboard
- Restart: Service settings > Manual Deploy

### Common Server Issues

#### Server Crashed
```bash
# Heroku
heroku restart

# Render
# Click "Manual Deploy" in dashboard

# Local
# Ctrl+C to stop, then:
npm start
```

#### Out of Memory
```bash
# Check memory usage
heroku ps

# Upgrade dyno type if needed
heroku ps:resize web=standard-1x
```

---

## 👥 Seller Management

### Onboarding New Seller
1. Seller visits: /seller-dashboard.html
2. Clicks "Connect with Stripe"
3. Completes Stripe onboarding
4. Account automatically activated when complete

### Viewing Seller Information
```
1. Stripe Dashboard > Connect > Accounts
2. Search by email or account ID
3. View account details, balance, payouts
```

### Common Seller Issues

#### Seller Can't Access Dashboard
- Check account ID in localStorage
- Verify Stripe account is active
- Clear browser cache
- Try incognito mode

#### Payouts Not Arriving
- Check Stripe Dashboard > Connect > Payouts
- Verify bank account is verified
- Check for payout schedule (daily/weekly)
- Look for failed payouts

---

## 📊 Analytics & Reporting

### Sales Reports

#### Daily Sales
```
Stripe Dashboard > Reports > Revenue
Select: Today
Group by: Day
```

#### Platform Fees Earned
```
Stripe Dashboard > Connect > Application fees
Select date range
Export CSV
```

### Performance Metrics

#### Monitor Response Times
```bash
# Test API response time
time curl https://your-backend-url.com/api/health

# Check frontend load time
# Use Chrome DevTools > Network tab
```

#### Error Tracking
```bash
# View error logs (Heroku)
heroku logs --tail | grep ERROR

# View error logs (Render)
# Check dashboard logs section
```

---

## 🔧 Troubleshooting Guide

### Problem: Cart Not Working

#### Check Backend Connection
```javascript
// Browser console
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(console.log)
```

#### Solution
1. Ensure backend is running
2. Check CORS settings
3. Verify API URL in main.js

### Problem: Payments Failing

#### Check Stripe Keys
```bash
# Verify keys are set
echo $STRIPE_SECRET_KEY
echo $STRIPE_PUBLISHABLE_KEY
```

#### Solution
1. Verify Stripe keys are correct
2. Check if in test/live mode
3. Review Stripe webhook logs

### Problem: Emails Not Sending

#### Test Email Configuration
```javascript
// Test in Node.js console
const emailService = require('./services/emailService');
emailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test email</p>'
});
```

#### Solution
1. Check email credentials
2. Verify app password (Gmail)
3. Check spam folder
4. Review email service logs

### Problem: Seller Can't Onboard

#### Check Account Status
```bash
# Use API to check account
curl https://your-backend/api/stripe-connect/account-status/ACCOUNT_ID
```

#### Solution
1. Clear browser cache
2. Try different browser
3. Check Stripe Connect settings
4. Verify webhook configuration

---

## 📝 Daily Checklist

### Morning (9 AM)
- [ ] Check overnight orders
- [ ] Review failed payments
- [ ] Check email queue
- [ ] Verify server status
- [ ] Review error logs

### Afternoon (2 PM)
- [ ] Process refunds if any
- [ ] Update product inventory
- [ ] Respond to seller inquiries
- [ ] Check payout status

### Evening (6 PM)
- [ ] Final order review
- [ ] Backup any changes
- [ ] Check tomorrow's schedule
- [ ] Update tracking numbers

---

## 🚨 Emergency Contacts

### Critical Issues
- **Stripe Support**: https://support.stripe.com
- **Heroku Support**: https://help.heroku.com
- **Render Support**: https://render.com/support

### Development Team
- **Lead Developer**: _______________
- **Backend Support**: _______________
- **Email**: tech@prsmtech.com

---

## 🔐 Security Reminders

### Never Share
- Stripe API keys
- Database passwords
- Email passwords
- Webhook secrets
- Admin credentials

### Always Do
- Use 2FA on all accounts
- Rotate passwords quarterly
- Monitor suspicious activity
- Keep backups of configuration
- Update dependencies monthly

---

## 📋 Quick Commands

```bash
# View recent orders (last 10)
heroku logs --tail -n 100 | grep "Payment succeeded"

# Check server memory
heroku ps

# Restart server
heroku restart

# Deploy updates
git push heroku main

# View environment variables
heroku config

# Update environment variable
heroku config:set KEY=value

# Connect to Node console
heroku run node

# Run database migrations (future)
heroku run npm run migrate
```

---

## 📅 Monthly Tasks

### First Monday
- [ ] Review previous month's sales
- [ ] Calculate platform fees earned
- [ ] Send seller performance reports
- [ ] Update product catalog

### Mid-Month
- [ ] Security audit
- [ ] Update dependencies
- [ ] Review and optimize slow queries
- [ ] Clean up old logs

### End of Month
- [ ] Generate financial reports
- [ ] Backup all data
- [ ] Plan next month's updates
- [ ] Review seller feedback

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Keep this document secure and updated**