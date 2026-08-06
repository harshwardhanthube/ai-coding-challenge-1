Create a complete e-commerce inventory REST API using Node.js, Express, and MongoDB with Mongoose.

Project requirements:

- Use JavaScript (CommonJS), Express, Mongoose, dotenv, Jest, Supertest, and mongodb-memory-server.
- Provide Docker Compose configuration for local MongoDB.
- Include `.env.example`, `.gitignore`, `README.md`, and npm scripts for start, development, linting, tests, and database initialization.
- Default local MongoDB URI: `mongodb://localhost:27017/ecommerce_inventory`.
- Add a `db:init` script that explicitly creates the MongoDB collections and synchronizes indexes.

Data models:

1. Category
   - `name`: required, trimmed, unique string
   - `description`: optional trimmed string, default empty string
   - timestamps

2. Product
   - `title`: required, trimmed string
   - `cost`: required non-negative integer
   - `description`: required, trimmed string
   - `imageUrl`: optional valid HTTP/HTTPS URL
   - `qty`: required non-negative integer
   - `category`: optional MongoDB ObjectId reference to Category
   - timestamps

API requirements:

- JSON-only REST API, no authentication.
- Version all resource routes under `/api/v1`.
- Add `GET /health`, returning API and database connection status.

Category endpoints:

- `GET /api/v1/categories`
- `GET /api/v1/categories/:id`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`

Product endpoints:

- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PATCH /api/v1/products/:id`
- `DELETE /api/v1/products/:id`

Stock endpoints:

- `GET /api/v1/products/:id/stock`
- `PUT /api/v1/products/:id/stock` with `{ "qty": 50 }` to set stock absolutely
- `POST /api/v1/products/:id/stock/adjust` with `{ "delta": -1 }` to increment or decrement stock atomically

Behavior and validation:

- Validate MongoDB IDs and all request payloads.
- Reject invalid or missing data with `400`.
- Return `404` for missing resources.
- Return `409` for duplicate category names, category deletion while referenced by products, and stock decrements that would make quantity negative.
- Ensure stock adjustment is atomic and never allows negative quantity.
- When assigning a category to a product, verify that the category exists.
- Populate category details in product responses.
- Use `201` for creates, `200` for successful reads/updates, and `204` for deletes.
- Return consistent JSON error responses.
- Include centralized error handling and JSON responses for unknown routes.

Testing:

- Write Jest/Supertest integration tests using mongodb-memory-server.
- Test complete product CRUD, category CRUD, duplicate category handling, category-reference deletion conflicts, validation failures, invalid IDs, missing resources, stock set/update/adjust operations, and prevention of negative stock.
- Ensure `npm run lint` and `npm test` pass.

Documentation:

- Document local setup:
  1. `docker compose up -d mongo`
  2. Copy `.env.example` to `.env`
  3. `npm install`
  4. `npm run db:init`
  5. `npm start`

PLAN:

E-commerce Inventory REST API
Summary
Build a Node.js/Express REST API backed by MongoDB for managing products, categories, and stock levels. The API will be JSON-only, unauthenticated, and versioned under /api/v1.
Implementation Changes
Add project setup with package.json, Express server bootstrap, environment configuration, MongoDB connection, and Docker Compose for local MongoDB.
Create Mongoose models:Product: title, cost, description, optional imageUrl, qty, optional category, timestamps.
Category: unique name, optional description, timestamps.

Apply strict validation:Required title and description.
cost and qty must be integers greater than or equal to zero.
imageUrl, when supplied, must be a valid URL.
Category names must be unique.

Add product endpoints:GET /api/v1/products
GET /api/v1/products/:id
POST /api/v1/products
PATCH /api/v1/products/:id
DELETE /api/v1/products/:id

Add category endpoints:GET /api/v1/categories
GET /api/v1/categories/:id
POST /api/v1/categories
PATCH /api/v1/categories/:id
DELETE /api/v1/categories/:id

Reject category deletion with 409 Conflict while products still reference that category.
Add stock endpoints:GET /api/v1/products/:id/stock
PUT /api/v1/products/:id/stock to set an absolute quantity.
POST /api/v1/products/:id/stock/adjust to atomically increment or decrement quantity.

Prevent stock from becoming negative and return 409 Conflict for insufficient inventory.
Use consistent HTTP status codes:201 for creation.
200 for successful reads and updates.
204 for deletion.
400 for malformed input.
404 for missing resources.
409 for duplicate or conflicting operations.

Add centralized error-handling middleware, request validation, JSON 404 handling, and health check endpoint.
Document setup, environment variables, endpoints, request examples, and Docker usage in README.md.
Test Plan
Use Jest and Supertest with an in-memory MongoDB instance.
Cover product CRUD, validation, missing IDs, duplicate/conflicting references, and optional image URLs.
Cover category CRUD, duplicate names, and referenced-category deletion rejection.
Cover stock reads, absolute updates, atomic positive/negative adjustments, and prevention of negative quantities.
Add API-level tests for status codes and consistent error response bodies.
Verify the application starts correctly with configured MONGO_URI and passes lint/test scripts.
Assumptions
The project will use modern JavaScript with Node.js and Express.
Products reference at most one category; category assignment is optional.
Stock is stored directly as Product.qty; stock endpoints provide controlled set/adjust operations.
No authentication or authorization is included in the initial version.
Pagination and advanced search are out of scope unless required by a later specification.