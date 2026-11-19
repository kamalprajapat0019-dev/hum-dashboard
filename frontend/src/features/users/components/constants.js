export const SUPPORTED_ROLES = [
  { value: 'project_manager', label: 'Project Manager', raw: 'PM', desc: 'Manages projects, operations, and assigned centres' },
  { value: 'accounts_finance', label: 'Accounts Team User', raw: 'FINANCE', desc: 'Financial invoices, cost sheets, and reconciliation' },
  { value: 'operations_executive', label: 'Operations User', raw: 'OPERATIONS', desc: 'Venue operations, scheduling, and centre invitations' },
  { value: 'auditor_it', label: 'Auditor User', raw: 'AUDITOR', desc: 'Centre technical scans, mock examinations, and compliance' },
  { value: 'centre_user', label: 'Centre User', raw: 'CENTRE', desc: 'External exam venue head, registration, and seating dossier' },
  { value: 'admin', label: 'System Administrator', raw: 'ADMIN', desc: 'Full OEMP platform configuration and governance' },
];
