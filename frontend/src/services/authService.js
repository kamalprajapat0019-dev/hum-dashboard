import { ROLES } from '../constants/roles';
import { storage } from '../utils/storage';
import { appConfig } from '../config/appConfig';
import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';

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
  async login(email, password) {
    const cleanEmail = (email || '').trim();

    // 1. Attempt real backend authentication first via apiClient
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: cleanEmail,
        password,
      });

      if (response && response.success && response.data) {
        const { token, user } = response.data;
        // Normalize role to lowercase matching frontend ROLES enum
        const normalizedRole = (user.role || '').toLowerCase();
        const clientUser = { ...user, role: normalizedRole };

        storage.set(appConfig.auth.userStorageKey, clientUser, 'session');
        storage.set(appConfig.auth.tokenStorageKey, token, 'session');
        return { success: true, user: clientUser };
      }
    } catch (apiErr) {
      // If backend responded with 401 or validation error, return the actual error message
      if (apiErr.status === 401 || apiErr.status === 400 || apiErr.status === 403) {
        return {
          success: false,
          error: apiErr.data?.error?.message || apiErr.message || 'Invalid email or password',
        };
      }
      // If backend is unreachable (offline during development or not started), fallback to demo accounts
      console.warn('Backend unavailable, falling back to local demo accounts:', apiErr.message);
    }

    // 2. Demo fallback for local development or non-admin roles pending backend integration
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === cleanEmail.toLowerCase() && u.password === password
    );
    if (!found) {
      return { success: false, error: 'Invalid email or password' };
    }
    const { password: _, ...safeUser } = found;
    storage.set(appConfig.auth.userStorageKey, safeUser, 'session');
    storage.set(appConfig.auth.tokenStorageKey, `mock_jwt_${safeUser.id}_${Date.now()}`, 'session');
    return { success: true, user: safeUser };
  },

  async logout() {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT, {});
    } catch {
      // Ignore API errors on logout
    }
    storage.remove(appConfig.auth.userStorageKey, 'session');
    storage.remove(appConfig.auth.tokenStorageKey, 'session');
  },

  getCurrentUser() {
    return storage.get(appConfig.auth.userStorageKey, 'session');
  },
};

export default authService;

