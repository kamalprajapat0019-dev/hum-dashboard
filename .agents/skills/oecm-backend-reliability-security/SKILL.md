---
name: oecm-backend-reliability-security
description: Architectural rules and security standards for building reliable backend endpoints in OECM Portal. Enforces authMiddleware, requireRole, tenant/centre scoping, Zod validation, safe error formatting, and audit trail logging.
---

# OECM Backend Reliability & Security Skill

This skill enforces authentication boundaries, role-based authorization, multi-tenant data isolation, request validation, exception safety, and transactional audit logging across the **OECM Portal** Express/NodeJS backend.

---

## 1. Authentication & Security Middleware Chain

Every private endpoint must be guarded by the central middleware chain in exact sequence:

```
Request ──▶ authMiddleware ──▶ requireRole(...) ──▶ validateRequest(...) ──▶ Controller
```

### 1. `authMiddleware`
- Verifies the `Authorization: Bearer <jwt_token>` header.
- Decodes the token and attaches `req.user` (`userId`, `email`, `role`, `centreId`, `clientId`, `scope`).
- Rejects tampered, expired, or malformed tokens with `401 Unauthorized` and code `INVALID_TOKEN` or `EXPIRED_TOKEN`.

### 2. `requireRole(...allowedRoles)`
- Validates that `req.user.role` is included in `allowedRoles`:
  ```typescript
  router.get(
    '/users',
    authMiddleware,
    requireRole(Role.ADMIN),
    UserController.listUsers
  );
  ```
- Rejects unauthorized access with `403 Forbidden` and code `FORBIDDEN_RESOURCE`.

### 3. `validateRequest({ body, query, params })`
- Applies Zod schema validation before the request hits controller logic.
- Returns formatted 400 validation error payloads if input fails validation.

---

## 2. Multi-Tenant & Data Isolation Governance

Data must never leak across client or centre boundaries:

### 🏢 Centre User Isolation (`Role.CENTRE`)
- A Centre User can **ONLY** read or mutate records belonging to their assigned centre.
- Always check both `Centre.userId` and `User.centreId` (the Dual-Resolution rule):
  ```typescript
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { centreId: true },
  });

  const centre = await prisma.centre.findFirst({
    where: {
      OR: [
        { userId },
        ...(user?.centreId ? [{ id: user.centreId }] : []),
      ],
    },
  });

  if (!centre) {
    throw new Error('Access denied: no accredited centre found for your account.');
  }
  ```

### 🏛️ Client & Project Isolation
- When non-admin users or project managers query projects, examinations, or bookings, the query must be explicitly scoped by their authorized `clientId` or `projectId`.
- Cross-client project filtering without authorization must be rejected with `400` or `403`.

### 🌐 Regional Scope Scoping (`User.scope`)
- When users possess regional constraints (e.g. state or region in `User.scope`), backend services must enforce those constraints in Prisma `where` conditions.

---

## 3. Input Validation with Zod (`<domain>.schemas.ts`)

Controllers must never trust raw `req.body` or `req.query`. All inputs must be strictly typed using Zod:

```typescript
import { z } from 'zod';

export const createCentreSchema = z.object({
  centreName: z.string().min(3, 'Centre name must be at least 3 characters'),
  centreCategory: z.string().min(1, 'Category is required'),
  centreAddress: z.string().min(5, 'Address is required'),
  pincode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
  totalNodes: z.number().int().positive('Total nodes must be greater than 0'),
});

export const centreQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  stateName: z.string().optional(),
});
```

---

## 4. Safe Error Responses (Never Leak Internals)

Backend endpoints must never return raw database error messages, stack traces, table names, or internal connection strings to the client:

```typescript
// ✅ Good: Uniform, sanitized error response
export class ExampleController {
  static async getItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await ExampleService.get(req.params.id);
      if (!data) {
        sendError(res, 404, 'ITEM_NOT_FOUND', 'The requested resource was not found.');
        return;
      }
      sendSuccess(res, data);
    } catch (err: unknown) {
      // Log full internal error on server console / logger
      console.error('[ExampleController.getItem] Internal error:', err);
      // Return safe message to client
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
    }
  }
}
```

---

## 5. Mandatory Audit Logging (`oecm_audit_logs`)

All create, update, delete, status transition, and security events must write to `oecm_audit_logs`:

```typescript
await tx.auditLog.create({
  data: {
    userId: req.user.userId,
    userEmail: req.user.email,
    action: 'CENTRE_APPLICATION_APPROVED',
    entity: 'Centre',
    entityId: centre.id,
    details: {
      centreCode: centre.centreCode,
      status: 'Approved',
      approvedBy: req.user.email,
      timestamp: new Date().toISOString(),
    },
  },
});
```

Key audited actions:
- `USER_CREATED`, `USER_DEACTIVATED`, `PASSWORD_RESET`
- `CENTRE_DRAFT_SAVED`, `DOCUMENT_UPLOADED`, `CENTRE_APPROVED`, `CENTRE_REJECTED`
- `PROJECT_CREATED`, `EXAM_SCHEDULED`, `CALENDAR_SYNCED`
- `BANK_VERIFIED`, `PAYMENT_ELIGIBILITY_OVERRIDDEN`
