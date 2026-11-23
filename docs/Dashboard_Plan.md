# 🏗️ Operations & Examination Management Portal — Dashboard Development Plan

> **Source Documents Analyzed:** 9 PDF files — FRD, SRS, Centre Management Fields, and 6 Role-wise Specs (Admin, Project Manager, Auditor/IT, Operations Executive, Accounts/Finance, Centre User)

---

## 📋 Project Overview

**Portal Name:** Operations & Examination Management Portal  
**Type:** Browser-based Responsive Web Portal  
**Purpose:** System of record for project, centre, booking, workflow, document, audit, allocation, commercial, invoice, payment and accountability data  
**Architecture:** Internal Portal + Centre Portal + Core API + Reporting Layer

---

## 👥 6 User Roles & Their Dashboards

| # | Role | Dashboard Name | Key Focus |
|---|------|---------------|-----------|
| 1 | **Admin** | Home / Executive Overview | Enterprise KPIs, all users, full control |
| 2 | **Project Manager** | Home / My Projects | Project lifecycle, SLA, allocation, closure |
| 3 | **Auditor / IT** | Home / My Audits | Assigned audits, technical scans, mock status |
| 4 | **Operations Executive** | Home / Operations Board | Booking, centres, documents, readiness |
| 5 | **Accounts / Finance** | Home / Finance Overview | Invoices, payments, reconciliation |
| 6 | **Centre User** | Home / Centre Dashboard | Own centre profile, consent, docs, readiness |

---

## 🗂️ Module Groups (from SRS + FRD)

```
Platform Foundation    → Identity, RBAC, Config, Audit Log, Notifications
Core Operations        → Projects, Centre Master, Eligibility, Booking, Consent, Docs
Compliance             → Audits, Technical Scans, Exceptions, Rework, Re-audit
Execution              → Allocation, Calling, Readiness, Mock, Incidents, Tickets, Inventory
Commercial & Finance   → Cost Sheets, Agreements, Invoices, Payments, Closure
Reporting              → Role-filtered MIS, Operational Reports, Finance Reports, Exports
```

---

## 🗓️ PHASE-WISE DEVELOPMENT PLAN

---

### ✅ PHASE 1 — Foundation & Auth (Week 1–2)

**Goal:** Login system, RBAC, navigation skeleton, design system

#### Tasks:
- [ ] **1.1** Project setup — Next.js / React + TailwindCSS (or Vite)
- [ ] **1.2** Design System — Color palette, typography (Inter font), component library
- [ ] **1.3** Authentication UI — Login page, forgot password, session management
- [ ] **1.4** Role-Based Route Guard — 6 roles → different layout/menus
- [ ] **1.5** Sidebar Navigation — Role-wise menu (dynamic from role config)
- [ ] **1.6** Notification Bell — Unread count, notification drawer (scope-aware)
- [ ] **1.7** Top Header — User profile, role badge, breadcrumb, logout

**Deliverable:** Logged-in shell with correct menu per role, no content yet

---

### ✅ PHASE 2 — Platform Foundation Modules (Week 3–4)

**Goal:** Admin-managed master data and user management

#### 2A. User & Role Management *(Admin only)*
- [ ] User list — create, edit, assign role, assign scope (client/project/centre)
- [ ] Role permission matrix view
- [ ] Project team assignment UI

#### 2B. Client & Project Management *(Admin + PM)*
- [ ] Client master — create/edit client
- [ ] Project setup — exam type, city, dates, buffer, candidate targets
- [ ] Project stage tracker — visual pipeline

#### 2C. Centre Master *(Admin + Ops)*
From `Centre_Management_Portal_Module_Wise_Fields.pdf`:
- [ ] Centre form — 20+ fields (region, state, city, edu code, TC code, name, address, pincode, org type, status)
- [ ] Centre contacts — Owner, TCA, IT Person, Electrician (reusable contact form with `person_type`)
- [ ] Capacity records — total systems, exam nodes, buffer %, registration desk count
- [ ] Centre status workflow — Draft → Active → Approved / Rejected / Inactive

#### 2D. Configuration & Audit Trail *(Admin)*
- [ ] Notification event rule configurator
- [ ] Audit Trail log viewer — immutable, filterable

**Deliverable:** Admin can configure full system, add users, projects, centres

---

### ✅ PHASE 3 — Core Operations (Week 5–7)

**Goal:** Booking, eligibility, consent, documents

#### 3A. Eligibility & Blacklist *(Admin + PM + Ops)*
- [ ] Centre eligibility check per project
- [ ] Blacklist management — confidential reasons, override history

#### 3B. Booking & Locking *(Ops + PM + Admin)*
- [ ] Booking request flow — invite centre → centre accepts/discusses/rejects
- [ ] Booking conflict detection — visual warning
- [ ] Booking lock/replacement history

#### 3C. Digital Consent *(Ops + Centre User)*
- [ ] Consent request panel — sent to Centre User
- [ ] Centre User responds — Accept / Discuss / Reject (comment mandatory for discuss/reject)
- [ ] Consent status tracker per project-centre

#### 3D. Document Management *(All roles, scope-based)*
From module 4 fields:
- [ ] Document checklist — 20+ doc types (MOU, NDA, ID proofs, PCC, GST, PAN, etc.)
- [ ] Upload UI per doc type — version-controlled
- [ ] Mandatory / Optional / Project-based tagging
- [ ] Review & approve / rework / reject flow with reason & due date
- [ ] Document completeness progress indicator

**Deliverable:** Full booking → consent → document pipeline working

---

### ✅ PHASE 4 — Compliance & Audit (Week 8–9)

**Goal:** Audit assignment, technical scans, mock status

#### 4A. Audit Management *(Auditor/IT + PM + Admin)*
- [ ] Audit assignment — assign to specific project-centre
- [ ] Evidence upload — findings, photo evidence
- [ ] Findings categorisation — Critical, High, Medium, Low
- [ ] Rework flow — reason, owner, due date, re-audit trigger
- [ ] Audit validity checker

#### 4B. Technical Scan *(Auditor/IT)*
- [ ] MAC address scan — duplicate MAC detection (critical alert)
- [ ] Technical scan report — per centre per project

#### 4C. Mock Status *(Auditor/IT → only for assigned scope)*
- [ ] Mock status update — Pass / Fail / Not Conducted
- [ ] Remarks mandatory for fail/not-conducted
- [ ] Mock status visible to PM for escalation
- [ ] Failed mock → immediate critical notification

**Deliverable:** Full audit compliance workflow

---

### ✅ PHASE 5 — Execution Layer (Week 10–11)

**Goal:** Allocation, readiness, incidents, calling log

#### 5A. Allocation Management *(Ops + PM + Admin)*
- [ ] Allocation sheet — centres, shifts, candidate counts
- [ ] Allocation validation rules — capacity, buffer
- [ ] PM approval + lock workflow
- [ ] Post-lock change request (with justification)
- [ ] Locked-allocation change → immediate critical notification

#### 5B. Readiness & Exam-Day *(Ops + Auditor + PM + Centre User)*
- [ ] Readiness confirmation form — manpower, UPS, DG, electricity details
- [ ] Readiness status tracker — per centre per project
- [ ] Exam-day updates — centre-side input + ops monitoring

#### 5C. Incident & Ticket Management *(All internal roles)*
- [ ] Incident creation — type, priority, owner, timer
- [ ] Escalation flow with SLA countdown
- [ ] Ticket clarification between ops and centre

#### 5D. Inventory *(Ops)*
- [ ] Material/asset tracking per centre per project

**Deliverable:** Full execution layer — exam-day ready

---

### ✅ PHASE 6 — Commercial & Finance (Week 12–13)

**Goal:** Cost sheets, invoices, payments

#### 6A. Cost Sheet & Versions *(Ops + Admin + Finance)*
- [ ] Cost sheet builder — per project-centre
- [ ] Version history — no silent overwrite rule
- [ ] Approval workflow

#### 6B. Agreements *(Finance + Centre User)*
- [ ] Quotation submission by Centre User
- [ ] MOU & Undertaking upload
- [ ] Agreement status tracker

#### 6C. Invoice Management *(Finance + Centre User)*
- [ ] Invoice submission by Centre User
- [ ] Internal review + approve / reject
- [ ] Payment recording + reconciliation
- [ ] Finance closure checklist

**Deliverable:** Full commercial pipeline closed

---

### ✅ PHASE 7 — Notification System (Week 14 — runs in parallel)

**Goal:** RBAC-scoped internal notifications

#### Rules (from all 6 role docs):
- Internal notifications → **Admin, PM, Auditor/IT, Ops Exec ONLY**
- Accounts/Finance & Centre User → workflow-specific notifications only
- Notification payload: Project ID, module, record ref, action type, actor, timestamp, priority, summary + deep link
- Critical triggers → **immediate**: booking conflict, eligibility restriction, audit failure, duplicate MAC, failed mock, readiness blocker, locked-allocation change, critical incident

#### Tasks:
- [x] Notification event engine — event trigger rules (`NOTIFICATION_TRIGGER_RULES`)
- [x] Recipient resolver — project team + scope filter (`filterNotificationsByRole`)
- [x] Push notification UI — bell icon, drawer, unread count badge & interactive popup
- [x] Notification log — trigger, recipients, delivery status, read status (`NotificationCenterPage.jsx`)
- [x] Duplicate consolidation logic (`dispatchNotification` with 60-min window consolidation)
- [x] Deep link routing — respects RBAC & auto-marks as read

**Deliverable:** Full notification system with audit trail (Completed)

---

### ✅ PHASE 8 — MIS & Reporting Dashboards (Week 15–16)

**Goal:** Role-filtered reports and executive dashboards

#### Dashboard Widgets per Role:

**Admin — Executive Overview:**
- Total active projects, centres, users
- Workflow health heatmap
- Exception count (by type)
- Notification volume & failed deliveries
- Cross-project MIS table + export

**Project Manager — My Projects:**
- Project stage pipeline (Kanban/Gantt)
- SLA compliance chart
- Overdue actions count
- Centre coverage % per project
- Allocation lock status

**Auditor/IT — My Audits:**
- Assigned audit queue
- Findings by severity (pie/bar)
- Mock pass/fail rate
- Pending re-audits

**Operations Executive — Operations Board:**
- Booking funnel chart
- Consent status matrix
- Document completeness progress
- Readiness status per centre
- Incident heat by region

**Accounts/Finance — Finance Overview:**
- Invoice pending / approved / paid counts
- Payment reconciliation tracker
- Commercial closure checklist
- Cost sheet version alerts

**Centre User — Centre Dashboard:**
- Pending action items (checklist)
- Document upload status
- Consent response status
- Readiness confirmation status

#### Tasks:
- [x] Chart library integration (Recharts — BarChart, PieChart, Donut, Custom Tooltips)
- [x] Filterable data tables — search, sort, export CSV/Excel (`exportToCSV` browser engine)
- [x] Report templates — Operational, Compliance, Financial (`MISReportsPage.jsx`)
- [x] Management/CEO read-only scoped view (KPI + exception only)

**Deliverable:** Full MIS & reporting suite with native CSV export (Completed)

---

## 🛠️ Technical Architecture Decisions

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React + Vite / Next.js | Fast, component-based |
| Styling | TailwindCSS + shadcn/ui | Rapid premium UI |
| Charts | Recharts or ApexCharts | Flexible, responsive |
| State | Zustand / React Query | Role state + server data |
| Auth | JWT + RBAC middleware | 6 roles, scope filters |
| API | REST / Node.js Express | Standard, scalable |
| DB | PostgreSQL | Relational, versioned data |
| File Storage | AWS S3 / Azure Blob | Documents, evidence, photos |
| Notifications | WebSockets / SSE | Real-time push |
| Audit Log | Immutable append-only table | Compliance requirement |

---

## 📊 Data Models (Key Tables)

```
users                → id, name, email, role, scope
clients              → id, name
projects             → id, client_id, name, status, stage, dates
centres              → id (centre_id), region, state, city, edu_code, tc_code, name, status
centre_contacts      → id, centre_id, person_type, full_name, contact_number, email
centre_documents     → id, centre_id, project_id, doc_type, file_url, version, status
centre_project_assignments → id, centre_id, project_id, capacity, status
eligibility          → id, centre_id, project_id, status, reason (confidential)
bookings             → id, centre_id, project_id, status, dates
consents             → id, centre_id, project_id, status, comment
audits               → id, centre_id, project_id, auditor_id, status, findings[]
allocations          → id, project_id, version, locked, approved_by
invoices             → id, centre_id, project_id, amount, status
notifications        → id, trigger_event, recipients[], delivery_status, read_status, deep_link
audit_trail          → id, user_id, action, module, record_ref, timestamp (immutable)
```

---

## 🚦 Development Priority Order

```
1. Auth + RBAC shell          (blocker for everything)
2. Admin User Management      (needed before any user testing)
3. Centre Master              (core entity all modules reference)
4. Project Setup              (needed for booking/audit scope)
5. Booking + Consent + Docs   (core operations pipeline)
6. Audit + Mock               (compliance gate)
7. Allocation + Readiness     (execution gate)
8. Commercial + Invoice        (finance closure)
9. Notifications              (runs parallel from phase 3)
10. MIS + Dashboards          (final layer, visible output)
```

---

## ⚠️ Critical Business Rules (Must Enforce in Code)

- [ ] **No silent delete** — versions, cancellations, history always retained
- [ ] **Mandatory gates** — Eligibility → Document → Audit → Consent → Allocation gates must pass before next stage
- [ ] **Rework always requires** — reason + owner + due date
- [ ] **Duplicate MAC = critical alert** — immediate notification
- [ ] **Locked allocation** — change requires request + justification + PM approval
- [ ] **Confidential eligibility reasons** — visible to Admin & PM only
- [ ] **Scope isolation** — users only see data in their assigned client/project/centre scope
- [ ] **Notification exclusion** — Accounts/Finance and Centre User never receive internal project-management notifications

---

## 📁 Folder Structure (Frontend)

```
src/
├── components/
│   ├── common/          (Button, Modal, Table, Badge, Input, etc.)
│   ├── layout/          (Sidebar, Header, Breadcrumb, NotificationDrawer)
│   └── charts/          (KPICard, PieChart, BarChart, GanttBar)
├── pages/
│   ├── admin/           (dashboard, users, config, audit-trail)
│   ├── project-manager/ (projects, allocation, closure)
│   ├── auditor/         (audits, technical-scan, mock-status)
│   ├── operations/      (booking, consent, docs, readiness)
│   ├── finance/         (invoices, payments, cost-sheets)
│   └── centre/          (profile, consent, docs, readiness, invoice)
├── hooks/               (useAuth, useNotifications, useScope)
├── store/               (authStore, projectStore, notificationStore)
├── api/                 (apiClient, endpoints per module)
└── utils/               (permissions, dateUtils, fileUtils)
```

