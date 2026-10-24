/**
 * Role Definitions & Persona Configuration
 */
export const ROLES = {
  ADMIN:      'admin',
  PM:         'project_manager',
  AUDITOR:    'auditor_it',
  OPERATIONS: 'operations_executive',
  FINANCE:    'accounts_finance',
  CENTRE:     'centre_user',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]:      'Admin',
  [ROLES.PM]:         'Project Manager',
  [ROLES.AUDITOR]:    'Auditor / IT',
  [ROLES.OPERATIONS]: 'Operations Executive',
  [ROLES.FINANCE]:    'Accounts / Finance',
  [ROLES.CENTRE]:     'Centre User',
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]:      '#1e40af',
  [ROLES.PM]:         '#7c3aed',
  [ROLES.AUDITOR]:    '#0891b2',
  [ROLES.OPERATIONS]: '#16a34a',
  [ROLES.FINANCE]:    '#d97706',
  [ROLES.CENTRE]:     '#dc2626',
};

export const DEFAULT_ROLE_ROUTES = {
  [ROLES.ADMIN]:      '/admin',
  [ROLES.PM]:         '/pm',
  [ROLES.AUDITOR]:    '/auditor',
  [ROLES.OPERATIONS]: '/ops',
  [ROLES.FINANCE]:    '/finance',
  [ROLES.CENTRE]:     '/centre',
};
