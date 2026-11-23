---
name: oecm-backend-module-builder
description: Architectural blueprint and implementation guide for building backend modules in the OECM Portal using Express, TypeScript (NodeNext), Prisma, and Zod. Use when creating or refactoring backend routes, controllers, services, schemas, auth middleware, and audit logs.
---

# OECM Backend Module Builder Skill

This skill defines the canonical backend module architecture for the **OECM Portal**, ensuring uniform code quality, TypeScript `NodeNext` compatibility, declarative validation, transactional safety, and comprehensive auditability.

---

## 1. The 4-File Module Structure

Every backend domain module in `backend/src/modules/<domain>/` must strictly adhere to the 4-file pattern:

```
backend/src/modules/<domain>/
├── <domain>.routes.ts       # Express router, middleware attachment, route mapping
├── <domain>.controller.ts   # HTTP request parsing, status codes, sendSuccess / sendError
├── <domain>.service.ts      # Domain logic, Prisma queries, transactions, security rules
└── <domain>.schemas.ts      # Zod validation schemas for body, query, and params
```

When a service exceeds ~500 lines or covers distinct functional areas (such as `admin.service.ts`), it must be modularized into domain subservices under a `services/` directory and unified through a clean facade/delegator:

```
backend/src/modules/admin/
├── services/
│   ├── analytics.service.ts
│   ├── user-admin.service.ts
│   ├── client-admin.service.ts
│   ├── project-admin.service.ts
│   ├── centre-admin.service.ts
│   ├── system-admin.service.ts
│   ├── exam-admin.service.ts
│   └── index.ts
├── admin.routes.ts
├── admin.controller.ts
├── admin.schemas.ts
└── admin.service.ts         # Backward-compatible facade delegating to subservices
```

---

## 2. TypeScript NodeNext ESM Import Rules

The backend compiles under `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`.

- **Mandatory Extension**: All relative imports within backend TypeScript files **MUST** specify the `.js` extension:
  ```typescript
  // ✅ Correct:
  import { prisma } from '../../config/database.js';
  import { sendSuccess, sendError } from '../../utils/response.js';
  import { CentreService } from './centre.service.js';
  import { saveDraftSchema } from './centre.schemas.js';

  // ❌ Incorrect (will fail TypeScript / NodeNext build):
  import { prisma } from '../../config/database';
  import { CentreService } from './centre.service';
  ```

---

## 3. Middleware Pipeline Standard

All protected routes must apply middleware in this exact order:

```typescript
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { ExampleController } from './example.controller.js';
import { createExampleSchema, queryExampleSchema } from './example.schemas.js';

const router = Router();

// 1. Authenticate JWT token & attach req.user
router.use(authMiddleware);

// 2. Authorize allowed roles
router.use(requireRole(Role.ADMIN, Role.OPERATIONS));

// 3. Validate request schema & delegate to controller
router.get(
  '/',
  validateRequest({ query: queryExampleSchema }),
  ExampleController.list
);

router.post(
  '/',
  validateRequest({ body: createExampleSchema }),
  ExampleController.create
);

export default router;
```

---

## 4. Standard Response Envelope (`sendSuccess` & `sendError`)

Controllers must never return raw Express responses directly. Use the helpers from `backend/src/utils/response.js`:

```typescript
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { ExampleService } from './example.service.js';

export class ExampleController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await ExampleService.list(req.query);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve items';
      sendError(res, 500, 'EXAMPLE_LIST_ERROR', msg);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const created = await ExampleService.create(req.body, req.user!.userId, req.user!.email);
      sendSuccess(res, created, 201, { message: 'Item created successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Creation failed';
      sendError(res, 400, 'EXAMPLE_CREATE_ERROR', msg);
    }
  }
}
```

---

## 5. Audit Logging on Data Mutations

Every create, update, delete, or status change must record an entry in `oecm_audit_logs`:

```typescript
await tx.auditLog.create({
  data: {
    userId,
    userEmail,
    action: 'CENTRE_STATUS_UPDATED',
    entity: 'Centre',
    entityId: centreId,
    details: {
      previousStatus: existing.centreStatus,
      newStatus: updatedStatus,
      reason: remarks || null,
    },
  },
});
```

---

## 6. Multi-Tenant & Role Isolation Rules

- **Client Isolation**: When querying projects, analytics, or examination schedules, always scope by `clientId` unless the caller is `ADMIN` with no client filter applied.
- **Centre Isolation**: When handling Centre user requests, verify that the centre being modified matches the authenticated user's assigned centre via `Centre.userId` or `User.centreId`.
- **Regional Scoping (`User.scope`)**: If a user possesses regional scope restrictions (e.g., specific states or zones), apply corresponding `where` filters in Prisma queries.
