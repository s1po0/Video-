'use strict';

// Vercel serverless entry point.
// Exports the same Express app used by `server.js` so the whole app
// (static UI + API) runs inside a single Vercel function.
module.exports = require('../app');
