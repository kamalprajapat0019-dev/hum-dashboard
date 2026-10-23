/**
 * Auth Context — Role-based access control
 * In Phase 1 this uses session state; Phase 3 will connect to JWT backend.
 */
import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Role definitions & scopes
export const ROLES = {
  ADMIN:     'admin',
  PM:        'project_manager',
  AUDITOR:   'auditor_it',
  OPERATIONS:'operations_executive',
  FINANCE:   'accounts_finance',
  CENTRE:    'centre_user',
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

// Demo users for Phase 1
export const DEMO_USERS = [
  {
    id: 'u001',
    name: 'Rajesh Kumar',
    email: 'admin@oemportal.in',
    password: 'admin123',
    role: ROLES.ADMIN,
    avatar: 'RK',
    scope: { clients: ['all'], projects: ['all'], centres: ['all'] },
    lastLogin: '2026-10-22T08:30:00Z',
  },
  {
    id: 'u002',
    name: 'Priya Sharma',
    email: 'pm@oemportal.in',
    password: 'pm123',
    role: ROLES.PM,
    avatar: 'PS',
    scope: { clients: ['c001', 'c002'], projects: ['p001', 'p002', 'p003'], centres: ['all'] },
    lastLogin: '2026-10-22T09:15:00Z',
  },
  {
    id: 'u003',
    name: 'Amit Verma',
    email: 'auditor@oemportal.in',
    password: 'audit123',
    role: ROLES.AUDITOR,
    avatar: 'AV',
    scope: { clients: ['c001'], projects: ['p001', 'p002'], centres: ['cn001', 'cn002', 'cn003'] },
    lastLogin: '2026-10-21T16:45:00Z',
  },
  {
    id: 'u004',
    name: 'Sneha Patel',
    email: 'ops@oemportal.in',
    password: 'ops123',
    role: ROLES.OPERATIONS,
    avatar: 'SP',
    scope: { clients: ['c001', 'c002'], projects: ['p001', 'p002', 'p003'], centres: ['all'] },
    lastLogin: '2026-10-22T10:00:00Z',
  },
  {
    id: 'u005',
    name: 'Deepak Gupta',
    email: 'finance@oemportal.in',
    password: 'finance123',
    role: ROLES.FINANCE,
    avatar: 'DG',
    scope: { clients: ['all'], projects: ['all'], centres: ['all'] },
    lastLogin: '2026-10-22T07:45:00Z',
  },
  {
    id: 'u006',
    name: 'Centre ABC',
    email: 'centre@oemportal.in',
    password: 'centre123',
    role: ROLES.CENTRE,
    avatar: 'CA',
    scope: { clients: ['c001'], projects: ['p001'], centres: ['cn001'] },
    lastLogin: '2026-10-20T11:30:00Z',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('oem_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = useCallback((email, password) => {
    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { success: false, error: 'Invalid email or password' };
    const { password: _, ...safeUser } = found;
    sessionStorage.setItem('oem_user', JSON.stringify(safeUser));
    setUser(safeUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('oem_user');
    setUser(null);
  }, []);

  const hasAccess = useCallback((resource) => {
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true;
    return true; // Scope checks applied at component level for Phase 1
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess, ROLES, ROLE_LABELS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
