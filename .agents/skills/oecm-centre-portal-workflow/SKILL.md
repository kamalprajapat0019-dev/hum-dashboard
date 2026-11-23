---
name: oecm-centre-portal-workflow
description: End-to-end domain rules, entity relationships, and cross-role lifecycle governance for the Centre User (CENTRE) onboarding, verification, booking, consent, audit, and payout workflows. Use when implementing or updating centre registration, document verification, bank verification, or centre booking features.
---

# OECM Centre Portal Workflow Skill

This skill governs the end-to-end lifecycle, entity relationships, dual-identification rules, and cross-dashboard synchronization for the **Centre User (`CENTRE`)** domain in the **OECM Portal**.

---

## 1. Dual-Resolution Centre Identification Rule

In the OECM Portal, a Centre User may access the system through two distinct onboarding pathways:
1. **Self-Service Draft**: User registers or creates a draft; the `Centre` record has `userId = User.id`.
2. **Administrative Invitation**: Admin creates or invites a Centre User to an existing Centre; the `User` record has `User.centreId = Centre.id`.

### ⚠️ Non-Negotiable Query Standard:
Any service method or controller that looks up the authenticated user's centre **MUST** check both pathways via a dual-condition `OR` clause:

```typescript
// ✅ Correct Dual-Resolution Pattern:
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, centreId: true },
});

const centre = await prisma.centre.findFirst({
  where: {
    OR: [
      { userId },
      ...(user?.centreId ? [{ id: user.centreId }] : []),
    ],
  },
  include: {
    contacts: true,
    capacity: true,
    documents: { orderBy: { createdAt: 'desc' } },
    infrastructure: true,
    bankAccount: true,
    audits: true,
  },
});
```

Querying only `where: { userId }` is an anti-pattern that breaks invited centre accounts.

---

## 2. The 7-Step Centre Registration Dossier

The Centre Registration onboarding flow (`CentreRegistrationPage.jsx`) consists of 7 data entry steps and 1 final submission review:

1. **Step 1: Basic Information**:
   - Centre Name, Category, Region, State, City, Taluka, 6-digit Pincode, EduCode, CentreCode, TC-Code, Total Exam Node Capacity, Previous Examination history, and Official Contact information.
2. **Step 2: Personnel Details**:
   - 4 key personnel profiles: `Owner`, `Centre CS` (Superintendent / TCA), `IT Person` (Head of Lab / Network), and `Electrician`. Includes Aadhaar, contact, and permanent addresses.
3. **Step 3: Document Checklist**:
   - Mandatory Documents: Electricity Bill, Cancelled Cheque, Centre PAN, GST Certificate, EF Data Sheet, Owner ID Proof, MOU (₹500 stamp), NDA (₹100 stamp), Establishment Certificate.
   - Conditional Documents: Trust Deed / Society Certificate (if Trust/Society), Partnership Deed (if Partnership).
4. **Step 4: Facilities & Building Infrastructure**:
   - Building Type, Number of Floors, Entry/Exit Gates, Washrooms (Male/Female/PwD), CCTV Cameras & coverage, Parking, Waiting Area, and Dedicated Server Room with AC & UPS.
5. **Step 5: Power & LAN Infrastructure**:
   - Online UPS (KVA, backup mins), Generator Set (KVA, fuel contract, auto-switchover), Primary & Secondary Enterprise ISP bandwidth, Gigabit Managed Switches.
6. **Step 6: Safety, Security & Hygiene**:
   - Fire Extinguisher counts & refill dates, Fire Safety NOC clearance, First Aid, Smoke Alarms, Marked Emergency Exits, Security Guards, Boundary Wall, Frisking Area.
7. **Step 7: Bank & Commercial Details**:
   - Account Holder Name, Bank Name, Branch, Account Number, IFSC (11 chars), Account Type, and proof upload (Cancelled Cheque / Bank Passbook).
   - **Bank Verification Rule**: Account numbers are checked for uniqueness across centres. Beneficiary name is matched against Centre Name and Owner Name.
   - **Data Masking Rule**: On read, bank account numbers must be masked for Centre Users (e.g., `XXXX XXXX 1234`).
8. **Step 8: Review & Submission**:
   - Summary review across all 7 steps. Triggers final submission and transitions status to `'Registered'`.

---

## 3. Centre Lifecycle State Machine

The centre progresses through formal governance stages across multiple portal roles:

```
[Draft]
   │  (Centre User submits registration dossier)
   ▼
[Registered]
   │  (Operations reviews documents; Finance reviews bank details)
   ▼
[Under Verification]
   │  (Operations assigns certified auditor)
   ▼
[Auditor Assigned]
   │  (Auditor performs physical CCTV, LAN, UPS & security scan)
   ▼
[Approved / Ready to Book]
   │  (Centre is eligible for Examination allocation and Booking)
   ▼
[Completed / Payout Eligible]
```

- **Rejection Flow**: If rejected, `centreStatus` transitions to `Rejected` with a mandatory `rejectionReason`. The Centre User can view the reason on their dashboard and resubmit.
- **Blacklisting**: Enforced via `BlacklistRecord`. Blacklisted centres are automatically excluded from examination booking queries.

---

## 4. Cross-Dashboard Synchronization Rules

When designing features touching the Centre domain, keep state synchronized across all 5 user dashboards:

| Dashboard | Role | Responsibilities |
| :--- | :--- | :--- |
| **Centre User** | `CENTRE` | Fill 7-step form, upload missing/rejected docs, review bank status, digitally sign booking consent. |
| **Operations** | `OPERATIONS` | Review uploaded documents, assign auditors, manage examination seat allocations, verify mock dry-runs. |
| **Auditor** | `AUDITOR` | Conduct on-site technical inspection, upload hardware scan findings, record CCTV & power verification evidence. |
| **Finance** | `FINANCE` | Review bank account validity, set `isPaymentEligible = true`, reconcile commercial rates, process invoices. |
| **Admin** | `ADMIN` | Master directory, final approval override, blacklist enforcement, global audit log inspection. |
