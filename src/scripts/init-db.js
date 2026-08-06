const mongoose = require('mongoose');
const { mongoUri } = require('../config');
const Category = require('../models/category');
const Product = require('../models/product');

async function initializeDatabase() {
  await mongoose.connect(mongoUri);
  await Promise.all([Category.createCollection().catch((error) => {
    if (error.codeName !== 'NamespaceExists') throw error;
  }), Product.createCollection().catch((error) => {
    if (error.codeName !== 'NamespaceExists') throw error;
  })]);
  await Promise.all([Category.syncIndexes(), Product.syncIndexes()]);
  console.log('Database schema initialized successfully.');
}

initializeDatabase()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
