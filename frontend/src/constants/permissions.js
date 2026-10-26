import { ROLES } from './roles';

/**
 * Granular Permission Definitions
 */
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',

  // Master Data
  PROJECTS_MANAGE: 'projects:manage',
  CENTRES_MANAGE: 'centres:manage',
  CENTRES_VIEW: 'centres:view',

  // Operations
  BOOKINGS_MANAGE: 'bookings:manage',
  CONSENT_MANAGE: 'consent:manage',
  DOCUMENTS_REVIEW: 'documents:review',
  ALLOCATIONS_MANAGE: 'allocations:manage',
  READINESS_MANAGE: 'readiness:manage',
  INCIDENTS_MANAGE: 'incidents:manage',
  INVENTORY_MANAGE: 'inventory:manage',

  // Compliance & Audits
  AUDITS_EXECUTE: 'audits:execute',
  SCANS_EXECUTE: 'scans:execute',
  MOCKS_CERTIFY: 'mocks:certify',

  // Commercial & Finance
  COST_SHEET_MANAGE: 'cost_sheet:manage',
  INVOICES_MANAGE: 'invoices:manage',
  PAYMENTS_MANAGE: 'payments:manage',

  // System
  REPORTS_VIEW: 'reports:view',
  CONFIG_MANAGE: 'config:manage',
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.PM]: [
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.CENTRES_VIEW,
    PERMISSIONS.BOOKINGS_MANAGE,
    PERMISSIONS.CONSENT_MANAGE,
    PERMISSIONS.DOCUMENTS_REVIEW,
    PERMISSIONS.ALLOCATIONS_MANAGE,
    PERMISSIONS.READINESS_MANAGE,
    PERMISSIONS.INCIDENTS_MANAGE,
    PERMISSIONS.COST_SHEET_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.AUDITOR]: [
    PERMISSIONS.CENTRES_VIEW,
    PERMISSIONS.AUDITS_EXECUTE,
    PERMISSIONS.SCANS_EXECUTE,
    PERMISSIONS.MOCKS_CERTIFY,
    PERMISSIONS.INCIDENTS_MANAGE,
  ],
  [ROLES.OPERATIONS]: [
    PERMISSIONS.CENTRES_MANAGE,
    PERMISSIONS.CENTRES_VIEW,
    PERMISSIONS.BOOKINGS_MANAGE,
    PERMISSIONS.CONSENT_MANAGE,
    PERMISSIONS.DOCUMENTS_REVIEW,
    PERMISSIONS.ALLOCATIONS_MANAGE,
    PERMISSIONS.READINESS_MANAGE,
    PERMISSIONS.INCIDENTS_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
  ],
  [ROLES.FINANCE]: [
    PERMISSIONS.CENTRES_VIEW,
    PERMISSIONS.DOCUMENTS_REVIEW,
    PERMISSIONS.COST_SHEET_MANAGE,
    PERMISSIONS.INVOICES_MANAGE,
    PERMISSIONS.PAYMENTS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.CENTRE]: [
    PERMISSIONS.CENTRES_VIEW,
    PERMISSIONS.CONSENT_MANAGE,
    PERMISSIONS.READINESS_MANAGE,
    PERMISSIONS.INCIDENTS_MANAGE,
  ],
};

export function hasPermission(userRole, permission) {
  if (!userRole) return false;
  if (userRole === ROLES.ADMIN) return true;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}
