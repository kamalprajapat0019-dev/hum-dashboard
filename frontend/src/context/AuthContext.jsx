/**
 * Auth Context — Role-based access control & session provider
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES, ROLE_LABELS, ROLE_COLORS, normalizeRole } from '../constants/roles';
import { ROLE_PERMISSIONS } from '../constants/permissions';
import { authService, DEMO_USERS } from '../services/authService';

export { ROLES, ROLE_LABELS, ROLE_COLORS, DEMO_USERS };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return authService.getCurrentUser();
  });

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('oem:session-expired', handleExpired);
    return () => window.removeEventListener('oem:session-expired', handleExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    if (!result.success) return result;
    setUser(result.user);
    return { success: true, user: result.user };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const hasAccess = useCallback((permissionOrResource) => {
    if (!user) return false;
    const roleKey = normalizeRole(user.role);
    if (roleKey === ROLES.ADMIN) return true;
    if (!permissionOrResource) return true;
    const allowedPermissions = ROLE_PERMISSIONS[roleKey] || [];
    return allowedPermissions.includes(permissionOrResource);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess, ROLES, ROLE_LABELS, ROLE_COLORS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
