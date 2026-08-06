const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { AppError } = require('./errors');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError(400, 'Invalid resource ID'));
  }
  return next();
}

function validateImageUrl(value) {
  if (value === undefined) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateBodyShape(body, allowedFields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'Request body must be a JSON object');
  }
  const unexpected = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (unexpected.length) throw new AppError(400, `Unsupported fields: ${unexpected.join(', ')}`);
}

function requireNonEmptyPatch(body) {
  if (Object.keys(body).length === 0) throw new AppError(400, 'Request body must include at least one field');
}

function validateProductInput(req, res, next) {
  const body = req.body || {};
  try {
    validateBodyShape(body, ['sku', 'title', 'cost', 'description', 'imageUrl', 'qty', 'category']);
    if (req.method === 'PATCH') requireNonEmptyPatch(body);
  } catch (error) {
    return next(error);
  }
  const required = req.method === 'POST' ? ['sku', 'title', 'cost', 'description', 'qty'] : [];
  const missing = required.filter((field) => body[field] === undefined);
  if (missing.length) return next(new AppError(400, `Missing required fields: ${missing.join(', ')}`));

  for (const field of ['title', 'description']) {
    if (body[field] !== undefined && (typeof body[field] !== 'string' || !body[field].trim())) {
      return next(new AppError(400, `${field} must be a non-empty string`));
    }
  }
  if (body.sku !== undefined) {
    if (typeof body.sku !== 'string' || !body.sku.trim()) return next(new AppError(400, 'sku must be a non-empty string'));
    body.sku = body.sku.trim().toUpperCase();
  }
  for (const field of ['cost', 'qty']) {
    if (body[field] !== undefined && (!Number.isInteger(body[field]) || body[field] < 0)) {
      return next(new AppError(400, `${field} must be a non-negative integer`));
    }
  }
  if (!validateImageUrl(body.imageUrl)) return next(new AppError(400, 'imageUrl must be a valid HTTP(S) URL'));
  if (body.category !== undefined && body.category !== null && (typeof body.category !== 'string' || !mongoose.Types.ObjectId.isValid(body.category))) {
    return next(new AppError(400, 'category must be a valid category ID or null'));
  }
  return next();
}

function validateCategoryInput(req, res, next) {
  const body = req.body || {};
  try {
    validateBodyShape(body, ['name', 'description']);
    if (req.method === 'PATCH') requireNonEmptyPatch(body);
  } catch (error) {
    return next(error);
  }
  if (req.method === 'POST' && (typeof body.name !== 'string' || !body.name.trim())) {
    return next(new AppError(400, 'name must be a non-empty string'));
  }
  for (const field of ['name', 'description']) {
    if (body[field] !== undefined && typeof body[field] !== 'string') {
      return next(new AppError(400, `${field} must be a string`));
    }
  }
  return next();
}

function validateStockInput(field, { nonZero = false } = {}) {
  return (req, res, next) => {
    const body = req.body || {};
    try {
      validateBodyShape(body, [field]);
    } catch (error) {
      return next(error);
    }
    if (!Number.isInteger(body[field]) || (nonZero ? body[field] === 0 : body[field] < 0)) {
      return next(new AppError(400, `${field} must be a ${nonZero ? 'non-zero' : 'non-negative'} integer`));
    }
    return next();
  };
}

function createApiRateLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
  });
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Malformed JSON request body' });
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    return res.status(409).json({ error: field === 'sku' ? 'A product with that SKU already exists' : 'A resource with that unique value already exists' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: Object.values(error.errors).map((item) => item.message) });
  }
  const status = error.status || 500;
  return res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message, ...(error.details ? { details: error.details } : {}) });
}

module.exports = { asyncHandler, validateObjectId, validateProductInput, validateCategoryInput, validateStockInput, createApiRateLimiter, errorHandler };
