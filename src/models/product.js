const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, sparse: true, trim: true, uppercase: true },
  title: { type: String, required: true, trim: true },
  cost: { type: Number, required: true, min: 0, validate: { validator: Number.isInteger, message: 'cost must be an integer' } },
  description: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true },
  qty: { type: Number, required: true, min: 0, default: 0, validate: { validator: Number.isInteger, message: 'qty must be an integer' } },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
