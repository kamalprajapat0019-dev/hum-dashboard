---
name: oecm-database-performance-guard
description: Performance optimization, relational modeling, and query execution standards for MySQL with Prisma in OECM Portal. Enforces oecm_ naming, composite indexing, selective projections, parallel queries, and transactions.
---

# OECM Database Performance Guard Skill

This skill governs relational database design, query optimization, indexing conventions, selective projection strategies, and transactional integrity for the MySQL database in the **OECM Portal**.

---

## 1. Table & Relational Modeling Conventions

Every model in `backend/prisma/schema.prisma` must comply with the following structural rules:

1. **Table Mapping**:
   - Every model must map to an explicit snake_case table name prefixed with `oecm_`:
     ```prisma
     model ExamShift {
       id        String   @id @default(cuid())
       examId    String
       exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
       shiftName String
       // ...
       @@map("oecm_exam_shifts")
     }
     ```
2. **Composite Indexing (`@@index`)**:
   - Foreign keys used in joins must have an index.
   - Filter combinations that occur together in list/dashboard endpoints must have composite indexes:
     ```prisma
     @@index([clientId, status])
     @@index([centreId, documentType])
     @@index([projectId, examDate])
     @@index([examId, shiftDate])
     ```
3. **Unique Constraints (`@@unique` / `@unique`)**:
   - Protect business identifiers against duplicate insertion under concurrent loads:
     ```prisma
     centreCode   String @unique // CTR-2026-0001
     projectCode  String @unique // PRJ-0001
     examCode     String @unique
     accountNumber String
     @@unique([accountNumber])   // Prevents reuse across different centres
     ```

---

## 2. Selective Query Projections (Omit Heavy Payloads)

Several models contain large text fields (e.g. `@db.LongText` Base64 file strings in `CentreDocument.fileUrl`, `fileData`, or `AuditLog.details`):

### 🚫 The Performance Anti-Pattern:
```typescript
// ❌ Loading 50 documents with Base64 payloads pulls 200MB+ into Node.js heap!
const docs = await prisma.centreDocument.findMany({
  where: { centreId },
});
```

### ✅ The Optimized Projection Pattern:
When serving list, search, or summary endpoints, **always select only metadata fields**:
```typescript
// ✅ Fast: Fetches only essential metadata in < 15ms
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
Only load `fileUrl` when the user requests a single file download or preview (`findUnique({ where: { id } })`).

Similarly, when fetching `User` records, always exclude `passwordHash`:
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

Whenever fetching a list alongside its pagination total, summary KPIs, or related filter options, execute queries concurrently:

```typescript
// ❌ Sequential Execution (slow):
const total = await prisma.centre.count({ where });
const centres = await prisma.centre.findMany({ where, skip, take: limit });

// ✅ Concurrent Execution with Promise.all (fast):
const [centres, total] = await Promise.all([
  prisma.centre.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      centreCode: true,
      centreName: true,
      cityName: true,
      stateName: true,
      centreStatus: true,
      _count: { select: { documents: true, bookings: true } },
    },
  }),
  prisma.centre.count({ where }),
]);
```

---

## 4. Multi-Step Mutations with `prisma.$transaction`

Operations that modify multiple tables must be wrapped inside an atomic transaction with sensible timeout configurations:

```typescript
return prisma.$transaction(async (tx) => {
  // 1. Update primary entity using tx
  const updatedExam = await tx.exam.update({
    where: { id: examId },
    data: { status: 'Scheduled' },
  });

  // 2. Insert or update related shifts/dates
  await tx.examShift.createMany({
    data: shiftsData,
  });

  // 3. Write immutable audit log
  await tx.auditLog.create({
    data: {
      userId,
      userEmail,
      action: 'EXAM_SCHEDULE_UPDATED',
      entity: 'Exam',
      entityId: examId,
      details: { shiftCount: shiftsData.length },
    },
  });

  return updatedExam;
}, {
  timeout: 25000, // 25s timeout
  maxWait: 10000, // 10s wait for connection
});
```

---

## 5. Migration Safety Policy

1. **Never Drop or Reset**:
   - `prisma migrate reset` is strictly forbidden.
   - `prisma db push --force-reset` is strictly forbidden.
2. **Additive & Backward-Compatible Migrations**:
   - New columns must be either optional (`Type?`) or provide a `@default(...)`.
   - Never rename or drop columns in a single step on production tables; use a phased deprecation strategy.
