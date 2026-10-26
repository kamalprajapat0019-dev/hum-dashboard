/**
 * Centralized REST API Endpoints
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
  },
  PROJECTS: {
    LIST: '/projects',
    DETAIL: (id) => `/projects/${id}`,
    STAGES: (id) => `/projects/${id}/stages`,
  },
  CENTRES: {
    LIST: '/centres',
    DETAIL: (id) => `/centres/${id}`,
    DOCUMENTS: (id) => `/centres/${id}/documents`,
    AUDITS: (id) => `/centres/${id}/audits`,
  },
  BOOKINGS: {
    LIST: '/bookings',
    DETAIL: (id) => `/bookings/${id}`,
    LOCK: (id) => `/bookings/${id}/lock`,
  },
  AUDITS: {
    ASSIGNMENTS: '/audits/assignments',
    SCANS: '/audits/technical-scans',
    MOCKS: '/audits/mock-status',
    FINDINGS: '/audits/findings',
  },
  ALLOCATIONS: {
    LIST: '/allocations',
    CENTRE: (id) => `/allocations/centre/${id}`,
  },
  FINANCE: {
    COST_SHEETS: '/finance/cost-sheets',
    INVOICES: '/finance/invoices',
    PAYMENTS: '/finance/payments',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
  },
  REPORTS: {
    MIS: '/reports/mis',
    EXPORT: (type) => `/reports/export/${type}`,
  },
  ADMIN: {
    ANALYTICS: '/admin/analytics',
    USERS: '/admin/users',
    USER_DETAIL: (id) => `/admin/users/${id}`,
    PROJECTS: '/admin/projects',
    PROJECT_DETAIL: (id) => `/admin/projects/${id}`,
    CENTRES: '/admin/centres',
    CENTRE_DETAIL: (id) => `/admin/centres/${id}`,
    CENTRE_STATUS: (id) => `/admin/centres/${id}/status`,
    BLACKLIST: '/admin/eligibility/blacklist',
    OVERRIDE_ELIGIBILITY: '/admin/eligibility/override',
    AUDIT_LOGS: '/admin/audit-logs',
    CONFIG: '/admin/config',
    CONFIG_DETAIL: (key) => `/admin/config/${key}`,
  },
};

export default ENDPOINTS;
