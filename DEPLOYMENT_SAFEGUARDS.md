# Deployment Safeguards - Preventing 404 Errors

## ⚠️ Critical Configuration Rules

### Root Cause of Previous 404 Errors
The website experienced 404 errors because Vercel was looking for files in the repository root instead of the `jaylataylor-website/` subdirectory where they actually exist.

## ✅ Correct Configuration (ALWAYS USE THIS)

### Location: `/vercel.json` (ROOT of repository)
```json
{
  "version": 2,
  "buildCommand": "echo 'No build required'",
  "outputDirectory": "jaylataylor-website",
  "framework": null
}
```

## 🚫 Common Mistakes to AVOID

### 1. **NEVER create vercel.json in subdirectories**
   - ❌ `/jaylataylor-website/vercel.json` - DO NOT CREATE
   - ✅ `/vercel.json` - ONLY HERE

### 2. **NEVER use complex routing rules**
   - ❌ Complex rewrites, builds, or routes
   - ✅ Simple outputDirectory configuration

### 3. **NEVER deploy from subdirectory**
   - ❌ `cd jaylataylor-website && vercel --prod`
   - ✅ `vercel --prod` (from root)

## 📋 Pre-Deployment Checklist

Before deploying, ALWAYS verify:

- [ ] Only ONE vercel.json exists at repository root
- [ ] No vercel.json in jaylataylor-website/ directory
- [ ] vercel.json uses simple outputDirectory setting
- [ ] All website files are in jaylataylor-website/ folder
- [ ] Deploy command runs from repository root

## 🔍 Quick Verification Commands

```bash
# Check for multiple vercel.json files (should only show ./vercel.json)
find . -name "vercel.json"

# Verify correct configuration
cat vercel.json

# Test deployment (before production)
vercel

# Deploy to production
vercel --prod --yes
```

## 🚨 If 404 Errors Return

1. **Check Vercel Dashboard**
   - Verify Root Directory is not set (should be empty)
   - Check Build & Output Settings

2. **Verify Configuration**
   ```bash
   # Ensure only root vercel.json exists
   ls -la vercel.json
   ls -la jaylataylor-website/vercel.json  # Should NOT exist
   ```

3. **Test with curl**
   ```bash
   curl -I https://www.jaylataylor.com
   curl -I https://www.jaylataylor.com/shop.html
   ```

## 📝 Key Learning Points

1. **Simplicity wins**: A simple `outputDirectory` setting is more reliable than complex routing
2. **Single source of truth**: One vercel.json at root, nowhere else
3. **Directory structure matters**: Vercel needs to know where your files are
4. **Test before production**: Always verify with a preview deployment first

## 🛡️ Permanent Fix Applied

**Date**: September 28, 2025
**Solution**: Simplified vercel.json with outputDirectory pointing to jaylataylor-website
**Result**: All pages serving correctly without 404 errors

---

⚠️ **IMPORTANT**: If anyone suggests adding routing, rewrites, or additional vercel.json files, refer to this document first!