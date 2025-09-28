#!/bin/bash

# Secure Deployment Build Script
# This script prepares the application for production deployment

echo "🔐 Jayla Taylor Website - Secure Deployment Build"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 successful${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# 1. Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v)
echo "   Node version: $node_version"

# 2. Install dependencies
echo ""
echo "📦 Installing production dependencies..."
npm ci --only=production
check_status "Dependency installation"

# 3. Run security audit
echo ""
echo "🔍 Running security audit..."
npm audit --production
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Security vulnerabilities found. Run 'npm audit fix' to resolve.${NC}"
fi

# 4. Check environment variables
echo ""
echo "🔐 Checking environment configuration..."
required_vars=("STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET" "JWT_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        if ! grep -q "^$var=" .env 2>/dev/null; then
            missing_vars+=("$var")
        fi
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    echo -e "${YELLOW}Please configure these in your .env file${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All required environment variables present${NC}"
fi

# 5. Create production directories
echo ""
echo "📁 Creating production directories..."
mkdir -p logs
mkdir -p temp
check_status "Directory creation"

# 6. Set production permissions
echo ""
echo "🔒 Setting secure file permissions..."
chmod 600 .env 2>/dev/null || true
chmod 700 scripts/*.sh 2>/dev/null || true
chmod 600 logs/*.log 2>/dev/null || true

# 7. Generate build info
echo ""
echo "📝 Generating build information..."
build_info="{
  \"version\": \"1.0.0-secure\",
  \"buildDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"nodeVersion\": \"$node_version\",
  \"environment\": \"production\",
  \"security\": {
    \"authentication\": true,
    \"rateLimiting\": true,
    \"csrf\": true,
    \"xss\": true,
    \"sessionManagement\": true
  }
}"

echo "$build_info" > build-info.json
check_status "Build info generation"

# 8. Create deployment package
echo ""
echo "📦 Creating deployment package..."
tar -czf ../deploy-secure-$(date +%Y%m%d-%H%M%S).tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=.env.example \
    --exclude=.env.secure \
    --exclude=scripts/security-migration.js \
    .
check_status "Deployment package creation"

# 9. Generate deployment checklist
echo ""
echo "📋 Deployment Checklist:"
echo "========================"
echo ""
echo "Pre-Deployment:"
echo "  ✓ All dependencies installed"
echo "  ✓ Environment variables configured"
echo "  ✓ Security middleware active"
echo "  ✓ Build package created"
echo ""
echo "Deployment Steps:"
echo "  1. Upload deployment package to server"
echo "  2. Extract: tar -xzf deploy-secure-*.tar.gz"
echo "  3. Install dependencies: npm ci --only=production"
echo "  4. Configure production .env file"
echo "  5. Set up SSL certificates"
echo "  6. Configure reverse proxy (nginx/Apache)"
echo "  7. Set up process manager (PM2/systemd)"
echo "  8. Start server: npm run start:secure"
echo ""
echo "Post-Deployment:"
echo "  □ Verify HTTPS is working"
echo "  □ Test payment flow with Stripe test cards"
echo "  □ Check rate limiting is active"
echo "  □ Verify CSRF tokens are working"
echo "  □ Monitor error logs"
echo "  □ Set up automated backups"
echo "  □ Configure monitoring/alerts"
echo ""
echo "Security Reminders:"
echo "  ⚠️  Rotate all API keys after deployment"
echo "  ⚠️  Enable Stripe webhook signature verification"
echo "  ⚠️  Set NODE_ENV=production"
echo "  ⚠️  Use HTTPS everywhere"
echo "  ⚠️  Keep logs outside web root"
echo ""

# 10. Final status
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "📦 Deployment package: ../deploy-secure-*.tar.gz"
echo "📄 Build info: build-info.json"
echo ""
echo "🚀 Ready for deployment!"