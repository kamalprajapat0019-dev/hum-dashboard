/**
 * Data Constants & Empty Schemas
 * ALL mock business data removed per Data Integrity mandate.
 * Runtime application modules query real MySQL database endpoints.
 */

// ── Projects ─────────────────────────────────────────────────────────────────
export const PROJECTS = [];

// ── Centres ───────────────────────────────────────────────────────────────────
export const CENTRES = [];

// ── KPI Summary Defaults (Zero Fallbacks) ──────────────────────────────────────
export const ADMIN_KPIS = {
  totalProjects:   { value: 0, active: 0, label: 'Total Projects',   icon: 'Briefcase' },
  totalCentres:    { value: 0, active: 0, label: 'Total Centres',    icon: 'Building2' },
  totalUsers:      { value: 0, active: 0, label: 'Active Users',     icon: 'Users' },
  openExceptions:  { value: 0, critical: 0, label: 'Open Exceptions', icon: 'AlertTriangle' },
  pendingApprovals:{ value: 0, label: 'Pending Approvals', icon: 'CheckCircle' },
  auditsFailed:    { value: 0, label: 'Failed Audits',      icon: 'XCircle' },
};

export const PM_KPIS = {
  myProjects:      { value: 0, label: 'Assigned Projects',  icon: 'FolderOpen' },
  centreBooked:    { value: 0, target: 0, label: 'Centres Booked', icon: 'Building2' },
  overdueActions:  { value: 0, label: 'Overdue Actions', icon: 'Clock' },
  allocationLocked:{ value: 0, total: 0, label: 'Allocations Locked', icon: 'Lock' },
};

export const AUDITOR_KPIS = {
  assignedAudits:  { value: 0, pending: 0, label: 'Assigned Audits', icon: 'ClipboardCheck' },
  critical:        { value: 0, label: 'Critical Findings',  icon: 'AlertOctagon' },
  mockFailed:      { value: 0, label: 'Failed Mocks',       icon: 'XCircle' },
  reAuditPending:  { value: 0, label: 'Re-audit Pending',   icon: 'RefreshCw' },
};

export const OPS_KPIS = {
  bookingPipeline: { value: 0, target: 0, label: 'Total Bookings', icon: 'CalendarCheck' },
  consentPending:  { value: 0, label: 'Consent Pending',  icon: 'MessageSquare' },
  docsIncomplete:  { value: 0, label: 'Docs Incomplete',  icon: 'FileWarning' },
  incidentsOpen:   { value: 0, label: 'Open Incidents',   icon: 'AlertCircle' },
};

export const FINANCE_KPIS = {
  invoicesPending: { value: 0, label: 'Invoices Pending',   icon: 'FileText' },
  invoicesPaid:    { value: 0, label: 'Invoices Paid',     icon: 'CheckCircle' },
  outstandingAmt:  { value: '₹0', label: 'Outstanding',  icon: 'IndianRupee' },
  paidAmt:         { value: '₹0', label: 'Total Paid',   icon: 'TrendingUp' },
};

export const CENTRE_KPIS = {
  pendingActions:  { value: 0, label: 'Pending Actions',  icon: 'Bell' },
  docsUploaded:    { value: 0, total: 0, label: 'Docs Uploaded', icon: 'Upload' },
  consentStatus:   { value: 'Pending', label: 'Consent Status', icon: 'CheckCircle' },
  readiness:       { value: 'Pending', label: 'Readiness',     icon: 'CheckSquare' },
};

// ── Chart Schemas ─────────────────────────────────────────────────────────────
export const PROJECT_STATUS_DATA = [];
export const CENTRE_STATUS_DATA = [];
export const EXCEPTION_DATA = [];
export const AUDIT_FINDINGS_DATA = [];
export const MOCK_STATUS_DATA = [];
export const BOOKING_FUNNEL_DATA = [];
export const CONSENT_STATUS_DATA = [];
export const INVOICE_STATUS_DATA = [];
export const INVOICE_AMOUNT_DATA = [];

// ── Feeds & Actions ───────────────────────────────────────────────────────────
export const NOTIFICATIONS = [];
export const RECENT_ACTIVITY = [];
export const CENTRE_PENDING_ACTIONS = [];
