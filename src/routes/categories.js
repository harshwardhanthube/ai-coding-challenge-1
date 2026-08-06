const express = require('express');
const Category = require('../models/category');
const Product = require('../models/product');
const { AppError } = require('../errors');
const { asyncHandler, validateObjectId, validateCategoryInput } = require('../middleware');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => res.json({ data: await Category.find().sort({ name: 1 }) })));

router.post('/', validateCategoryInput, asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ data: category });
}));

router.get('/:id', validateObjectId, asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError(404, 'Category not found');
  res.json({ data: category });
}));

router.patch('/:id', validateObjectId, validateCategoryInput, asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new AppError(404, 'Category not found');
  res.json({ data: category });
}));

router.delete('/:id', validateObjectId, asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError(404, 'Category not found');
  if (await Product.exists({ category: category._id })) throw new AppError(409, 'Category is referenced by products');
  await category.deleteOne();
  res.status(204).send();
}));

module.exports = router;
