const express = require('express');
const Product = require('../models/product');
const Category = require('../models/category');
const { AppError } = require('../errors');
const { asyncHandler, validateObjectId, validateProductInput } = require('../middleware');

const router = express.Router();

async function ensureCategory(category) {
  if (category !== undefined && category !== null) {
    if (!await Category.exists({ _id: category })) throw new AppError(400, 'Category does not exist');
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const products = await Product.find().populate('category').sort({ createdAt: -1 });
  res.json({ data: products });
}));

router.post('/', validateProductInput, asyncHandler(async (req, res) => {
  await ensureCategory(req.body.category);
  const product = await Product.create(req.body);
  res.status(201).json({ data: await product.populate('category') });
}));

router.get('/:id', validateObjectId, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category');
  if (!product) throw new AppError(404, 'Product not found');
  res.json({ data: product });
}));

router.patch('/:id', validateObjectId, validateProductInput, asyncHandler(async (req, res) => {
  await ensureCategory(req.body.category);
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('category');
  if (!product) throw new AppError(404, 'Product not found');
  res.json({ data: product });
}));

router.delete('/:id', validateObjectId, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError(404, 'Product not found');
  res.status(204).send();
}));

router.get('/:id/stock', validateObjectId, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('_id qty');
  if (!product) throw new AppError(404, 'Product not found');
  res.json({ data: { productId: product._id, qty: product.qty } });
}));

router.put('/:id/stock', validateObjectId, asyncHandler(async (req, res) => {
  const { qty } = req.body || {};
  if (!Number.isInteger(qty) || qty < 0) throw new AppError(400, 'qty must be a non-negative integer');
  const product = await Product.findByIdAndUpdate(req.params.id, { qty }, { new: true, runValidators: true }).select('_id qty');
  if (!product) throw new AppError(404, 'Product not found');
  res.json({ data: { productId: product._id, qty: product.qty } });
}));

router.post('/:id/stock/adjust', validateObjectId, asyncHandler(async (req, res) => {
  const { delta } = req.body || {};
  if (!Number.isInteger(delta) || delta === 0) throw new AppError(400, 'delta must be a non-zero integer');
  const filter = { _id: req.params.id, ...(delta < 0 ? { qty: { $gte: Math.abs(delta) } } : {}) };
  const product = await Product.findOneAndUpdate(filter, { $inc: { qty: delta } }, { new: true }).select('_id qty');
  if (!product) {
    if (!await Product.exists({ _id: req.params.id })) throw new AppError(404, 'Product not found');
    throw new AppError(409, 'Insufficient stock');
  }
  res.json({ data: { productId: product._id, qty: product.qty } });
}));

module.exports = router;
