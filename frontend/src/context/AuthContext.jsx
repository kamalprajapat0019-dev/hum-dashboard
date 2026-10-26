/**
 * Auth Context — Role-based access control & session provider
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '../constants/roles';
import { authService, DEMO_USERS } from '../services/authService';

export { ROLES, ROLE_LABELS, ROLE_COLORS, DEMO_USERS };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return authService.getCurrentUser();
  });

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

  const hasAccess = useCallback((_resource) => {
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true;
    return true; // Scope checks applied at component level
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
