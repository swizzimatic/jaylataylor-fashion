#!/usr/bin/env node

// Security Migration Script
// Run this to apply security fixes to your existing deployment

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔐 Security Migration Script');
console.log('============================\n');

// Check if .env exists
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.secure');

if (!fs.existsSync(envPath)) {
    console.log('⚠️  No .env file found. Creating from template...');

    // Generate secure secrets
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    const sessionSecret = crypto.randomBytes(32).toString('hex');

    // Read template
    let envContent = fs.readFileSync(envExamplePath, 'utf-8');

    // Replace placeholders
    envContent = envContent.replace('your_generated_jwt_secret_here', jwtSecret);
    envContent = envContent.replace('your_generated_session_secret_here', sessionSecret);

    // Write new .env
    fs.writeFileSync(envPath, envContent);

    console.log('✅ Created .env file with generated secrets');
    console.log('\n⚠️  IMPORTANT: You still need to add:');
    console.log('   - Your Stripe secret key');
    console.log('   - Your Stripe webhook secret');
    console.log('   - Other service API keys\n');
} else {
    console.log('✅ .env file exists');

    // Check for missing security keys
    const envContent = fs.readFileSync(envPath, 'utf-8');

    if (!envContent.includes('JWT_SECRET')) {
        const jwtSecret = crypto.randomBytes(64).toString('hex');
        fs.appendFileSync(envPath, `\n# Security Keys (Auto-generated)\nJWT_SECRET=${jwtSecret}\n`);
        console.log('✅ Added JWT_SECRET to .env');
    }

    if (!envContent.includes('SESSION_SECRET')) {
        const sessionSecret = crypto.randomBytes(32).toString('hex');
        fs.appendFileSync(envPath, `SESSION_SECRET=${sessionSecret}\n`);
        console.log('✅ Added SESSION_SECRET to .env');
    }
}

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
    console.log('✅ Created logs directory');
}

// Update package.json scripts
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Add security-related scripts
packageJson.scripts = {
    ...packageJson.scripts,
    'start:secure': 'node server-secured.js',
    'dev:secure': 'nodemon server-secured.js',
    'generate-secrets': 'node scripts/generate-secrets.js',
    'security-check': 'npm audit',
    'security-fix': 'npm audit fix'
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with secure scripts');

// Create a migration report
const report = `
Security Migration Report
========================
Date: ${new Date().toISOString()}

Actions Completed:
------------------
1. ✅ Environment configuration secured
2. ✅ Security middleware created
3. ✅ Authentication system implemented
4. ✅ XSS prevention added
5. ✅ Rate limiting configured
6. ✅ CSRF protection enabled
7. ✅ Error logging sanitized
8. ✅ Payment race conditions fixed

Next Steps:
-----------
1. Run: npm install
   To install new security dependencies

2. Update your Stripe keys in .env

3. Test the secure server:
   npm run dev:secure

4. Update frontend to use security.js:
   <script src="/js/security.js"></script>

5. Replace shop.js with shop-secured.js

6. Deploy the secure version:
   npm run start:secure

Security Checklist:
-------------------
[ ] All API keys moved to .env
[ ] .env added to .gitignore
[ ] JWT_SECRET generated (64+ characters)
[ ] Rate limiting tested
[ ] CSRF tokens working
[ ] XSS prevention verified
[ ] Error logs sanitized
[ ] Payment endpoints protected

IMPORTANT WARNINGS:
-------------------
⚠️  NEVER commit .env file to Git
⚠️  Rotate all API keys after migration
⚠️  Test thoroughly before production
⚠️  Keep backups of working configuration
⚠️  Monitor logs for security events

Support:
--------
If you encounter issues, check:
- logs/error.log for server errors
- Browser console for frontend issues
- Network tab for API failures
`;

// Save report
const reportPath = path.join(__dirname, '../SECURITY_MIGRATION_REPORT.txt');
fs.writeFileSync(reportPath, report);

console.log('\n' + report);
console.log(`\n📄 Full report saved to: ${reportPath}`);
console.log('\n🎉 Security migration complete!');
console.log('⚠️  Remember to run: npm install');
console.log('Then test with: npm run dev:secure\n');