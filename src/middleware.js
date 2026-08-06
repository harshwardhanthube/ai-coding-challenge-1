const mongoose = require('mongoose');
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

function validateProductInput(req, res, next) {
  const body = req.body || {};
  const required = req.method === 'POST' ? ['title', 'cost', 'description', 'qty'] : [];
  const missing = required.filter((field) => body[field] === undefined);
  if (missing.length) return next(new AppError(400, `Missing required fields: ${missing.join(', ')}`));

  for (const field of ['title', 'description']) {
    if (body[field] !== undefined && (typeof body[field] !== 'string' || !body[field].trim())) {
      return next(new AppError(400, `${field} must be a non-empty string`));
    }
  }
  for (const field of ['cost', 'qty']) {
    if (body[field] !== undefined && (!Number.isInteger(body[field]) || body[field] < 0)) {
      return next(new AppError(400, `${field} must be a non-negative integer`));
    }
  }
  if (!validateImageUrl(body.imageUrl)) return next(new AppError(400, 'imageUrl must be a valid HTTP(S) URL'));
  return next();
}

function validateCategoryInput(req, res, next) {
  const body = req.body || {};
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

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  if (error.code === 11000) return res.status(409).json({ error: 'A resource with that unique value already exists' });
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: Object.values(error.errors).map((item) => item.message) });
  }
  const status = error.status || 500;
  return res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message, ...(error.details ? { details: error.details } : {}) });
}

module.exports = { asyncHandler, validateObjectId, validateProductInput, validateCategoryInput, errorHandler };
