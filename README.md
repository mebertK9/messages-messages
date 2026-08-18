# Household Wishlist API

REST API for managing household purchase wishes, shop assignments, and shopping trips.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js 24
- **Framework:** Express.js
- **Database:** PostgreSQL with TypeORM
- **Auth:** JWT + Bcrypt
- **Deployment:** Docker + Render.com

## Local Development

### With Docker Compose

```bash
# Clone and setup
git clone https://github.com/mebertK9/messages-messages.git
cd messages-messages

# Start all services (Postgres + Node)
docker-compose up

# App runs at http://localhost:3000
# Database at localhost:5432
```

### Without Docker

```bash
# Install dependencies
npm install

# Set up PostgreSQL locally and create .env from .env.example
cp .env.example .env

# Run migrations
npm run migration:run

# Start dev server
npm run dev
```

## Build & Test

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Database Migrations

```bash
# Generate migration after entity changes
npm run migration:generate InitSchema

# Apply pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Deployment (Render.com)

1. Connect GitHub repo to Render
2. Set environment variables:
   - `DATABASE_URL` (from Render PostgreSQL service)
   - `JWT_SECRET` (generate strong secret)
   - `NODE_ENV=production`
3. Build command: `npm run build`
4. Start command: `npm start`
5. Render runs migrations automatically via Dockerfile

## API Documentation

See `openapi.yml` for full API specification.

## Project Structure

```
src/
  ├── index.ts                 # Express app entry point
  ├── config/                  # Configuration (DB, auth)
  ├── entities/                # TypeORM entities (DB schema)
  ├── middleware/              # Express middleware (auth, errors)
  ├── routes/                  # API route handlers
  ├── services/                # Business logic
  ├── dto/                     # Request/response schemas
  └── utils/                   # Helpers (JWT, password, errors)
migrations/                     # TypeORM migrations
tests/                          # Test suite
```
