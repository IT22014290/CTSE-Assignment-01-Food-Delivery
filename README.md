# Food Delivery Microservices Platform

A full-stack food delivery system built with Node.js microservices, React frontend, MongoDB, Docker, and Nginx API Gateway.

## Architecture Overview

This project uses 4 backend microservices and 1 shared frontend:

- Auth Service (`:3001`) - user auth, JWT, role-based access
- Restaurant Service (`:3002`) - restaurant and menu CRUD, search/filter
- Order Service (`:3003`) - place/manage orders, status transitions
- Delivery Service (`:3004`) - driver assignment, live GPS tracking
- Frontend (`:3000`) - React + Tailwind user interfaces
- Nginx API Gateway (`:80`) - routes requests across services
- MongoDB (`:27017`) - shared database server with service-specific DBs

### Request Routing

- `/api/auth/*` -> `auth-service:3001`
- `/api/restaurants/*` -> `restaurant-service:3002`
- `/api/orders/*` -> `order-service:3003`
- `/api/delivery/*` -> `delivery-service:3004`
- `/*` -> `frontend:3000`

### Inter-Service Communication

- All protected routes in non-auth services validate JWT via Auth Service (`GET /auth/validate-token`)
- Order Service verifies restaurant/menu data via Restaurant Service before creating orders
- Delivery Service updates order status via Order Service when deliveries progress to `picked_up` and `delivered`
- All service URLs are configured via environment variables

## Local Run (Docker Compose)

From project root:

```bash
docker compose up --build
```

Then open:

- Frontend + Gateway: `http://localhost`
- Direct health checks:
  - `http://localhost/api/auth/health`
  - `http://localhost/api/restaurants/health`
  - `http://localhost/api/orders/health`
  - `http://localhost/api/delivery/health`

## Environment Variables

Each service has its own `.env.example`:

- `auth-service/.env.example`
- `restaurant-service/.env.example`
- `order-service/.env.example`
- `delivery-service/.env.example`

### Key Variables

- `PORT`
- `MONGO_URI`
- `ALLOWED_ORIGINS`
- `AUTH_SERVICE_URL` (services that need token validation)
- `RESTAURANT_SERVICE_URL` (order-service)
- `ORDER_SERVICE_URL` (delivery-service)
- `JWT_SECRET`, `JWT_EXPIRES_IN` (auth-service)

## API Summary

### Auth Service

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/validate-token`
- `GET /auth/profile`
- `PUT /auth/profile`
- `GET /health`

### Restaurant Service

- `GET /restaurants`
- `GET /restaurants/:id`
- `POST /restaurants`
- `PUT /restaurants/:id`
- `GET /restaurants/:id/menu`
- `POST /restaurants/:id/menu`
- `PUT /restaurants/:id/menu/:itemId`
- `DELETE /restaurants/:id/menu/:itemId`
- `GET /health`

### Order Service

- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `PUT /orders/:id/status`
- `GET /orders/restaurant/:restaurantId`
- `GET /health`

### Delivery Service

- `POST /delivery/assign`
- `PUT /delivery/:orderId/location`
- `GET /delivery/:orderId`
- `GET /delivery/driver/active`
- `GET /health`

## Frontend Pages

- Landing page
- Register/login page
- Restaurant listing and filtering
- Restaurant detail with categorized menu
- Cart + checkout
- Order tracking timeline + Leaflet map
- Restaurant owner dashboard
- Driver dashboard

## Security Features

- `helmet` configured on every backend service
- CORS restricted by `ALLOWED_ORIGINS`
- Password hashing with `bcryptjs`
- JWT expiry set to 24h
- Login rate limiting (`express-rate-limit`) in Auth Service
- Input validation with `express-validator`
- Centralized error middleware and consistent response shape:
  - `{ success: true|false, data: {}, message: "..." }`

## Seed Data

Seed sample restaurants and menu items:

```bash
cd restaurant-service
npm install
npm run seed
```

## CI/CD Workflows

Each backend service includes a dedicated GitHub Actions workflow in `.github/workflows/`:

- `auth-service.yml`
- `restaurant-service.yml`
- `order-service.yml`
- `delivery-service.yml`

Each workflow runs on push to `main` and executes:

1. Checkout code
2. Run service tests (`npm test`)
3. Build Docker image
4. Push image to Docker Hub
5. Deployment placeholder step for cloud commands

Required GitHub secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Test