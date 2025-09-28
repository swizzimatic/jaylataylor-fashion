// Catch-all Vercel Serverless entry to handle /api/* routes with Express
const app = require('../app');

module.exports = (req, res) => app(req, res);


