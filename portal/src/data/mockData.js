/**
 * Mock Data Store — Phase 1
 * All dashboard metrics are here. Phase 3 will replace with real API calls.
 * Data reflects real business entities from FRD/SRS documents.
 */

// ── Projects ─────────────────────────────────────────────────────────────────
export const PROJECTS = [
  { id: 'p001', name: 'NEET UG 2026 – Season 1', clientId: 'c001', client: 'NTA', stage: 'Execution', status: 'Active', examDate: '2026-11-15', cities: 24, centreTarget: 180, centreBooked: 162, centreReady: 141, candidateTarget: 54000, pmId: 'u002', createdAt: '2026-09-01', slaHealth: 'OnTrack' },
  { id: 'p002', name: 'JEE Mains 2027 – January', clientId: 'c001', client: 'NTA', stage: 'Audit & Compliance', status: 'Active', examDate: '2027-01-22', cities: 18, centreTarget: 120, centreBooked: 98, centreReady: 72, candidateTarget: 36000, pmId: 'u002', createdAt: '2026-09-15', slaHealth: 'AtRisk' },
  { id: 'p003', name: 'CUET PG 2026', clientId: 'c002', client: 'UGC', stage: 'Document Verification', status: 'Active', examDate: '2026-12-10', cities: 12, centreTarget: 80, centreBooked: 54, centreReady: 31, candidateTarget: 22000, pmId: 'u002', createdAt: '2026-10-01', slaHealth: 'Delayed' },
  { id: 'p004', name: 'AIAPGET 2026', clientId: 'c003', client: 'AICTE', stage: 'Booking', status: 'Active', examDate: '2026-12-28', cities: 8, centreTarget: 45, centreBooked: 28, centreReady: 10, candidateTarget: 9000, pmId: 'u002', createdAt: '2026-10-10', slaHealth: 'OnTrack' },
  { id: 'p005', name: 'NEET PG 2025', clientId: 'c001', client: 'NTA', stage: 'Closed', status: 'Closed', examDate: '2025-06-11', cities: 30, centreTarget: 220, centreBooked: 220, centreReady: 220, candidateTarget: 72000, pmId: 'u002', createdAt: '2025-03-01', slaHealth: 'Completed' },
];

// ── Centres ───────────────────────────────────────────────────────────────────
export const CENTRES = [
  { id: 'cn001', name: 'Lotus Computer Education', city: 'Delhi', state: 'Delhi', status: 'Approved', orgType: 'Trust', systems: 45, projectId: 'p001', eligibility: 'Eligible', auditStatus: 'Passed', docsComplete: true, consentStatus: 'Accepted' },
  { id: 'cn002', name: 'Sunrise IT Academy', city: 'Mumbai', state: 'Maharashtra', status: 'Approved', orgType: 'Company', systems: 60, projectId: 'p001', eligibility: 'Eligible', auditStatus: 'Passed', docsComplete: true, consentStatus: 'Accepted' },
  { id: 'cn003', name: 'Tech Valley Institute', city: 'Bangalore', state: 'Karnataka', status: 'Active', orgType: 'Society', systems: 35, projectId: 'p001', eligibility: 'Eligible', auditStatus: 'Re-audit Required', docsComplete: false, consentStatus: 'Accepted' },
  { id: 'cn004', name: 'Saraswati Computers', city: 'Hyderabad', state: 'Telangana', status: 'Active', orgType: 'Individual', systems: 28, projectId: 'p002', eligibility: 'Under Review', auditStatus: 'Pending', docsComplete: false, consentStatus: 'Pending' },
  { id: 'cn005', name: 'Global Test Centre', city: 'Chennai', state: 'Tamil Nadu', status: 'Rejected', orgType: 'Company', systems: 50, projectId: 'p001', eligibility: 'Blacklisted', auditStatus: 'N/A', docsComplete: false, consentStatus: 'Rejected' },
  { id: 'cn006', name: 'Pioneer Academy', city: 'Kolkata', state: 'West Bengal', status: 'Active', orgType: 'Trust', systems: 40, projectId: 'p002', eligibility: 'Eligible', auditStatus: 'Passed', docsComplete: true, consentStatus: 'Accepted' },
];

// ── KPI Summary ───────────────────────────────────────────────────────────────
export const ADMIN_KPIS = {
  totalProjects:   { value: 5,    active: 4,   label: 'Total Projects',   icon: 'Briefcase' },
  totalCentres:    { value: 346,  active: 281, label: 'Total Centres',    icon: 'Building2' },
  totalUsers:      { value: 38,   active: 34,  label: 'Active Users',     icon: 'Users' },
  openExceptions:  { value: 17,   critical: 4, label: 'Open Exceptions',  icon: 'AlertTriangle' },
  pendingApprovals:{ value: 23,   label: 'Pending Approvals', icon: 'CheckCircle' },
  auditsFailed:    { value: 8,    label: 'Failed Audits',      icon: 'XCircle' },
};

export const PM_KPIS = {
  myProjects:      { value: 4, label: 'Assigned Projects',  icon: 'FolderOpen' },
  centreBooked:    { value: 342, target: 425, label: 'Centres Booked', icon: 'Building2' },
  overdueActions:  { value: 6, label: 'Overdue Actions', icon: 'Clock' },
  allocationLocked:{ value: 1, total: 4, label: 'Allocations Locked', icon: 'Lock' },
};

export const AUDITOR_KPIS = {
  assignedAudits:  { value: 24, pending: 9, label: 'Assigned Audits', icon: 'ClipboardCheck' },
  critical:        { value: 4,  label: 'Critical Findings',  icon: 'AlertOctagon' },
  mockFailed:      { value: 3,  label: 'Failed Mocks',       icon: 'XCircle' },
  reAuditPending:  { value: 5,  label: 'Re-audit Pending',   icon: 'RefreshCw' },
};

export const OPS_KPIS = {
  bookingPipeline: { value: 162, target: 425, label: 'Total Bookings', icon: 'CalendarCheck' },
  consentPending:  { value: 38,  label: 'Consent Pending',  icon: 'MessageSquare' },
  docsIncomplete:  { value: 47,  label: 'Docs Incomplete',  icon: 'FileWarning' },
  incidentsOpen:   { value: 5,   label: 'Open Incidents',   icon: 'AlertCircle' },
};

export const FINANCE_KPIS = {
  invoicesPending: { value: 28, label: 'Invoices Pending',   icon: 'FileText' },
  invoicesPaid:    { value: 142, label: 'Invoices Paid',     icon: 'CheckCircle' },
  outstandingAmt:  { value: '₹14.8L', label: 'Outstanding',  icon: 'IndianRupee' },
  paidAmt:         { value: '₹62.4L', label: 'Total Paid',   icon: 'TrendingUp' },
};

export const CENTRE_KPIS = {
  pendingActions:  { value: 3,  label: 'Pending Actions',  icon: 'Bell' },
  docsUploaded:    { value: 11, total: 14, label: 'Docs Uploaded', icon: 'Upload' },
  consentStatus:   { value: 'Accepted', label: 'Consent Status',   icon: 'CheckCircle' },
  readiness:       { value: 'Confirmed', label: 'Readiness',       icon: 'CheckSquare' },
};

// ── Chart Data ────────────────────────────────────────────────────────────────
export const PROJECT_STATUS_DATA = [
  { name: 'Execution',            value: 1, color: '#1e40af' },
  { name: 'Audit & Compliance',   value: 1, color: '#0ea5e9' },
  { name: 'Document Verification',value: 1, color: '#d97706' },
  { name: 'Booking',              value: 1, color: '#16a34a' },
  { name: 'Closed',               value: 1, color: '#94a3b8' },
];

export const CENTRE_STATUS_DATA = [
  { name: 'Approved',  value: 178, color: '#16a34a' },
  { name: 'Active',    value: 103, color: '#0ea5e9' },
  { name: 'Draft',     value: 42,  color: '#94a3b8' },
  { name: 'Rejected',  value: 18,  color: '#dc2626' },
  { name: 'Inactive',  value: 5,   color: '#d97706' },
];

export const EXCEPTION_DATA = [
  { name: 'Critical', value: 4,  color: '#dc2626' },
  { name: 'High',     value: 8,  color: '#d97706' },
  { name: 'Medium',   value: 13, color: '#0ea5e9' },
  { name: 'Low',      value: 22, color: '#16a34a' },
];

export const AUDIT_FINDINGS_DATA = [
  { name: 'Critical', value: 4,  color: '#dc2626' },
  { name: 'High',     value: 11, color: '#f97316' },
  { name: 'Medium',   value: 19, color: '#eab308' },
  { name: 'Low',      value: 28, color: '#22c55e' },
];

export const MOCK_STATUS_DATA = [
  { name: 'Passed',        value: 87, color: '#16a34a' },
  { name: 'Failed',        value: 6,  color: '#dc2626' },
  { name: 'Not Conducted', value: 11, color: '#94a3b8' },
];

export const BOOKING_FUNNEL_DATA = [
  { stage: 'Invited',       count: 425 },
  { stage: 'Consented',     count: 312 },
  { stage: 'Docs Complete', count: 241 },
  { stage: 'Audit Passed',  count: 198 },
  { stage: 'Booked',        count: 162 },
];

export const CONSENT_STATUS_DATA = [
  { name: 'Accepted', value: 241, color: '#16a34a' },
  { name: 'Pending',  value: 68,  color: '#d97706' },
  { name: 'Discussed',value: 18,  color: '#0ea5e9' },
  { name: 'Rejected', value: 3,   color: '#dc2626' },
];

export const INVOICE_STATUS_DATA = [
  { name: 'Paid',     value: 142, color: '#16a34a' },
  { name: 'Approved', value: 34,  color: '#0ea5e9' },
  { name: 'Pending',  value: 28,  color: '#d97706' },
  { name: 'Rejected', value: 7,   color: '#dc2626' },
];

export const INVOICE_AMOUNT_DATA = [
  { name: 'Jan', paid: 8.2,  pending: 2.1 },
  { name: 'Feb', paid: 11.4, pending: 1.8 },
  { name: 'Mar', paid: 9.7,  pending: 3.2 },
  { name: 'Apr', paid: 13.1, pending: 2.4 },
  { name: 'May', paid: 10.8, pending: 1.5 },
  { name: 'Jun', paid: 9.2,  pending: 4.8 },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id: 'n001', type: 'critical', module: 'Audit',    project: 'NEET UG 2026', title: 'Critical finding at Lotus Computer Education', desc: 'Duplicate MAC address detected — 3 systems flagged.', time: '5 mins ago', read: false, deepLink: '/auditor/audits' },
  { id: 'n002', type: 'high',     module: 'Allocation',project: 'JEE Mains 2027', title: 'Locked allocation change requested', desc: 'Delhi region – 12 seat reduction requested by Sneha Patel.', time: '22 mins ago', read: false, deepLink: '/pm/allocation' },
  { id: 'n003', type: 'normal',   module: 'Booking',   project: 'CUET PG 2026', title: 'Centre booking confirmed', desc: 'Pioneer Academy, Kolkata accepted booking for CUET PG 2026.', time: '1 hr ago', read: false, deepLink: '/ops/booking' },
  { id: 'n004', type: 'normal',   module: 'Document',  project: 'NEET UG 2026', title: 'Documents sent for rework', desc: 'Tech Valley Institute – MOU missing stamp. Due: 25 Oct 2026.', time: '2 hrs ago', read: true,  deepLink: '/ops/documents' },
  { id: 'n005', type: 'high',     module: 'Mock',      project: 'JEE Mains 2027', title: 'Mock test failed at Sunrise IT Academy', desc: 'Mock failed – power backup issue. Escalated to PM.', time: '3 hrs ago', read: true,  deepLink: '/auditor/mock' },
];

// ── Recent Activity / Audit Trail ────────────────────────────────────────────
export const RECENT_ACTIVITY = [
  { id: 'a001', actor: 'Priya Sharma', action: 'Approved allocation', module: 'Allocation', project: 'NEET UG 2026', ts: '2026-10-22T13:42:00Z' },
  { id: 'a002', actor: 'Amit Verma',   action: 'Recorded critical finding', module: 'Audit', project: 'NEET UG 2026', ts: '2026-10-22T13:30:00Z' },
  { id: 'a003', actor: 'Sneha Patel',  action: 'Uploaded documents', module: 'Documents', project: 'CUET PG 2026', ts: '2026-10-22T12:55:00Z' },
  { id: 'a004', actor: 'Deepak Gupta', action: 'Invoice approved', module: 'Finance', project: 'NEET UG 2026', ts: '2026-10-22T11:20:00Z' },
  { id: 'a005', actor: 'Centre ABC',   action: 'Readiness confirmed', module: 'Readiness', project: 'NEET UG 2026', ts: '2026-10-22T10:45:00Z' },
];

// ── Pending Actions (Centre User) ────────────────────────────────────────────
export const CENTRE_PENDING_ACTIONS = [
  { id: 'pa001', title: 'Upload TCA Police Verification', priority: 'High',   dueDate: '2026-10-25', module: 'Documents', status: 'Pending' },
  { id: 'pa002', title: 'Confirm Readiness for Shift 2',  priority: 'Medium', dueDate: '2026-10-30', module: 'Readiness', status: 'Pending' },
  { id: 'pa003', title: 'Submit Invoice for NEET UG 2026',priority: 'Low',    dueDate: '2026-11-05', module: 'Invoice',   status: 'Pending' },
];
