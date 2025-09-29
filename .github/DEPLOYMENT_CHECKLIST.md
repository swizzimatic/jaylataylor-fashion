# 🚀 Deployment Checklist

**Use this checklist EVERY TIME before deploying to prevent 404 errors**

## Pre-Deployment Verification

### Configuration Check
- [ ] Verify only ONE vercel.json exists at root: `ls -la vercel.json`
- [ ] Confirm NO vercel.json in subdirectory: `ls -la jaylataylor-website/vercel.json`
- [ ] Check vercel.json content matches:
  ```json
  {
    "version": 2,
    "buildCommand": "echo 'No build required'",
    "outputDirectory": "jaylataylor-website",
    "framework": null
  }
  ```

### File Structure Check
- [ ] All HTML files in `jaylataylor-website/` directory
- [ ] CSS files in `jaylataylor-website/css/`
- [ ] JavaScript files in `jaylataylor-website/js/`
- [ ] Product data in `jaylataylor-website/data/products.json`

### Git Status Check
- [ ] Run `git status` - ensure on main branch
- [ ] All changes committed
- [ ] No conflicting vercel.json files staged

## Deployment Steps

### 1. Test Deployment (Preview)
```bash
vercel
# Check preview URL works without 404s
```

### 2. Production Deployment
```bash
vercel --prod --yes
```

### 3. Post-Deployment Verification
- [ ] Test homepage: `curl -I https://www.jaylataylor.com`
- [ ] Test shop page: `curl -I https://www.jaylataylor.com/shop.html`
- [ ] Test cart page: `curl -I https://www.jaylataylor.com/cart.html`
- [ ] Check for 200 OK status codes

## ⚠️ Red Flags - STOP if you see:

- Multiple vercel.json files
- Complex routing or rewrite rules
- Build errors mentioning functions
- Deployment from subdirectory
- 404 errors on preview deployment

## 🔧 Quick Fixes

| Problem | Solution |
|---------|----------|
| 404 errors | Check vercel.json is at root with correct outputDirectory |
| Multiple configs | Delete all except root vercel.json |
| Complex routing | Replace with simple outputDirectory config |
| Build errors | Remove function configurations |

## 📞 If Issues Persist

1. Check DEPLOYMENT_SAFEGUARDS.md for detailed troubleshooting
2. Verify Vercel dashboard settings (Root Directory should be empty)
3. Review recent commits for configuration changes

---

**Last Successful Deployment**: September 28, 2025
**Configuration**: Simple outputDirectory pointing to jaylataylor-website