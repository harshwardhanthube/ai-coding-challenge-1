const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const { AppError } = require('./errors');
const { errorHandler } = require('./middleware');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use((req, res, next) => next(new AppError(404, 'Route not found')));
app.use(errorHandler);

module.exports = app;
