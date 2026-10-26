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

import { ROLE_NAVIGATION as MENUS } from '../../roles/navigation';
import { DEFAULT_ROLE_ROUTES as DASHBOARD_ROOTS } from '../../constants/roles';

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
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(17, 24, 39, 0.94) 100%);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12), inset -1px 0 0 rgba(255, 255, 255, 0.05);
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.05em;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4);
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
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--sidebar-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .sidebar__collapse-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          color: var(--sidebar-text-active);
          border-color: rgba(255, 255, 255, 0.16);
        }
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }
        .sidebar__role-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 0 6px currentColor;
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
        .sidebar__nav::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.12); }
        .sidebar__menu {
          list-style: none;
          padding: 0 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
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
          border: 1px solid transparent;
          transition: all var(--transition-fast);
          position: relative;
          white-space: nowrap;
        }
        .sidebar__item:hover {
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: var(--sidebar-text-active);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(2px);
        }
        .sidebar__item--active {
          background: linear-gradient(90deg, rgba(37, 99, 235, 0.28) 0%, rgba(30, 64, 175, 0.16) 100%);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(96, 165, 250, 0.28);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 2px 8px rgba(37, 99, 235, 0.2);
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
          box-shadow: 0 0 8px var(--color-primary-light);
        }

        /* Footer */
        .sidebar__footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px 8px;
          flex-shrink: 0;
        }
        .sidebar__user {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
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
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--sidebar-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .sidebar__logout-btn:hover {
          background: var(--color-danger-bg);
          color: var(--color-danger);
          border-color: var(--color-danger-border);
        }

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
