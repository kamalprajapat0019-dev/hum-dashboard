import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';

/**
 * Enterprise Dashboard Layout Shell
 */
export function DashboardLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="main-content">
        <Header onMobileMenuToggle={() => setMobileNavOpen(o => !o)} />
        <main className="page-body" id="main-content" tabIndex={-1}>
          <ErrorBoundary>
            {children || <Outlet />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
