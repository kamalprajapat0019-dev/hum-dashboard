import { ROLES } from '../constants/roles';
import { storage } from '../utils/storage';
import { appConfig } from '../config/appConfig';

// Demo users (configured via .env with fallback defaults)
export const DEMO_USERS = [
  {
    id: 'u001',
    name: import.meta.env.VITE_ADMIN_NAME || 'Rajesh Kumar',
    email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@oemportal.in',
    password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123',
    role: ROLES.ADMIN,
    avatar: 'RK',
    scope: { clients: ['all'], projects: ['all'], centres: ['all'] },
    lastLogin: '2026-10-22T08:30:00Z',
  },
  {
    id: 'u002',
    name: import.meta.env.VITE_PM_NAME || 'Priya Sharma',
    email: import.meta.env.VITE_PM_EMAIL || 'pm@oemportal.in',
    password: import.meta.env.VITE_PM_PASSWORD || 'pm123',
    role: ROLES.PM,
    avatar: 'PS',
    scope: { clients: ['c001', 'c002'], projects: ['p001', 'p002', 'p003'], centres: ['all'] },
    lastLogin: '2026-10-22T09:15:00Z',
  },
  {
    id: 'u003',
    name: import.meta.env.VITE_AUDITOR_NAME || 'Amit Verma',
    email: import.meta.env.VITE_AUDITOR_EMAIL || 'auditor@oemportal.in',
    password: import.meta.env.VITE_AUDITOR_PASSWORD || 'audit123',
    role: ROLES.AUDITOR,
    avatar: 'AV',
    scope: { clients: ['c001'], projects: ['p001', 'p002'], centres: ['cn001', 'cn002', 'cn003'] },
    lastLogin: '2026-10-21T16:45:00Z',
  },
  {
    id: 'u004',
    name: import.meta.env.VITE_OPERATIONS_NAME || 'Sneha Patel',
    email: import.meta.env.VITE_OPERATIONS_EMAIL || 'ops@oemportal.in',
    password: import.meta.env.VITE_OPERATIONS_PASSWORD || 'ops123',
    role: ROLES.OPERATIONS,
    avatar: 'SP',
    scope: { clients: ['c001', 'c002'], projects: ['p001', 'p002', 'p003'], centres: ['all'] },
    lastLogin: '2026-10-22T10:00:00Z',
  },
  {
    id: 'u005',
    name: import.meta.env.VITE_FINANCE_NAME || 'Deepak Gupta',
    email: import.meta.env.VITE_FINANCE_EMAIL || 'finance@oemportal.in',
    password: import.meta.env.VITE_FINANCE_PASSWORD || 'finance123',
    role: ROLES.FINANCE,
    avatar: 'DG',
    scope: { clients: ['all'], projects: ['all'], centres: ['all'] },
    lastLogin: '2026-10-22T07:45:00Z',
  },
  {
    id: 'u006',
    name: import.meta.env.VITE_CENTRE_NAME || 'Centre ABC',
    email: import.meta.env.VITE_CENTRE_EMAIL || 'centre@oemportal.in',
    password: import.meta.env.VITE_CENTRE_PASSWORD || 'centre123',
    role: ROLES.CENTRE,
    avatar: 'CA',
    scope: { clients: ['c001'], projects: ['p001'], centres: ['cn001'] },
    lastLogin: '2026-10-20T11:30:00Z',
  },
];

export const authService = {
  login(email, password) {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === (email || '').trim().toLowerCase() && u.password === password
    );
    if (!found) {
      return { success: false, error: 'Invalid email or password' };
    }
    const { password: _, ...safeUser } = found;
    storage.set(appConfig.auth.userStorageKey, safeUser, 'session');
    // Generate simulated session token for client requests
    storage.set(appConfig.auth.tokenStorageKey, `mock_jwt_${safeUser.id}_${Date.now()}`, 'session');
    return { success: true, user: safeUser };
  },

  logout() {
    storage.remove(appConfig.auth.userStorageKey, 'session');
    storage.remove(appConfig.auth.tokenStorageKey, 'session');
  },

  getCurrentUser() {
    return storage.get(appConfig.auth.userStorageKey, 'session');
  },
};

export default authService;
