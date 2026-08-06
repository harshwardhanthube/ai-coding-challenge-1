# E-commerce Inventory API

Node.js and Express REST API backed by MongoDB.

## Run locally

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Start MongoDB with `docker compose up -d mongo`.
3. Install dependencies with `npm install`.
4. Start the API with `npm start` (or `npm run dev`).

The default server is `http://localhost:3000`. Health is available at `GET /health`.

## API

All resource endpoints use the `/api/v1` prefix. Product JSON uses `imageUrl` and an optional `category` ID.

- Products: `GET/POST /products`, `GET/PATCH/DELETE /products/:id`
- Categories: `GET/POST /categories`, `GET/PATCH/DELETE /categories/:id`
- Stock: `GET /products/:id/stock`, `PUT /products/:id/stock` with `{ "qty": 10 }`, and `POST /products/:id/stock/adjust` with `{ "delta": -2 }`.

Products require `title`, `cost`, `description`, and `qty`. Cost and quantity are non-negative integers. Category deletion is rejected while referenced by a product.

## Tests

`npm test` runs integration tests against an in-memory MongoDB instance. `npm run lint` checks source formatting and common errors.
