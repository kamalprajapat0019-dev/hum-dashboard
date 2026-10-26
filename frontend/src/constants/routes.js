/**
 * Centralized Route Definitions
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',

  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    PROJECTS: '/admin/projects',
    CENTRES: '/admin/centres',
    ELIGIBILITY: '/admin/eligibility',
    BOOKING: '/admin/booking',
    DOCUMENTS: '/admin/documents',
    AUDIT: '/admin/audit',
    ALLOCATION: '/admin/allocation',
    COMMERCIAL: '/admin/commercial',
    READINESS: '/admin/readiness',
    INCIDENTS: '/admin/incidents',
    NOTIFICATIONS: '/admin/notifications',
    REPORTS: '/admin/reports',
    CONFIG: '/admin/config',
  },

  PM: {
    DASHBOARD: '/pm',
    SETUP: '/pm/setup',
    PIPELINE: '/pm/pipeline',
    ELIGIBILITY: '/pm/eligibility',
    CONSENT: '/pm/consent',
    AUDIT: '/pm/audit',
    ALLOCATION: '/pm/allocation',
    COMMERCIAL: '/pm/commercial',
    READINESS: '/pm/readiness',
    INCIDENTS: '/pm/incidents',
    NOTIFICATIONS: '/pm/notifications',
    INVOICE: '/pm/invoice',
    REPORTS: '/pm/reports',
  },

  AUDITOR: {
    DASHBOARD: '/auditor',
    AUDITS: '/auditor/audits',
    SCAN: '/auditor/scan',
    MOCK: '/auditor/mock',
    FINDINGS: '/auditor/findings',
    NOTIFICATIONS: '/auditor/notifications',
  },

  OPS: {
    DASHBOARD: '/ops',
    BOOKING: '/ops/booking',
    CONSENT: '/ops/consent',
    DOCUMENTS: '/ops/documents',
    ALLOCATION: '/ops/allocation',
    READINESS: '/ops/readiness',
    INCIDENTS: '/ops/incidents',
    INVENTORY: '/ops/inventory',
    NOTIFICATIONS: '/ops/notifications',
  },

  FINANCE: {
    DASHBOARD: '/finance',
    COST: '/finance/cost',
    AGREEMENTS: '/finance/agreements',
    INVOICES: '/finance/invoices',
    PAYMENTS: '/finance/payments',
    RECONCILE: '/finance/reconcile',
  },

  CENTRE: {
    DASHBOARD: '/centre',
    PROFILE: '/centre/profile',
    BOOKING: '/centre/booking',
    CONSENT: '/centre/consent',
    DOCUMENTS: '/centre/documents',
    INFRA: '/centre/infra',
    QUOTATION: '/centre/quotation',
    MOU: '/centre/mou',
    ALLOCATION: '/centre/allocation',
    READINESS: '/centre/readiness',
    EXAMDAY: '/centre/examday',
    SUPPORT: '/centre/support',
    INVOICE: '/centre/invoice',
    HISTORY: '/centre/history',
  },
};
