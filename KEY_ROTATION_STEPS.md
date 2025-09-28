# Stripe API Key Rotation Steps

## 1. In Stripe Dashboard (Current Screen):

✅ **Select "in 7 days"** for expiration
- This provides adequate time for migration
- Click "Rotate API key" button

## 2. Immediately After Rotation:

⚠️ **SAVE THE NEW SECRET KEY IMMEDIATELY**
- The new secret key will be shown only once
- Copy it to a secure location (password manager)

## 3. Update Production Environment:

### On Your Production Server:
```bash
# SSH into your production server
ssh your-server

# Navigate to the project
cd /path/to/jaylataylor-website/backend

# Update the .env file with new key
nano .env
```

Update this line:
```env
STRIPE_SECRET_KEY=sk_live_[YOUR_NEW_SECRET_KEY_HERE]
```

### Restart the Server:
```bash
# If using PM2
pm2 restart jaylataylor-api

# If using systemd
sudo systemctl restart jaylataylor-backend

# If using Docker
docker-compose restart backend
```

## 4. Test the New Key:

### Quick Test Script:
```bash
# From your local machine
curl -X GET https://jaylataylor.com/api/health

# Test payment intent creation
curl -X POST https://jaylataylor.com/api/connect/payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "testMode": true}'
```

## 5. During the 7-Day Transition:

Both keys will work during this period:
- **Old key**: Still active for 7 days
- **New key**: Immediately active

This allows you to:
- Roll back if issues occur
- Update any other services using the old key
- Ensure all webhooks are working

## 6. Update Any Other Services:

Check and update:
- [ ] Production server (.env file)
- [ ] Staging/development environments
- [ ] CI/CD pipeline variables
- [ ] Any third-party integrations
- [ ] Backup payment processing systems

## 7. Verify Webhook Functionality:

After updating the key:
```bash
# Test webhook with Stripe CLI
stripe listen --forward-to https://jaylataylor.com/api/webhoks/stripe

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded
```

## Important Notes:

1. **Security**: The old key was exposed in our conversation, so rotation is CRITICAL
2. **Timing**: Do this during low-traffic periods if possible
3. **Monitoring**: Watch error logs closely for the first hour after rotation
4. **Rollback Plan**: Keep the old key noted (it works for 7 days) in case you need to revert

## Why 7 Days is Recommended:

- **Immediate rotation** (now): Too risky, no time for testing
- **1 hour**: Not enough time for proper deployment and testing
- **24 hours**: Tight timeline if issues arise
- **3 days**: Acceptable but less buffer time
- **7 days**: ✅ BEST OPTION - Adequate testing and rollback window
- **Never expire**: Security risk, defeats the purpose of rotation

## After Successful Rotation:

1. Update your documentation with rotation date
2. Set a calendar reminder for future rotations (every 90 days recommended)
3. Document any services that needed updating for future reference