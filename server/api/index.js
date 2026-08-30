/**
 * Vercel serverless entry point.
 *
 * The main Express application lives in ../server.js.
 * server.js exports the Express app and only starts
 * app.listen() during local development.
 */

const app = require("../server");

module.exports = app;
