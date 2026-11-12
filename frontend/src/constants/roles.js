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

/**
 * Normalizes any raw role string (from JWT, DB enum, or route params)
 * to the canonical frontend role key.
 */
export function normalizeRole(rawRole) {
  if (!rawRole || typeof rawRole !== 'string') return ROLES.ADMIN;
  const r = rawRole.trim().toLowerCase();
  if (r === 'admin') return ROLES.ADMIN;
  if (r === 'pm' || r === 'project_manager' || r === 'projectmanager') return ROLES.PM;
  if (r === 'auditor' || r === 'auditor_it' || r === 'audit') return ROLES.AUDITOR;
  if (r === 'operations' || r === 'ops' || r === 'operations_executive') return ROLES.OPERATIONS;
  if (r === 'finance' || r === 'accounts' || r === 'accounts_finance') return ROLES.FINANCE;
  if (r === 'centre' || r === 'center' || r === 'centre_user' || r === 'center_user') return ROLES.CENTRE;
  return r;
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]:      'Admin',
  [ROLES.PM]:         'Project Manager',
  [ROLES.AUDITOR]:    'Auditor / IT',
  [ROLES.OPERATIONS]: 'Operations Executive',
  [ROLES.FINANCE]:    'Accounts / Finance',
  [ROLES.CENTRE]:     'Centre User',

  // Raw & lowercase aliases
  admin:              'Admin',
  ADMIN:              'Admin',
  pm:                 'Project Manager',
  PM:                 'Project Manager',
  auditor:            'Auditor / IT',
  AUDITOR:            'Auditor / IT',
  ops:                'Operations Executive',
  operations:         'Operations Executive',
  OPERATIONS:         'Operations Executive',
  finance:            'Accounts / Finance',
  FINANCE:            'Accounts / Finance',
  centre:             'Centre User',
  CENTRE:             'Centre User',
  center:             'Centre User',
  CENTER:             'Centre User',
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]:      '#1e40af',
  [ROLES.PM]:         '#7c3aed',
  [ROLES.AUDITOR]:    '#0891b2',
  [ROLES.OPERATIONS]: '#16a34a',
  [ROLES.FINANCE]:    '#d97706',
  [ROLES.CENTRE]:     '#dc2626',

  // Raw & lowercase aliases
  admin:              '#1e40af',
  ADMIN:              '#1e40af',
  pm:                 '#7c3aed',
  PM:                 '#7c3aed',
  auditor:            '#0891b2',
  AUDITOR:            '#0891b2',
  ops:                '#16a34a',
  operations:         '#16a34a',
  OPERATIONS:         '#16a34a',
  finance:            '#d97706',
  FINANCE:            '#d97706',
  centre:             '#dc2626',
  CENTRE:             '#dc2626',
  center:             '#dc2626',
  CENTER:             '#dc2626',
};

export const DEFAULT_ROLE_ROUTES = {
  [ROLES.ADMIN]:      '/admin',
  [ROLES.PM]:         '/pm',
  [ROLES.AUDITOR]:    '/auditor',
  [ROLES.OPERATIONS]: '/ops',
  [ROLES.FINANCE]:    '/finance',
  [ROLES.CENTRE]:     '/centre',

  // Raw & lowercase aliases
  admin:              '/admin',
  ADMIN:              '/admin',
  pm:                 '/pm',
  PM:                 '/pm',
  auditor:            '/auditor',
  AUDITOR:            '/auditor',
  ops:                '/ops',
  operations:         '/ops',
  OPERATIONS:         '/ops',
  finance:            '/finance',
  FINANCE:            '/finance',
  centre:             '/centre',
  CENTRE:             '/centre',
  center:             '/centre',
  CENTER:             '/centre',
};
