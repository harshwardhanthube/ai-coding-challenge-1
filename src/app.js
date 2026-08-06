const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const { AppError } = require('./errors');
const { createApiRateLimiter, errorHandler } = require('./middleware');
const { rateLimitWindowMs, rateLimitMax } = require('./config');

function createApp({ rateLimitWindowMs: windowMs = rateLimitWindowMs, rateLimitMax: limit = rateLimitMax } = {}) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
  app.use('/api/v1', createApiRateLimiter({ windowMs, limit }));
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use((req, res, next) => next(new AppError(404, 'Route not found')));
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
