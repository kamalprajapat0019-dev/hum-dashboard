---
name: oecm-architecture-guard
description: Enforces OECM Portal repository architecture, folder conventions, migration safety, and database-first integration standards. Use when creating or refactoring files, reviewing code structure, organizing frontend/backend modules, or performing database operations.
---

# OECM Architecture Guard Skill

This skill defines and enforces the non-negotiable architectural standards, monorepo directory layout, database safety policies, and data-layer integration rules for the **Operations & Examination Management Portal (OECM Portal)**.

---

## 1. Monorepo Structural Conventions

The repository is organized into distinct frontend and backend boundaries. Every file and module must adhere strictly to its canonical folder location:

```
Hum Dashboard/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma             # Canonical Prisma schema
│   │   ├── migrations/               # Sequential SQL migrations
│   │   └── seed.ts                   # Idempotent baseline seeder
│   └── src/
│       ├── config/                   # env.ts, database.ts
│       ├── middleware/               # auth, role, validate, rate-limit
│       ├── modules/                  # 4-file domain modules
│       │   ├── admin/                # Admin domain & subservices
│       │   ├── auth/                 # Authentication & token lifecycle
│       │   └── centre/               # Centre onboarding & compliance
│       ├── utils/                    # response.ts, logger.ts, security.ts
│       ├── app.ts                    # Express application configuration
│       └── server.ts                 # HTTP server entrypoint
├── frontend/
│   └── src/
│       ├── app/                      # App.jsx, router.jsx, providers.jsx
│       ├── components/               # Common atomic & structural UI
│       │   ├── common/               # KpiCard, StatusBadge, LastUpdated, etc.
│       │   └── feedback/             # Alerts, Toasts, Skeletons
│       ├── constants/                # roles.js, permissions.js, routes.js
│       ├── context/                  # AuthContext.jsx, ClientContext.jsx, UIContext.jsx
│       ├── features/                 # Modular domain features
│       │   ├── admin/                # Admin dashboards, config, logs
│       │   ├── centres/              # Centre registration, audit, documents
│       │   └── projects/             # Projects & Examination management
│       ├── roles/                    # Role-specific workspaces & navigation
│       │   ├── admin/
│       │   ├── centre-user/
│       │   ├── finance/
│       │   ├── operations/
│       │   └── pm/
│       └── services/                 # apiClient.js, endpoints.js
└── docs/                             # Architecture specs, handovers, runbooks
```

---

## 2. Strict Architectural Invariants & Prohibitions

### 🚫 1. Forbid Recreating `frontend/src/pages/`
- The monolithic `frontend/src/pages/` directory has been completely deprecated and removed.
- **NEVER** create files inside `frontend/src/pages/`.
- All user-facing views belong in:
  - Feature-specific directories: `frontend/src/features/<module>/<Component>Page.jsx`
  - Role-specific dashboard layouts: `frontend/src/roles/<role>/<Role>Dashboard.jsx`

### 🚫 2. Forbid Destructive Database Operations
- **NEVER** run destructive Prisma commands:
  - `prisma migrate reset` (strictly prohibited)
  - `prisma db push --force-reset` (strictly prohibited)
  - Raw `DROP TABLE`, `TRUNCATE`, or destructive SQL migrations
- Always write safe, forward-compatible Prisma migrations using `prisma migrate dev --name <migration_name>`.
- Any schema update must preserve existing MySQL records across government client accounts, centres, and examination schedules.

### 🚫 3. Forbid New Mock Stores in `dataService.js`
- `frontend/src/services/dataService.js` contains legacy client-side in-memory mock stores (`ConsentStore`, `DocStore`, `BookingStore`).
- **NEVER** add new mock stores or state persistence to `dataService.js`.
- All new features and refactored components must connect to real Express + Prisma endpoints via `apiClient.js` and `endpoints.js`. Existing features relying on `dataService.js` should be systematically migrated to backend APIs.

### 🚫 4. Preserve API Contract Stability
- Every backend endpoint must respond using the standard response envelope:
  - **Success**: `{ success: true, data: T, meta?: Record<string, any> }`
  - **Failure**: `{ success: false, error: { code: string, message: string, details?: any } }`
- Route paths must maintain the `/api/v1/<domain>/*` prefix.

---

## 3. Architecture Guard Checklist for Pull Requests & Edits

Before completing any task, verify compliance against this checklist:

1. **Path Validation**: Are new frontend components placed under `features/` or `roles/` (and never `pages/`)?
2. **Backend Modularity**: Are backend services split into domain files rather than bloated monolithic services?
3. **Database Safety**: Does any database script preserve existing data without resets?
4. **API Integration**: Is the frontend communicating via `apiClient` using typed endpoints from `endpoints.js`?
5. **RBAC Guarding**: Are protected frontend actions governed by `hasAccess()` using `ROLE_PERMISSIONS`?
