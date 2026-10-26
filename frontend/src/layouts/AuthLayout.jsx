import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';

/**
 * Isolated Authentication Layout Shell
 */
export function AuthLayout({ children }) {
  return (
    <div className="auth-layout" style={{ minHeight: '100vh', width: '100%' }}>
      <ErrorBoundary>
        {children || <Outlet />}
      </ErrorBoundary>
    </div>
  );
}

export default AuthLayout;
