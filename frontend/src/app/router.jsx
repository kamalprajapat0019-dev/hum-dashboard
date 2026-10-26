import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, DEFAULT_ROLE_ROUTES } from '../constants/roles';
import { ROUTES } from '../constants/routes';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth
import LoginPage from '../features/auth/pages/LoginPage';

// Role Dashboards
import AdminDashboard from '../roles/admin/AdminDashboard';
import PMDashboard from '../roles/project-manager/PMDashboard';
import AuditorDashboard from '../roles/auditor/AuditorDashboard';
import OpsDashboard from '../roles/operations/OpsDashboard';
import FinanceDashboard from '../roles/finance/FinanceDashboard';
import CentreDashboard from '../roles/centre-user/CentreDashboard';

// Feature Pages
import ProjectsPage from '../features/projects/ProjectsPage';
import CentresPage from '../features/centres/CentresPage';
import CentreDocuments from '../features/centres/CentreDocuments';
import CentreConsentPage from '../features/centres/CentreConsentPage';
import UsersPage from '../features/users/UsersPage';
import EligibilityPage from '../features/eligibility/EligibilityPage';
import ConfigPage from '../features/admin/ConfigPage';
import BookingLockingPage from '../features/bookings/BookingLockingPage';
import ConsentManagementPage from '../features/consent/ConsentManagementPage';
import DocumentReviewPage from '../features/documents/DocumentReviewPage';
import AuditAssignmentsPage from '../features/audits/AuditAssignmentsPage';
import FindingsEvidencePage from '../features/audits/FindingsEvidencePage';
import MockStatusPage from '../features/audits/MockStatusPage';
import TechnicalScanPage from '../features/technical-scans/TechnicalScanPage';
import AllocationManagementPage from '../features/allocations/AllocationManagementPage';
import ReadinessExamPage from '../features/readiness/ReadinessExamPage';
import IncidentManagementPage from '../features/incidents/IncidentManagementPage';
import InventoryPage from '../features/inventory/InventoryPage';
import CostSheetPage from '../features/finance/CostSheetPage';
import InvoiceManagementPage from '../features/finance/InvoiceManagementPage';
import PaymentReconciliationPage from '../features/finance/PaymentReconciliationPage';
import MISReportsPage from '../features/reports/MISReportsPage';
import NotificationCenterPage from '../features/notifications/NotificationCenterPage';

/**
 * Route guard checking role access
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }
  return children;
}

/**
 * Role-based redirect to default landing page
 */
export function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Navigate to={DEFAULT_ROLE_ROUTES[user.role] || ROUTES.LOGIN} replace />;
}

/**
 * Access Denied screen
 */
export function Unauthorized() {
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

/**
 * Central Route Tree
 */
export function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public / Auth */}
      <Route
        path={ROUTES.LOGIN}
        element={user ? <RoleRedirect /> : <AuthLayout><LoginPage /></AuthLayout>}
      />
      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
      <Route path={ROUTES.HOME} element={<RoleRedirect />} />

      {/* ── ADMIN ROUTES ── */}
      <Route path={ROUTES.ADMIN.DASHBOARD} element={
        <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
          <DashboardLayout><AdminDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path={ROUTES.ADMIN.USERS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><UsersPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.PROJECTS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.CENTRES} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><CentresPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.ELIGIBILITY} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><EligibilityPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.BOOKING} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><BookingLockingPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.DOCUMENTS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><DocumentReviewPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.AUDIT} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><AuditAssignmentsPage isPmView={false} /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.ALLOCATION} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><AllocationManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.COMMERCIAL} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><CostSheetPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.READINESS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><ReadinessExamPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.INCIDENTS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><IncidentManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.NOTIFICATIONS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><NotificationCenterPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.REPORTS} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><MISReportsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.ADMIN.CONFIG} element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><DashboardLayout><ConfigPage /></DashboardLayout></ProtectedRoute>} />

      {/* ── PROJECT MANAGER ROUTES ── */}
      <Route path={ROUTES.PM.DASHBOARD} element={
        <ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}>
          <DashboardLayout><PMDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path={ROUTES.PM.SETUP} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><ProjectsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.PIPELINE} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><BookingLockingPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.ELIGIBILITY} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><EligibilityPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.CONSENT} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><ConsentManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.AUDIT} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><AuditAssignmentsPage isPmView={true} /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.ALLOCATION} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><AllocationManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.COMMERCIAL} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><CostSheetPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.READINESS} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><ReadinessExamPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.INCIDENTS} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><IncidentManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.NOTIFICATIONS} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><NotificationCenterPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.INVOICE} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><InvoiceManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.PM.REPORTS} element={<ProtectedRoute allowedRoles={[ROLES.PM, ROLES.ADMIN]}><DashboardLayout><MISReportsPage /></DashboardLayout></ProtectedRoute>} />

      {/* ── AUDITOR ROUTES ── */}
      <Route path={ROUTES.AUDITOR.DASHBOARD} element={
        <ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}>
          <DashboardLayout><AuditorDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path={ROUTES.AUDITOR.AUDITS} element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><DashboardLayout><AuditAssignmentsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.AUDITOR.SCAN} element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><DashboardLayout><TechnicalScanPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.AUDITOR.MOCK} element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><DashboardLayout><MockStatusPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.AUDITOR.FINDINGS} element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><DashboardLayout><FindingsEvidencePage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.AUDITOR.NOTIFICATIONS} element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR, ROLES.ADMIN]}><DashboardLayout><NotificationCenterPage /></DashboardLayout></ProtectedRoute>} />

      {/* ── OPERATIONS ROUTES ── */}
      <Route path={ROUTES.OPS.DASHBOARD} element={
        <ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}>
          <DashboardLayout><OpsDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path={ROUTES.OPS.BOOKING} element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><DashboardLayout><BookingLockingPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.OPS.CONSENT} element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><DashboardLayout><ConsentManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.OPS.DOCUMENTS} element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><DashboardLayout><DocumentReviewPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.OPS.ALLOCATION} element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><DashboardLayout><AllocationManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.OPS.READINESS} element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><DashboardLayout><ReadinessExamPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.OPS.INCIDENTS} element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><DashboardLayout><IncidentManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.OPS.INVENTORY} element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><DashboardLayout><InventoryPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.OPS.NOTIFICATIONS} element={<ProtectedRoute allowedRoles={[ROLES.OPERATIONS, ROLES.ADMIN]}><DashboardLayout><NotificationCenterPage /></DashboardLayout></ProtectedRoute>} />

      {/* ── FINANCE ROUTES ── */}
      <Route path={ROUTES.FINANCE.DASHBOARD} element={
        <ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}>
          <DashboardLayout><FinanceDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path={ROUTES.FINANCE.COST} element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><DashboardLayout><CostSheetPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.FINANCE.AGREEMENTS} element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><DashboardLayout><DocumentReviewPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.FINANCE.INVOICES} element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><DashboardLayout><InvoiceManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.FINANCE.PAYMENTS} element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><DashboardLayout><PaymentReconciliationPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.FINANCE.RECONCILE} element={<ProtectedRoute allowedRoles={[ROLES.FINANCE, ROLES.ADMIN]}><DashboardLayout><PaymentReconciliationPage /></DashboardLayout></ProtectedRoute>} />

      {/* ── CENTRE ROUTES ── */}
      <Route path={ROUTES.CENTRE.DASHBOARD} element={
        <ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}>
          <DashboardLayout><CentreDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path={ROUTES.CENTRE.PROFILE} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><CentresPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.BOOKING} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><BookingLockingPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.CONSENT} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><CentreConsentPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.DOCUMENTS} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><CentreDocuments /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.INFRA} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><ReadinessExamPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.QUOTATION} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><CostSheetPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.MOU} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><CentreDocuments /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.ALLOCATION} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><AllocationManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.READINESS} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><ReadinessExamPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.EXAMDAY} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><ReadinessExamPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.SUPPORT} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><IncidentManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.INVOICE} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><InvoiceManagementPage /></DashboardLayout></ProtectedRoute>} />
      <Route path={ROUTES.CENTRE.HISTORY} element={<ProtectedRoute allowedRoles={[ROLES.CENTRE, ROLES.ADMIN]}><DashboardLayout><PaymentReconciliationPage /></DashboardLayout></ProtectedRoute>} />

      {/* 404 / Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRouter;
