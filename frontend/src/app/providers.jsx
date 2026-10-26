import { AuthProvider } from '../context/AuthContext';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';

/**
 * Global Application Providers
 */
export function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default AppProviders;
