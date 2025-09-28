// Vercel Serverless entry point for /api
const app = require('../app');

module.exports = (req, res) => app(req, res);


