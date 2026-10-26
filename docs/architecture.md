# 🏛️ Operations & Examination Management Portal — Enterprise Architecture Specification

## 1. Executive Summary
The **Operations & Examination Management Portal (OEM Portal)** is an enterprise web application serving as the central system of record for examination administration, centre booking, infrastructure auditing, candidate allocation, logistics readiness, financial accounting, and multi-tenant accountability.

The portal enforces strict Role-Based Access Control (RBAC) across six distinct personas:
1. **Admin** — Executive oversight, master configurations, users, and global compliance.
2. **Project Manager (PM)** — Project lifecycle, client SLAs, allocation timelines, and delivery milestones.
3. **Auditor / IT** — On-site physical and technical infrastructure audit, CCTV scans, and mock drive certification.
4. **Operations Executive** — Centre booking, document verification, inventory dispatch, and exam day monitoring.
5. **Accounts / Finance** — Cost sheets, client invoicing, centre payments, and reconciliation.
6. **Centre User** — Partner institution profile, facility declarations, consent verification, and billing history.

---

## 2. Layered Target Architecture

```
frontend/src/
├── app/                  # Application Bootstrap & Composition Layer
│   ├── App.jsx           # Root application container
│   ├── router.jsx        # Centralized route tree with RBAC guards
│   └── providers.jsx     # Global provider tree (Auth, Router, UI state)
│
├── layouts/              # Presentation Shells & Structural Layouts
│   ├── AuthLayout.jsx    # Authentication shell (isolated, distraction-free)
│   └── DashboardLayout.jsx # Enterprise dashboard shell (Header, Sidebar, Main canvas)
│
├── features/             # Business Domain Feature Modules
│   ├── auth/             # Login, session lifecycle, role redirection
│   ├── dashboard/        # Cross-cutting dashboard metric cards & widgets
│   ├── projects/         # Project lifecycle & milestone tracking
│   ├── centres/          # Centre master, KYC documentation, capacity declarations
│   ├── users/            # User administration, role assignment & scoping
│   ├── eligibility/      # Centre eligibility verification & blacklisting engine
│   ├── bookings/         # Date locking, shift management, booking funnel
│   ├── consent/          # Digital consent requests & centre confirmations
│   ├── documents/        # MoU, SLA, verification workflows & document audit
│   ├── audits/           # Audit assignments, physical checklists, findings evidence
│   ├── technical-scans/  # Bandwidth, LAN, IP range, and mock run telemetry
│   ├── allocations/      # Candidate seating allocation & centre calling tracker
│   ├── readiness/        # Exam-day checklist, invigilator deployment, dry-runs
│   ├── incidents/        # Real-time incident reporting, escalations & ticketing
│   ├── inventory/        # Biometric devices, jammers, and secure seal tracking
│   ├── finance/          # Cost sheets, invoicing, payments, reconciliation
│   ├── reports/          # Role-filtered MIS, operational KPIs, export services
│   └── notifications/    # Scoped real-time notification center & audit alerts
│
├── roles/                # Role-Specific Dashboard Composition & Navigation
│   ├── admin/            # Executive Overview & Admin dashboard
│   ├── project-manager/  # PM project health & delivery dashboard
│   ├── auditor/          # Auditor assignments & inspection board
│   ├── operations/       # Ops board, booking pipeline & readiness control
│   ├── finance/          # Revenue, payable pipeline & reconciliation overview
│   └── centre-user/      # Centre self-service terminal & declaration board
│
├── components/           # Reusable Presentation Components & Design System
│   ├── ui/               # Primitives: Button, Badge, Modal, StatCard, Card, Tabs
│   ├── forms/            # Form controls: Input, Select, Search, Toggle, Checkbox
│   ├── tables/           # Data tables, pagination, sorting & filter controls
│   ├── charts/           # Accessible chart wrappers (Recharts integration)
│   ├── feedback/         # Loading skeletons, empty states, error boundaries
│   └── common/           # Shared modal utilities & calendar components
│
├── services/             # Centralized Communication & Data Access Layer
│   ├── apiClient.js      # Axios/Fetch wrapper with JWT interceptor & error handling
│   ├── endpoints.js      # REST API route directory
│   ├── dataService.js    # Domain service state & in-memory/API repository
│   └── notificationService.js # Notification bus & event emitter
│
├── context/              # React Context Providers (State Store)
│   └── AuthContext.jsx   # Authentication context & authorization checks
│
├── hooks/                # Custom React Hooks
│   ├── useAuth.js        # Authentication & user profile hook
│   └── useNotification.js # Real-time notification feed hook
│
├── config/               # Application Configuration & Environment Settings
│   └── appConfig.js      # Runtime environment validation & feature flags
│
├── constants/            # Immutable Constants
│   ├── roles.js          # Role keys, labels, badges, and default landing routes
│   ├── routes.js         # Unified URI definitions
│   └── permissions.js    # Granular permission flags
│
├── utils/                # Pure Utility Functions
│   ├── formatters.js     # Currency (INR), date (IST), file size, percentage
│   ├── validators.js     # Email, phone, pincode, alphanumeric validators
│   └── storage.js        # Safe session and local storage wrappers
│
└── styles/               # Modular CSS Design Tokens & Styles
    ├── tokens.css        # CSS custom properties (colors, shadows, spacing, glass)
    ├── typography.css    # Inter font scales, heading styles, line heights
    └── globals.css       # Layout reset, utilities, and component styling
```

---

## 3. Security, Authentication & Session Isolation
1. **Frontend Authentication Pipeline**:
   - `AuthContext` checks session tokens stored in secure `sessionStorage` (`oem_user`).
   - Demo credentials reside in environment variables (`VITE_ADMIN_EMAIL`, etc.) or secure defaults.
   - Upon successful credentials verification, passwords are stripped from state memory (`safeUser`).
2. **Route Authorization & Guards**:
   - Every protected route is wrapped by `ProtectedRoute` verifying `allowedRoles`.
   - Access attempts to unauthorized paths redirect immediately to `/unauthorized`.
3. **Data Scope Enforcement**:
   - Users are scoped by `clients`, `projects`, and `centres`.
   - Role-specific navigation filters menu entries dynamically based on `user.role`.
   - Future backend JWT integration plugs directly into `apiClient.js` request interceptor.

---

## 4. Production API Migration Path
- The project currently leverages a comprehensive local reactive store (`dataService.js`) with complete entity schemas for:
  - `ProjectStore`, `CentreStore`, `UserStore`, `BookingStore`, `AuditStore`, `AllocationStore`, `InvoiceStore`, `PaymentStore`.
- All operations expose standardized async-ready contracts (`getAll()`, `getById()`, `update()`, `create()`).
- The transition to a remote REST/GraphQL backend requires swapping the internal state engine inside `dataService.js` to dispatch through `apiClient.js` without modifying frontend components.
