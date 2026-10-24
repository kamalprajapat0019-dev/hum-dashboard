# 🔐 OEM Portal — Role & Permissions Matrix

This document defines the Role-Based Access Control (RBAC) model across all six user roles in the Operations & Examination Management Portal.

| Module / Feature | Admin | Project Manager (PM) | Auditor / IT | Operations Executive | Accounts / Finance | Centre User |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Dashboard** | Full Overview | PM Pipeline | Audit Queue | Ops Board | Financial Ledger | Centre Self-View |
| **User Administration** | Full CRUD | View Project Team | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access |
| **Client & Project Setup** | Full CRUD | Create / Update | Read-only | Read-only | Read-only | ❌ No Access |
| **Centre Master** | Full CRUD | View Scope | View Assigned | Edit / Onboard | View Approved | View Own Centre |
| **Eligibility & Blacklist** | Override / Manage | View Scope | Read-only | Run Eligibility | ❌ No Access | ❌ No Access |
| **Booking & Date Locking** | Manage All | View / Approve | ❌ No Access | Create / Lock | Read-only | Confirm Shifts |
| **Consent Management** | Approve / Override | Monitor Scope | ❌ No Access | Dispatch / Track | ❌ No Access | Sign / Submit |
| **Document Review (MoU/SLA)** | Full CRUD | Review Scope | Read-only | Audit & Approve | Review Commercial | Upload Documents |
| **Audit Assignments** | Global Assign | Track Completion | Perform Audit | ❌ No Access | ❌ No Access | View Audit Date |
| **Technical & CCTV Scans** | View All | View Reports | Execute Scans | View Summary | ❌ No Access | View Checklist |
| **Mock Status & Certification**| Review All | Monitor Readiness | Certify Mock | Track Status | ❌ No Access | Execute Mock |
| **Candidate Allocation** | Full Control | Approve Rollout | ❌ No Access | Allocate & Call | ❌ No Access | Download Slips |
| **Readiness & Exam Day** | Global View | Milestone Monitor | Sign-off Tech | Operational Checklist | ❌ No Access | Declare Readiness |
| **Incident Management** | Global Resolution| Escalate / Resolve| Log Technical | Log Operational | ❌ No Access | Log Support Ticket |
| **Inventory & Devices** | Global Master | Track Logistics | ❌ No Access | Dispatch / Return | ❌ No Access | Acknowledge Receipt |
| **Cost Sheets & Commercial** | Full Approval | Propose / Review | ❌ No Access | ❌ No Access | Manage Costing | View Quotation |
| **Invoice Management** | Approve / Export | View Scope | ❌ No Access | ❌ No Access | Full Invoicing | View / Download |
| **Payment Reconciliation** | Approve Release | ❌ No Access | ❌ No Access | ❌ No Access | Process Payments | View Payout History |
| **MIS Reports & Analytics** | Global Reports | Project MIS | Audit MIS | Operations MIS | Financial MIS | ❌ No Access |
| **Notification Center** | Global Alerts | Project Alerts | Audit Alerts | Ops Alerts | Finance Alerts | Centre Alerts |
| **System Configuration** | Full Access | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access |

---

## Permission Scopes & Data Isolation Rules
1. **Tenant / Client Scoping**: PMs and Operations Executives have visibility restricted to assigned `client_id` and `project_id` values.
2. **Centre User Scoping**: A Centre User can NEVER view another centre's candidate count, commercial agreement, or audit logs. Their queries must always be pinned to their authorized `centre_id`.
3. **Auditor Scoping**: Auditors are restricted to assigned audit batches. Findings cannot be edited once signed off unless an Admin unlocks a formal re-audit workflow.
