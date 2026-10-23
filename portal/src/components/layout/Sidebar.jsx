import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderOpen, Building2, ShieldCheck,
  BookOpen, FileText, ClipboardCheck, Truck, Receipt, Settings,
  ChevronLeft, ChevronRight, X, BarChart3, Bell, Lock,
  CalendarCheck, FileWarning, AlertCircle, IndianRupee, Upload,
  MessageSquare, CheckSquare, History, Home, Briefcase, UserCheck,
  BookMarked, FileBadge, Calculator, LogOut, Menu
} from 'lucide-react';
import { useAuth, ROLES, ROLE_LABELS, ROLE_COLORS } from '../../context/AuthContext';

// Role-specific menu definitions
const MENUS = {
  [ROLES.ADMIN]: [
    { label: 'Executive Overview', path: '/admin',           icon: LayoutDashboard },
    { label: 'User & Role Mgmt',   path: '/admin/users',    icon: Users },
    { label: 'Client & Projects',  path: '/admin/projects', icon: Briefcase },
    { label: 'Centre Master',      path: '/admin/centres',  icon: Building2 },
    { label: 'Eligibility & Blacklist', path: '/admin/eligibility', icon: ShieldCheck },
    { label: 'Booking & Locking',  path: '/admin/booking',  icon: Lock },
    { label: 'Document Mgmt',      path: '/admin/documents',icon: FileText },
    { label: 'Audit & Compliance', path: '/admin/audit',    icon: ClipboardCheck },
    { label: 'Allocation Mgmt',    path: '/admin/allocation',icon: BookOpen },
    { label: 'Commercial & Cost',  path: '/admin/commercial',icon: Calculator },
    { label: 'Readiness & Mock',   path: '/admin/readiness', icon: CheckSquare },
    { label: 'Incident & Tickets', path: '/admin/incidents', icon: AlertCircle },
    { label: 'Notifications',      path: '/admin/notifications', icon: Bell },
    { label: 'MIS / Reports',      path: '/admin/reports',  icon: BarChart3 },
    { label: 'Audit Trail & Config', path: '/admin/config', icon: Settings },
  ],
  [ROLES.PM]: [
    { label: 'My Projects',        path: '/pm',             icon: LayoutDashboard },
    { label: 'Project Setup',      path: '/pm/setup',       icon: FolderOpen },
    { label: 'Centre Pipeline',    path: '/pm/pipeline',    icon: Building2 },
    { label: 'Eligibility Review', path: '/pm/eligibility', icon: ShieldCheck },
    { label: 'Consent & Docs',     path: '/pm/consent',     icon: FileText },
    { label: 'Audit & Mock View',  path: '/pm/audit',       icon: ClipboardCheck },
    { label: 'Allocation Mgmt',    path: '/pm/allocation',  icon: BookOpen },
    { label: 'Commercial Review',  path: '/pm/commercial',  icon: Calculator },
    { label: 'Readiness & Exam',   path: '/pm/readiness',   icon: CheckSquare },
    { label: 'Incidents / Escalations', path: '/pm/incidents', icon: AlertCircle },
    { label: 'Notifications',      path: '/pm/notifications',icon: Bell },
    { label: 'Invoice & Closure',  path: '/pm/invoice',     icon: Receipt },
    { label: 'Project MIS',        path: '/pm/reports',     icon: BarChart3 },
  ],
  [ROLES.AUDITOR]: [
    { label: 'My Audits',          path: '/auditor',        icon: LayoutDashboard },
    { label: 'Audit Assignments',  path: '/auditor/audits', icon: ClipboardCheck },
    { label: 'Technical Scan',     path: '/auditor/scan',   icon: ShieldCheck },
    { label: 'Mock Status',        path: '/auditor/mock',   icon: CheckSquare },
    { label: 'Findings & Evidence',path: '/auditor/findings',icon: FileWarning },
    { label: 'Notifications',      path: '/auditor/notifications', icon: Bell },
  ],
  [ROLES.OPERATIONS]: [
    { label: 'Operations Board',   path: '/ops',            icon: LayoutDashboard },
    { label: 'Booking & Centres',  path: '/ops/booking',    icon: CalendarCheck },
    { label: 'Consent Mgmt',       path: '/ops/consent',    icon: MessageSquare },
    { label: 'Document Checklist', path: '/ops/documents',  icon: FileText },
    { label: 'Allocation',         path: '/ops/allocation', icon: BookOpen },
    { label: 'Readiness',          path: '/ops/readiness',  icon: CheckSquare },
    { label: 'Incidents & Tickets',path: '/ops/incidents',  icon: AlertCircle },
    { label: 'Inventory',          path: '/ops/inventory',  icon: Truck },
    { label: 'Notifications',      path: '/ops/notifications', icon: Bell },
  ],
  [ROLES.FINANCE]: [
    { label: 'Finance Overview',   path: '/finance',        icon: LayoutDashboard },
    { label: 'Cost Sheets',        path: '/finance/cost',   icon: Calculator },
    { label: 'Agreements & MOU',   path: '/finance/agreements', icon: FileBadge },
    { label: 'Invoice Management', path: '/finance/invoices',icon: Receipt },
    { label: 'Payments',           path: '/finance/payments',icon: IndianRupee },
    { label: 'Reconciliation',     path: '/finance/reconcile', icon: BarChart3 },
  ],
  [ROLES.CENTRE]: [
    { label: 'Centre Dashboard',   path: '/centre',         icon: Home },
    { label: 'My Centre Profile',  path: '/centre/profile', icon: Building2 },
    { label: 'Booking Requests',   path: '/centre/booking', icon: CalendarCheck },
    { label: 'Digital Consent',    path: '/centre/consent', icon: UserCheck },
    { label: 'Document Checklist', path: '/centre/documents',icon: FileText },
    { label: 'Infrastructure Form',path: '/centre/infra',   icon: Settings },
    { label: 'Quotation & Commercials', path: '/centre/quotation', icon: Calculator },
    { label: 'MoU & Undertaking',  path: '/centre/mou',    icon: FileBadge },
    { label: 'Allocation View',    path: '/centre/allocation', icon: BookMarked },
    { label: 'Readiness Confirm',  path: '/centre/readiness', icon: CheckSquare },
    { label: 'Exam-Day Updates',   path: '/centre/examday', icon: AlertCircle },
    { label: 'Invoice Submission', path: '/centre/invoice', icon: Receipt },
    { label: 'Support / Tickets',  path: '/centre/support', icon: MessageSquare },
    { label: 'Submission History', path: '/centre/history', icon: History },
  ],
};

const DASHBOARD_ROOTS = {
  [ROLES.ADMIN]:      '/admin',
  [ROLES.PM]:         '/pm',
  [ROLES.AUDITOR]:    '/auditor',
  [ROLES.OPERATIONS]: '/ops',
  [ROLES.FINANCE]:    '/finance',
  [ROLES.CENTRE]:     '/centre',
};

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, ROLE_LABELS: RL } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const menuItems = MENUS[user.role] || [];
  const roleColor = ROLE_COLORS[user.role] || '#1e40af';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
        aria-label="Main navigation"
      >
        {/* Logo & Brand */}
        <div className="sidebar__brand">
          {!collapsed && (
            <div className="sidebar__logo">
              <div className="sidebar__logo-icon">OEM</div>
              <div>
                <div className="sidebar__logo-title">OEM Portal</div>
                <div className="sidebar__logo-sub">Exam Management</div>
              </div>
            </div>
          )}
          {collapsed && <div className="sidebar__logo-icon">OEM</div>}

          {/* Collapse toggle — desktop */}
          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Close button — mobile */}
          <button
            className="sidebar__mobile-close"
            onClick={onMobileClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="sidebar__role-badge">
            <span className="sidebar__role-dot" style={{ background: roleColor }} />
            <span className="sidebar__role-label">{RL[user.role]}</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar__nav" aria-label="Role navigation">
          <ul className="sidebar__menu" role="list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== DASHBOARD_ROOTS[user.role] && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar__item-icon">
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    {!collapsed && (
                      <span className="sidebar__item-label">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <span className="sidebar__item-active-bar" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile & logout */}
        <div className="sidebar__footer">
          <div className={`sidebar__user ${collapsed ? 'sidebar__user--compact' : ''}`}>
            <div
              className="avatar avatar-sm"
              style={{ background: roleColor }}
              title={user.name}
            >
              {user.avatar}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info min-w-0">
                <div className="sidebar__user-name truncate">{user.name}</div>
                <div className="sidebar__user-email truncate">{user.email}</div>
              </div>
            )}
            <button
              className="sidebar__logout-btn"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar-backdrop {
          display: none;
        }

        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: width var(--transition-slow);
          overflow: hidden;
          position: relative;
          z-index: 200;
        }

        .sidebar--collapsed {
          width: var(--sidebar-collapsed);
        }

        /* Brand */
        .sidebar__brand {
          padding: 16px 12px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--sidebar-border);
          min-height: 64px;
          flex-shrink: 0;
        }
        .sidebar__logo {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .sidebar__logo-icon {
          width: 34px;
          height: 34px;
          background: var(--color-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .sidebar__logo-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--sidebar-text-active);
          white-space: nowrap;
        }
        .sidebar__logo-sub {
          font-size: 0.6875rem;
          color: var(--sidebar-text);
          white-space: nowrap;
        }
        .sidebar__collapse-btn {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          background: var(--sidebar-item-hover);
          border: 1px solid var(--sidebar-border);
          color: var(--sidebar-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .sidebar__collapse-btn:hover { background: #334155; color: var(--sidebar-text-active); }
        .sidebar__mobile-close {
          display: none;
          width: 28px;
          height: 28px;
          background: var(--sidebar-item-hover);
          border: none;
          border-radius: var(--radius-sm);
          color: var(--sidebar-text);
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* Role badge */
        .sidebar__role-badge {
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 7px;
          border-bottom: 1px solid var(--sidebar-border);
          flex-shrink: 0;
        }
        .sidebar__role-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sidebar__role-label {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--sidebar-text);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          white-space: nowrap;
        }

        /* Nav */
        .sidebar__nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 0;
        }
        .sidebar__nav::-webkit-scrollbar { width: 3px; }
        .sidebar__nav::-webkit-scrollbar-thumb { background: var(--sidebar-border); }
        .sidebar__menu {
          list-style: none;
          padding: 0 8px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .sidebar__item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          color: var(--sidebar-text);
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 400;
          transition: all var(--transition-fast);
          position: relative;
          white-space: nowrap;
        }
        .sidebar__item:hover {
          background: var(--sidebar-item-hover);
          color: var(--sidebar-text-active);
        }
        .sidebar__item--active {
          background: rgba(30, 64, 175, 0.25);
          color: var(--sidebar-text-active);
          font-weight: 500;
        }
        .sidebar__item-icon { flex-shrink: 0; display: flex; }
        .sidebar__item-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
        .sidebar__item-active-bar {
          width: 3px;
          height: 16px;
          background: var(--color-primary-light);
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }

        /* Footer */
        .sidebar__footer {
          border-top: 1px solid var(--sidebar-border);
          padding: 10px 8px;
          flex-shrink: 0;
        }
        .sidebar__user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: var(--radius-md);
        }
        .sidebar__user--compact { justify-content: center; }
        .sidebar__user-info {
          flex: 1;
          min-width: 0;
        }
        .sidebar__user-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--sidebar-text-active);
        }
        .sidebar__user-email {
          font-size: 0.6875rem;
          color: var(--sidebar-text);
        }
        .sidebar__logout-btn {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid var(--sidebar-border);
          color: var(--sidebar-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .sidebar__logout-btn:hover { background: var(--color-danger-bg); color: var(--color-danger); border-color: var(--color-danger-border); }

        /* Mobile */
        @media (max-width: 768px) {
          .sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background: rgb(0 0 0 / 0.5);
            z-index: 199;
          }
          .sidebar {
            position: fixed;
            left: -100%;
            top: 0;
            height: 100vh;
            width: var(--sidebar-width) !important;
            transition: left var(--transition-slow);
          }
          .sidebar--mobile-open {
            left: 0;
          }
          .sidebar__collapse-btn { display: none; }
          .sidebar__mobile-close { display: flex; }
        }
      `}</style>
    </>
  );
}
