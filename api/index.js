// Vercel serverless entry: every request is rewritten here (see vercel.json).
// `npm run build` compiles src/ -> dist/ first.
const { createApp } = require("../dist/app");
const { database } = require("../dist/config/database");

const app = createApp();

// On a long-lived server, src/server.ts connects to MongoDB once at startup.
// Serverless instances start on demand, so connect lazily on the first request
// and reuse the connection while the instance stays warm.
let connecting = null;

module.exports = async (req, res) => {
  if (!connecting) {
    connecting = database.connect().catch((err) => {
      connecting = null; // allow a retry on the next request
      throw err;
    });
  }
  try {
    await connecting;
  } catch (err) {
    console.error("MongoDB connection failed", err);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ success: false, error: "Database unavailable" }));
  }
  return app(req, res);
};
