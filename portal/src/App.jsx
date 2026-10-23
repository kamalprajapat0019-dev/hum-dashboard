import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoginPage from './pages/LoginPage';

// Dashboards
import AdminDashboard    from './pages/admin/AdminDashboard';
import PMDashboard       from './pages/pm/PMDashboard';
import AuditorDashboard  from './pages/auditor/AuditorDashboard';
import OpsDashboard      from './pages/ops/OpsDashboard';
import FinanceDashboard  from './pages/finance/FinanceDashboard';
import CentreDashboard   from './pages/centre/CentreDashboard';
import ComingSoon        from './pages/ComingSoon';

// Phase 2 Modules
import CentresPage       from './pages/admin/CentresPage';
import UsersPage         from './pages/admin/UsersPage';
import ProjectsPage      from './pages/admin/ProjectsPage';
import ConfigPage        from './pages/admin/ConfigPage';
import CentreDocuments   from './pages/centre/CentreDocuments';

// Phase 3 Modules (Core Operations)
import EligibilityPage       from './pages/admin/EligibilityPage';
import BookingLockingPage    from './pages/ops/BookingLockingPage';
import ConsentManagementPage from './pages/ops/ConsentManagementPage';
import CentreConsentPage     from './pages/centre/CentreConsentPage';
import DocumentReviewPage    from './pages/ops/DocumentReviewPage';

// Phase 4 Modules (Compliance & Technical Audit)
import AuditAssignmentsPage  from './pages/auditor/AuditAssignmentsPage';
import TechnicalScanPage     from './pages/auditor/TechnicalScanPage';
import MockStatusPage        from './pages/auditor/MockStatusPage';
import FindingsEvidencePage  from './pages/auditor/FindingsEvidencePage';

// Phase 5 Modules (Execution Layer)
import AllocationManagementPage from './pages/ops/AllocationManagementPage';
import ReadinessExamPage        from './pages/ops/ReadinessExamPage';
import IncidentManagementPage   from './pages/ops/IncidentManagementPage';
import InventoryPage            from './pages/ops/InventoryPage';

// Phase 6 Modules (Commercial & Finance)
import CostSheetPage             from './pages/finance/CostSheetPage';
import InvoiceManagementPage    from './pages/finance/InvoiceManagementPage';
import PaymentReconciliationPage from './pages/finance/PaymentReconciliationPage';

// Phase 7 Module (Notification System)
import NotificationCenterPage    from './pages/NotificationCenterPage';

// Phase 8 Module (MIS & Reporting)
import MISReportsPage            from './pages/admin/MISReportsPage';

// ── App Shell ─────────────────────────────────────────────────────────────────
function AppShell({ children }) {
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
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

// ── Role Root Redirect ────────────────────────────────────────────────────────
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const roots = {
    [ROLES.ADMIN]:      '/admin',
    [ROLES.PM]:         '/pm',
    [ROLES.AUDITOR]:    '/auditor',
    [ROLES.OPERATIONS]: '/ops',
    [ROLES.FINANCE]:    '/finance',
    [ROLES.CENTRE]:     '/centre',
  };
  return <Navigate to={roots[user.role] || '/login'} replace />;
}

// ── Unauthorized Page ─────────────────────────────────────────────────────────
function Unauthorized() {
  const { logout } = useAuth();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: '3rem' }}>🔒</div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Access Denied</h2>
      <p style={{ color: 'var(--text-muted)' }}>You don&apos;t have permission to view this page.</p>
      <button className="btn btn-primary" onClick={logout}>Sign Out</button>
    </div>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <RoleRedirect /> : <LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Root redirect */}
      <Route path="/" element={<RoleRedirect />} />

      {/* ── ADMIN ── */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
          <AppShell><AdminDashboard /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/admin/users"       element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><UsersPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/projects"    element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><ProjectsPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/centres"     element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><CentresPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/eligibility" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><EligibilityPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/booking"     element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><BookingLockingPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/documents"   element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><DocumentReviewPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/audit"       element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><ComingSoon title="Audit & Compliance" /></AppShell></ProtectedRoute>} />
      <Route path="/admin/allocation"  element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><AllocationManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/commercial"  element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><CostSheetPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/readiness"   element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><ReadinessExamPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/incidents"   element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><IncidentManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><NotificationCenterPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/reports"     element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><MISReportsPage /></AppShell></ProtectedRoute>} />
      <Route path="/admin/config"      element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AppShell><ConfigPage /></AppShell></ProtectedRoute>} />

      {/* ── PROJECT MANAGER ── */}
      <Route path="/pm" element={
        <ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}>
          <AppShell><PMDashboard /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/pm/setup"         element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><ProjectsPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/pipeline"      element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><BookingLockingPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/eligibility"   element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><EligibilityPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/consent"       element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><ConsentManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/audit"         element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><AuditAssignmentsPage isPmView={true} /></AppShell></ProtectedRoute>} />
      <Route path="/pm/allocation"    element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><AllocationManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/commercial"    element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><CostSheetPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/readiness"     element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><ReadinessExamPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/incidents"     element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><IncidentManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/notifications" element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><NotificationCenterPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/invoice"       element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><InvoiceManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/pm/reports"       element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><AppShell><MISReportsPage /></AppShell></ProtectedRoute>} />

      {/* ── AUDITOR ── */}
      <Route path="/auditor" element={
        <ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}>
          <AppShell><AuditorDashboard /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/auditor/audits"        element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><AppShell><AuditAssignmentsPage /></AppShell></ProtectedRoute>} />
      <Route path="/auditor/scan"          element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><AppShell><TechnicalScanPage /></AppShell></ProtectedRoute>} />
      <Route path="/auditor/mock"          element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><AppShell><MockStatusPage /></AppShell></ProtectedRoute>} />
      <Route path="/auditor/findings"      element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><AppShell><FindingsEvidencePage /></AppShell></ProtectedRoute>} />
      <Route path="/auditor/notifications" element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><AppShell><NotificationCenterPage /></AppShell></ProtectedRoute>} />

      {/* ── OPERATIONS ── */}
      <Route path="/ops" element={
        <ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}>
          <AppShell><OpsDashboard /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/ops/booking"       element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><AppShell><BookingLockingPage /></AppShell></ProtectedRoute>} />
      <Route path="/ops/consent"       element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><AppShell><ConsentManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/ops/documents"     element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><AppShell><DocumentReviewPage /></AppShell></ProtectedRoute>} />
      <Route path="/ops/allocation"    element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><AppShell><AllocationManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/ops/readiness"     element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><AppShell><ReadinessExamPage /></AppShell></ProtectedRoute>} />
      <Route path="/ops/incidents"     element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><AppShell><IncidentManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/ops/inventory"     element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><AppShell><InventoryPage /></AppShell></ProtectedRoute>} />
      <Route path="/ops/notifications" element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><AppShell><NotificationCenterPage /></AppShell></ProtectedRoute>} />

      {/* ── FINANCE ── */}
      <Route path="/finance" element={
        <ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}>
          <AppShell><FinanceDashboard /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/finance/cost"        element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><AppShell><CostSheetPage /></AppShell></ProtectedRoute>} />
      <Route path="/finance/agreements"  element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><AppShell><ComingSoon title="Agreements & MOU" /></AppShell></ProtectedRoute>} />
      <Route path="/finance/invoices"    element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><AppShell><InvoiceManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/finance/payments"    element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><AppShell><PaymentReconciliationPage /></AppShell></ProtectedRoute>} />
      <Route path="/finance/reconcile"   element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><AppShell><PaymentReconciliationPage /></AppShell></ProtectedRoute>} />

      {/* ── CENTRE ── */}
      <Route path="/centre" element={
        <ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}>
          <AppShell><CentreDashboard /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/centre/profile"    element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><CentresPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/booking"    element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><BookingLockingPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/consent"    element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><CentreConsentPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/documents"  element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><CentreDocuments /></AppShell></ProtectedRoute>} />
      <Route path="/centre/infra"      element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><ComingSoon title="Infrastructure & Power Form" /></AppShell></ProtectedRoute>} />
      <Route path="/centre/quotation"  element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><CostSheetPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/mou"        element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><ComingSoon title="MoU & Undertaking" /></AppShell></ProtectedRoute>} />
      <Route path="/centre/allocation" element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><AllocationManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/readiness"  element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><ReadinessExamPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/examday"    element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><ReadinessExamPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/support"    element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><IncidentManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/invoice"    element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><InvoiceManagementPage /></AppShell></ProtectedRoute>} />
      <Route path="/centre/history"    element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><AppShell><ComingSoon title="Submission History" /></AppShell></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
