require('dotenv').config();

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_inventory',
  rateLimitWindowMs: positiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: positiveInteger(process.env.RATE_LIMIT_MAX, 100)
};
