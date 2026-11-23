---
name: oecm-prisma-db-optimizer
description: Database design, query optimization, indexing conventions, and transactional integrity guidelines for OECM Portal using Prisma and MySQL. Use when authoring Prisma schema changes, writing queries, optimizing database performance, handling transactions, or writing migrations.
---

# OECM Prisma DB Optimizer Skill

This skill enforces database schema conventions, indexing strategies, query projection optimization, and transactional safety for the MySQL database managed via Prisma ORM in the **OECM Portal**.

---

## 1. Schema Conventions & Mapping Rules

All models in `backend/prisma/schema.prisma` must adhere to strict OECM conventions:

1. **Table Mapping**: Every model must map to an explicit snake_case table name prefixed with `oecm_`:
   ```prisma
   model CentreDocument {
     id       String @id @default(cuid())
     centreId String
     // ...
     @@map("oecm_centre_documents")
   }
   ```
2. **Indexing Standards**:
   - Every foreign key used in joins or `where` clauses must have an explicit `@@index`.
   - Frequently filtered compound queries require composite indexes:
     ```prisma
     @@index([clientId, status])
     @@index([centreId, documentType])
     @@index([projectId, examDate])
     ```
   - Unique constraints must use `@@unique` or `@unique` (e.g., `centreCode`, `projectCode`, `accountNumber`).
3. **No Database Resets**:
   - Never run `prisma migrate reset` or `prisma db push --force-reset`.
   - Add new columns as optional (`Type?`) or provide a sensible `@default(...)` to preserve backwards compatibility with live records.

---

## 2. Query Projection Optimization (Never Fetch Heavy Base64 Payloads)

Several models store binary/Base64 payloads in `@db.LongText` columns (e.g., `CentreDocument.fileUrl`, `CentreDocument.fileData`).

### 🚫 The Anti-Pattern:
```typescript
// ❌ BAD: Loads dozens of megabytes of Base64 strings into memory
const docs = await prisma.centreDocument.findMany({
  where: { centreId },
});
```

### ✅ The Optimized Pattern:
In list, table, and summary views, **always use explicit projections** to exclude heavy text columns:
```typescript
// ✅ GOOD: Fetches only metadata in milliseconds
const docs = await prisma.centreDocument.findMany({
  where: { centreId },
  select: {
    id: true,
    documentType: true,
    documentName: true,
    fileName: true,
    fileSize: true,
    mimeType: true,
    status: true,
    version: true,
    uploadedAt: true,
    rejectionReason: true,
    // fileUrl is intentionally omitted!
  },
  orderBy: { createdAt: 'desc' },
});
```
Only query `fileUrl` when serving a specific download or preview endpoint for a single record (`findUnique({ where: { id } })`).

Similarly, when querying `User` records for listings or responses, **always exclude `passwordHash`**:
```typescript
select: {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  centreId: true,
  clientId: true,
  createdAt: true,
}
```

---

## 3. Parallel Query Execution with `Promise.all`

Whenever fetching a list of records alongside its pagination total or related metrics, avoid sequential `await` calls:

```typescript
// ❌ Sequential (slow):
const total = await prisma.project.count({ where });
const projects = await prisma.project.findMany({ where, skip, take: limit });

// ✅ Parallel (2x faster):
const [projects, total] = await Promise.all([
  prisma.project.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { client: { select: { id: true, name: true } } },
  }),
  prisma.project.count({ where }),
]);
```

---

## 4. Transactional Multi-Table Integrity

When a business operation touches multiple related tables (e.g., Centre Onboarding saving `centre`, `capacity`, `contacts`, `infrastructure`, and `bankAccount`), wrap the operations inside an atomic transaction:

```typescript
return prisma.$transaction(async (tx) => {
  // 1. Update primary record using tx
  const centre = await tx.centre.update({
    where: { id: centreId },
    data: { centreStatus: 'Registered' },
  });

  // 2. Update related bank account
  await tx.centreBankAccount.update({
    where: { centreId },
    data: { verificationStatus: 'Pending Verification' },
  });

  // 3. Record audit trail
  await tx.auditLog.create({
    data: {
      userId,
      userEmail,
      action: 'CENTRE_APPLICATION_SUBMITTED',
      entity: 'Centre',
      entityId: centreId,
    },
  });

  return centre;
}, {
  timeout: 25000, // 25s timeout for heavy payloads
  maxWait: 10000,
});
```
