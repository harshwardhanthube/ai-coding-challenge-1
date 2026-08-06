const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Product = require('../src/models/product');
const Category = require('../src/models/category');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Category.deleteMany({});
});

describe('products and categories', () => {
  test('creates and retrieves a product with an optional category and image URL', async () => {
    const category = await request(app).post('/api/v1/categories').send({ name: 'Shoes' });
    const created = await request(app).post('/api/v1/products').send({
      title: 'Running shoes', cost: 99, description: 'Lightweight', qty: 5,
      imageUrl: 'https://example.com/shoes.png', category: category.body.data._id
    });
    expect(created.status).toBe(201);
    expect(created.body.data.title).toBe('Running shoes');
    expect(created.body.data.category.name).toBe('Shoes');

    const fetched = await request(app).get(`/api/v1/products/${created.body.data._id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.imageUrl).toBe('https://example.com/shoes.png');
  });

  test('updates and deletes a product', async () => {
    const created = await Product.create({ title: 'Old', cost: 1, description: 'Old', qty: 1 });
    const updated = await request(app).patch(`/api/v1/products/${created.id}`).send({ title: 'New', cost: 2 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('New');
    expect((await request(app).delete(`/api/v1/products/${created.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/v1/products/${created.id}`)).status).toBe(404);
  });

  test('rejects invalid product data and missing products', async () => {
    const invalid = await request(app).post('/api/v1/products').send({ title: '', cost: -1, description: 'x', qty: 1 });
    expect(invalid.status).toBe(400);
    expect((await request(app).get('/api/v1/products/not-an-id')).status).toBe(400);
    expect((await request(app).get(`/api/v1/products/${new mongoose.Types.ObjectId()}`)).status).toBe(404);
  });

  test('rejects duplicate categories and deletion of referenced categories', async () => {
    const category = await Category.create({ name: 'Books' });
    expect((await request(app).post('/api/v1/categories').send({ name: 'Books' })).status).toBe(409);
    await Product.create({ title: 'Novel', cost: 10, description: 'A novel', qty: 1, category: category.id });
    const deletion = await request(app).delete(`/api/v1/categories/${category.id}`);
    expect(deletion.status).toBe(409);
  });
});

describe('stock management', () => {
  let product;

  beforeEach(async () => {
    product = await Product.create({ title: 'Widget', cost: 10, description: 'Useful', qty: 5 });
  });

  test('gets and sets stock', async () => {
    expect((await request(app).get(`/api/v1/products/${product.id}/stock`)).body.data.qty).toBe(5);
    const response = await request(app).put(`/api/v1/products/${product.id}/stock`).send({ qty: 12 });
    expect(response.status).toBe(200);
    expect(response.body.data.qty).toBe(12);
  });

  test('atomically adjusts stock and prevents negative quantities', async () => {
    const increase = await request(app).post(`/api/v1/products/${product.id}/stock/adjust`).send({ delta: 3 });
    expect(increase.body.data.qty).toBe(8);
    const insufficient = await request(app).post(`/api/v1/products/${product.id}/stock/adjust`).send({ delta: -9 });
    expect(insufficient.status).toBe(409);
    expect((await Product.findById(product.id)).qty).toBe(8);
    expect((await request(app).post(`/api/v1/products/${product.id}/stock/adjust`).send({ delta: 0 })).status).toBe(400);
  });
});

test('returns health and JSON 404 responses', async () => {
  expect((await request(app).get('/health')).body.status).toBe('ok');
  const response = await request(app).get('/not-found');
  expect(response.status).toBe(404);
  expect(response.body.error).toBe('Route not found');
});
