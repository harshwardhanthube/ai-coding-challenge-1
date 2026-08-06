# E-commerce Inventory API

Node.js and Express REST API backed by MongoDB.

## Run locally

1. Copy `.env.example` to `.env` and adjust values if needed. `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` control the per-client API limit (default: 100 requests per 15 minutes).
2. Start MongoDB with `docker compose up -d mongo`.
3. Install dependencies with `npm install`.
4. Start the API with `npm start` (or `npm run dev`).

The default server is `http://localhost:3000`. Health is available at `GET /health`.

## API

All resource endpoints use the `/api/v1` prefix. Product JSON uses a required, case-insensitive unique `sku`, `imageUrl`, and an optional `category` ID.

- Products: `GET/POST /products`, `GET/PATCH/DELETE /products/:id`
- Categories: `GET/POST /categories`, `GET/PATCH/DELETE /categories/:id`
- Stock: `GET /products/:id/stock`, `PUT /products/:id/stock` with `{ "qty": 10 }`, and `POST /products/:id/stock/adjust` with `{ "delta": -2 }`.

Products require `sku`, `title`, `cost`, `description`, and `qty`. SKUs are normalized to uppercase and must be unique. Cost and quantity are non-negative integers. Unknown request fields and empty PATCH requests are rejected. Category deletion is rejected while referenced by a product. API routes are rate-limited per client; health checks are exempt.

## Tests

`npm test` runs integration tests against an in-memory MongoDB instance. `npm run lint` checks source formatting and common errors.
