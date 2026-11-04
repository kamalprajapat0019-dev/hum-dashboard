import { AuthProvider } from '../context/AuthContext';
import { ClientProvider } from '../context/ClientContext';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';

/**
 * Global Application Providers
 */
export function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClientProvider>
          {children}
        </ClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default AppProviders;
