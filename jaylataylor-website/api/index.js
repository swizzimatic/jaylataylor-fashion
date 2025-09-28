// Vercel Serverless Entry Point
// Integrates all security updates and Stripe Connect functionality

const serverlessHttp = require('serverless-http');

// Import the secure Express app with all security middleware
const app = require('../backend/server-secured');

// Validate critical environment variables on startup
const requiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'JWT_SECRET',
  'JAYLA_STRIPE_ACCOUNT_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  console.error('Please configure these in Vercel Dashboard > Settings > Environment Variables');
}

// Log security status on startup
console.log(`🔐 Security features initialized:`);
console.log(`   - JWT Authentication: ${!!process.env.JWT_SECRET ? '✅' : '❌'}`);
console.log(`   - Stripe Connect: ${!!process.env.STRIPE_SECRET_KEY ? '✅' : '❌'}`);
console.log(`   - Webhook Security: ${!!process.env.STRIPE_WEBHOOK_SECRET ? '✅' : '❌'}`);
console.log(`   - Platform Fee: ${process.env.PLATFORM_FEE_PERCENTAGE || '10'}%`);

// Export the serverless handler with enhanced logging
module.exports = serverlessHttp(app, {
  binary: false,
  request: (request, event, context) => {
    // Add Vercel context to request
    request.vercel = { event, context };

    // Enhanced logging for production debugging
    if (process.env.NODE_ENV === 'production') {
      console.log(`📨 ${request.method} ${request.url} - ${new Date().toISOString()}`);

      // Log critical endpoint access
      if (request.url.includes('/api/connect/') || request.url.includes('/webhooks/')) {
        console.log(`🔐 Secure endpoint accessed: ${request.url}`);
      }
    }
  },
  response: (response, event, context) => {
    // Add security headers for serverless responses
    response.headers = response.headers || {};
    response.headers['X-Powered-By'] = 'Vercel-Secure';
    response.headers['X-Security-Features'] = 'JWT,CSRF,RateLimit,Stripe-Connect';

    // Log response status for debugging
    if (process.env.NODE_ENV === 'production' && response.statusCode >= 400) {
      console.log(`❌ Error response: ${response.statusCode} for ${event.httpMethod} ${event.path}`);
    }
  }
});