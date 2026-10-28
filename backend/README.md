# 🏛️ OEM Portal — Admin Dashboard Backend

Enterprise Node.js + Express + TypeScript backend providing role-scoped REST APIs for the Operations & Examination Management Portal (OEM Portal), connecting to a remote **MySQL** database via **Prisma ORM**.

---

## 1. Architecture & Tech Stack

- **Runtime:** Node.js (v18+ / v20+ / v22+ / v24+)
- **Language:** TypeScript 5.8 (ES2022 / NodeNext)
- **Framework:** Express.js 4.21
- **Database ORM:** Prisma 6.4 (MySQL Provider)
- **Database Engine:** Remote MySQL Server (`82.29.160.161:3306`, Database: `metabase`)
- **Authentication & Security:**
  - Bearer JWT tokens with configurable expiration (`JWT_SECRET`, `JWT_EXPIRES_IN`)
  - Salted password hashing with `bcryptjs` (Cost factor: 12)
  - Helmet for HTTP security headers
  - CORS with configurable origin whitelisting (`CORS_ORIGIN`)
  - Request rate limiting on sensitive authentication routes (`express-rate-limit`)
  - Role-based authorization middleware enforcing `Role.ADMIN`
  - Automated, immutable audit trail logging on all administrative operations
- **Input Validation:** Strict runtime schema validation using `Zod`
- **Testing:** `Vitest` unit and integration test suite

---

## 2. Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma           # Normalized MySQL schema
│   └── seed.ts                 # Deliberate initial Admin setup script
├── src/
│   ├── config/
│   │   ├── env.ts              # Zod-validated environment config
│   │   └── database.ts         # Prisma client & connection check
│   ├── middleware/
│   │   ├── auth.middleware.ts  # Bearer token verification
│   │   ├── role.middleware.ts  # Role authorization guards (ADMIN)
│   │   ├── error.middleware.ts # Centralized error handler
│   │   ├── validate.middleware.ts # Zod request validator
│   │   └── rateLimiter.middleware.ts # Rate limiting
│   ├── modules/
│   │   ├── auth/               # Login, logout, current profile
│   │   │   ├── auth.schemas.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.routes.ts
│   │   └── admin/              # Admin dashboard domain modules
│   │       ├── admin.schemas.ts
│   │       ├── admin.service.ts
│   │       ├── admin.controller.ts
│   │       └── admin.routes.ts
│   ├── routes/
│   │   └── index.ts            # Centralized API v1 router
│   ├── utils/
│   │   ├── hasher.ts           # Bcrypt password utilities
│   │   ├── jwt.ts              # JWT signing & verification
│   │   └── response.ts         # Standard response wrappers
│   ├── app.ts                  # Express application composition
│   └── server.ts               # Server bootstrap & graceful shutdown
├── tests/
│   ├── auth.test.ts            # Unit tests for hashing, JWT, schemas
│   └── api.test.ts             # Integration tests for health & route guards
├── .env.example                # Safe environment variable template
├── .gitignore                  # Git exclusion rules
├── package.json
└── tsconfig.json
```

---

## 3. Environment Configuration

Create a `.env` file in `backend/` based on `.env.example`:

```dotenv
# Server Configuration
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173

# Remote MySQL Connection
DB_HOST=82.29.160.161
DB_PORT=3306
DB_NAME=metabase
DB_USER=admin_user
DB_PASSWORD=<use-the-supplied-password-locally>

# Prisma Database Connection URL
DATABASE_URL="mysql://admin_user:<password>@82.29.160.161:3306/metabase"

# JWT Authentication
JWT_SECRET="<generate-random-secret-key-at-least-32-chars>"
JWT_EXPIRES_IN="8h"

# Initial Admin Setup Seed
INITIAL_ADMIN_EMAIL="admin@oemportal.in"
INITIAL_ADMIN_PASSWORD="<choose-a-strong-initial-password>"
INITIAL_ADMIN_NAME="Rajesh Kumar"
```

> **Security Rule:** Never commit `.env` files or expose database connection strings to the frontend bundle.

---

## 4. Remote MySQL Database & Migration Workflow

- **Host:** `82.29.160.161`
- **Port:** `3306`
- **User:** `admin_user`
- **Database:** `metabase`

### 4.1 Safe Schema & Migration Policy
Per project safety policy:
- Do not run destructive migrations, database resets, or drop tables on the remote database.
- Confirm whether `metabase` contains existing application metadata before running any migrations.
- Validate and inspect the database with non-destructive, read-only queries.

```bash
# Validate schema without database side-effects
npm run prisma:validate

# Generate Prisma Client
npm run prisma:generate
```

### 4.2 Seeding the Admin User
To seed the initial Admin account and default configuration (only after database safety verification):
```bash
npm run seed
```

---

## 5. API Reference (`/api/v1`)

### 5.1 Public & Health
- `GET /api/v1/health` — Sanitized health check (DB connectivity status, service version, no secrets)

### 5.2 Authentication
- `POST /api/v1/auth/login` — Authenticate with email & password (Rate limited: 20 req / 15 min)
  - **Body:** `{ "email": "admin@oemportal.in", "password": "..." }`
  - **Response:** `{ "success": true, "data": { "token": "jwt...", "user": { ... } } }`
- `GET /api/v1/auth/me` — Retrieve current authenticated user profile (`Bearer <token>`)
- `POST /api/v1/auth/logout` — Invalidate user session client-side

### 5.3 Admin Domain Endpoints (`Bearer <token>` + `Role.ADMIN`)
- `GET /api/v1/admin/analytics` — Executive overview KPI aggregation & chart distributions
- `GET /api/v1/admin/users` — Paginated user directory (filters: `search`, `role`, `status`)
- `POST /api/v1/admin/users` — Create user account with hashed password & audit trail
- `GET /api/v1/admin/users/:id` — User detail
- `PUT /api/v1/admin/users/:id` — Update user profile, role, scope, or password
- `DELETE /api/v1/admin/users/:id` — Soft-delete / deactivate user account
- `GET /api/v1/admin/projects` — Paginated projects directory (filters: `stage`, `status`, `clientId`)
- `POST /api/v1/admin/projects` — Create project
- `GET /api/v1/admin/projects/:id` — Project detail with client & bookings count
- `PUT /api/v1/admin/projects/:id` — Update project stage, status, and targets
- `GET /api/v1/admin/centres` — Paginated centre master directory (filters: `region`, `state`, `city`, `status`)
- `POST /api/v1/admin/centres` — Onboard new examination centre
- `GET /api/v1/admin/centres/:id` — Full centre detail with capacity, contacts, and audits
- `PUT /api/v1/admin/centres/:id` — Update centre details
- `PATCH /api/v1/admin/centres/:id/status` — Approve, reject, or change centre status
- `POST /api/v1/admin/eligibility/blacklist` — Blacklist centre with confidential justification
- `POST /api/v1/admin/eligibility/override` — Override eligibility with documented justification
- `GET /api/v1/admin/audit-logs` — Immutable system audit trail logs
- `GET /api/v1/admin/config` — System configurations
- `PUT /api/v1/admin/config/:key` — Update system configuration value

---

## 6. Development & Verification Commands

```bash
# Run unit and integration tests
npm test

# Build TypeScript to dist/
npm run build

# Start production server
npm start

# Start development server with live reload
npm run dev
```
