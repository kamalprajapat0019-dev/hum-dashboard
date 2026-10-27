import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, ChevronDown, Settings, User, LogOut, HelpCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { useAuth, ROLE_LABELS, ROLE_COLORS, ROLES } from '../../context/AuthContext';
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  subscribeNotifications
} from '../../services/notificationService';
import ExamCalendarModal from '../common/ExamCalendarModal';

const ROUTE_LABELS = {
  '/admin':              ['Executive Overview'],
  '/admin/users':        ['User & Role Management'],
  '/admin/projects':     ['Client & Project Management'],
  '/admin/centres':      ['Centre Master'],
  '/admin/audit':        ['Audit & Compliance'],
  '/admin/notifications':['Notifications & Alert Center'],
  '/admin/reports':      ['MIS / Reports'],
  '/pm':                 ['My Projects'],
  '/pm/allocation':      ['Allocation Management'],
  '/pm/notifications':   ['Notifications & Alert Center'],
  '/auditor':            ['My Audits'],
  '/auditor/audits':     ['Audit Assignments'],
  '/auditor/mock':       ['Mock Status'],
  '/auditor/notifications':['Notifications & Alert Center'],
  '/ops':                ['Operations Board'],
  '/ops/booking':        ['Booking & Centres'],
  '/ops/documents':      ['Document Checklist'],
  '/ops/notifications':  ['Notifications & Alert Center'],
  '/finance':            ['Finance Overview'],
  '/finance/invoices':   ['Invoice Management'],
  '/centre':             ['Centre Dashboard'],
  '/centre/documents':   ['Document Checklist'],
};

function NotificationPanel({ onClose, user }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => getAllNotifications(user?.role));

  useEffect(() => {
    return subscribeNotifications(() => {
      setItems(getAllNotifications(user?.role));
    });
  }, [user?.role]);

  const unread = items.filter(n => !n.read).length;

  const typeColor = (priority) => {
    if (priority === 'critical') return '#dc2626';
    if (priority === 'high')     return '#d97706';
    return '#0ea5e9';
  };

  const getNotifRoute = () => {
    const role = user?.role || ROLES.ADMIN;
    if (role === ROLES.PM) return '/pm/notifications';
    if (role === ROLES.AUDITOR) return '/auditor/notifications';
    if (role === ROLES.OPERATIONS) return '/ops/notifications';
    return '/admin/notifications';
  };

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    onClose();
    if (notif.deepLink) {
      navigate(notif.deepLink);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate(getNotifRoute());
  };

  return (
    <div className="notif-panel" role="dialog" aria-label="Notifications">
      <div className="notif-header">
        <h4>Notifications</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unread > 0 && (
            <span className="badge badge-danger">{unread} new</span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No notifications available
          </div>
        ) : (
          items.slice(0, 6).map(n => (
            <div
              key={n.id}
              className={`notif-item ${!n.read ? 'unread' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleItemClick(n)}
            >
              <div className="notif-item__dot" style={{ background: typeColor(n.priority) }} />
              <div className="notif-item__body">
                <div className="notif-item__title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{n.title}</span>
                  <ArrowUpRight size={12} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                </div>
                <div className="notif-item__desc">{n.desc}</div>
                <div className="notif-item__time">
                  <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>{n.module}</span>
                  {' · '}
                  <span>{n.projectName}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="card-footer" style={{ textAlign: 'center' }}>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleViewAll}>
          View all notifications →
        </button>
      </div>
    </div>
  );
}

export default function Header({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [notifOpen, setNotifOpen]       = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');

  const notifRef    = useRef(null);
  const calendarRef = useRef(null);
  const profileRef  = useRef(null);

  // Close panels on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        if (!e.target.closest?.('.calendar-modal-overlay') && !e.target.closest?.('.calendar-modal-container')) {
          setCalendarOpen(false);
        }
      }
      if (profileRef.current  && !profileRef.current.contains(e.target))  setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount(user?.role));

  useEffect(() => {
    setUnreadCount(getUnreadCount(user?.role));
    return subscribeNotifications(() => {
      setUnreadCount(getUnreadCount(user?.role));
    });
  }, [user?.role]);

  // Breadcrumb
  const crumbs = ROUTE_LABELS[location.pathname] || [location.pathname.split('/').filter(Boolean).join(' / ')];
  const roleColor = user ? ROLE_COLORS[user.role] : '#1e40af';

  return (
    <header className="app-header" role="banner">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="header__left">
        <button
          className="btn btn-ghost btn-sm header__menu-btn"
          onClick={onMobileMenuToggle}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-sep" style={{ color: 'var(--text-muted)' }}>Home</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{crumbs[0]}</span>
        </nav>
      </div>

      {/* Center: Search */}
      <div className="header__search">
        <div className="search-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="search"
            placeholder="Search projects, centres, documents…"
            className="search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Global search"
          />
        </div>
      </div>

      {/* Right: Calendar + Notifications + Profile */}
      <div className="header__right">
        {/* Examination Calendar */}
        <div className="dropdown" ref={calendarRef}>
          <button
            className="header__icon-btn"
            onClick={() => { setCalendarOpen(o => !o); setNotifOpen(false); setProfileOpen(false); }}
            aria-label="Annual Examination Calendar"
            title="Annual Examination Calendar"
            style={{ position: 'relative' }}
          >
            <Calendar size={17} />
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#16a34a',
                border: '2px solid var(--bg-surface)'
              }}
              title="Scheduled Exams"
            />
          </button>
          {calendarOpen && <ExamCalendarModal onClose={() => setCalendarOpen(false)} />}
        </div>

        {/* Notifications */}
        <div className="dropdown" ref={notifRef}>
          <button
            className="header__icon-btn"
            onClick={() => { setNotifOpen(o => !o); setCalendarOpen(false); setProfileOpen(false); }}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notifOpen}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="header__notif-badge" aria-hidden="true">{unreadCount}</span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} user={user} />}
        </div>

        {/* Profile menu */}
        <div className="dropdown" ref={profileRef}>
          <button
            className="header__profile-btn"
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
            aria-label="Profile menu"
            aria-expanded={profileOpen}
          >
            <div className="avatar avatar-sm" style={{ background: roleColor }}>
              {user?.avatar}
            </div>
            <div className="header__profile-info">
              <span className="header__profile-name">{user?.name}</span>
              <span className="header__profile-role">{ROLE_LABELS[user?.role]}</span>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>

          {profileOpen && (
            <div className="dropdown-menu">
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
              </div>
              <button className="dropdown-item"><User size={14} /> My Profile</button>
              <button className="dropdown-item"><Settings size={14} /> Preferences</button>
              <button className="dropdown-item"><HelpCircle size={14} /> Help & Support</button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={logout}><LogOut size={14} /> Sign Out</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .app-header {
          height: var(--header-height);
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(20px) saturate(190%);
          -webkit-backdrop-filter: blur(20px) saturate(190%);
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.95);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 20px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header__left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .header__menu-btn {
          display: none;
          padding: 6px;
        }

        .header__search {
          flex: 1;
          max-width: 420px;
        }
        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 7px 12px 7px 32px;
          background: rgba(241, 245, 249, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: var(--radius-full);
          font-size: 0.8125rem;
          color: var(--text-primary);
          font-family: inherit;
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
          transition: all var(--transition-fast);
        }
        .search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.96);
          border-color: var(--color-primary-light);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15), inset 0 1px 1px #fff;
        }
        .search-input::placeholder { color: var(--text-muted); }

        .header__right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .header__icon-btn {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(248, 250, 252, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), inset 0 1px 0 #fff;
          transition: all var(--transition-fast);
        }
        .header__icon-btn:hover {
          background: rgba(255, 255, 255, 0.95);
          color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), inset 0 1px 0 #fff;
          transform: translateY(-1px);
        }
        .header__notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background: var(--color-danger);
          color: #fff;
          border-radius: 50%;
          font-size: 0.625rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-surface);
        }

        .header__profile-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px 5px 5px;
          background: rgba(248, 250, 252, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: var(--radius-lg);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), inset 0 1px 0 #fff;
          transition: all var(--transition-fast);
        }
        .header__profile-btn:hover {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08), inset 0 1px 0 #fff;
        }
        .header__profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .header__profile-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
          white-space: nowrap;
        }
        .header__profile-role {
          font-size: 0.6875rem;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .header__left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          min-width: 0;
          overflow: hidden;
        }

        .breadcrumb-current {
          color: var(--text-primary);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        @media (max-width: 1024px) {
          .header__search { max-width: 260px; }
        }

        @media (max-width: 768px) {
          .header__menu-btn { display: flex; }
          .header__search { display: none; }
          .header__profile-info { display: none; }
          .header__profile-btn { padding: 5px; }
        }

        @media (max-width: 540px) {
          .breadcrumb-sep { display: none; }
          .breadcrumb-current {
            max-width: 140px;
          }
        }

        @media (max-width: 480px) {
          .app-header { padding: 0 10px; gap: 8px; }
          .header__right { gap: 6px; }
          .notif-panel {
            position: fixed;
            top: calc(var(--header-height) + 4px);
            left: 10px;
            right: 10px;
            width: auto;
            max-width: none;
            max-height: calc(100dvh - var(--header-height) - 16px);
          }
          .dropdown-menu {
            position: fixed;
            top: calc(var(--header-height) + 4px);
            right: 10px;
            left: auto;
            max-width: calc(100vw - 20px);
          }
        }

        @media (max-width: 360px) {
          .breadcrumb-current {
            max-width: 95px;
          }
          .header__icon-btn {
            width: 32px;
            height: 32px;
          }
          .app-header {
            padding: 0 8px;
            gap: 6px;
          }
        }
      `}</style>
    </header>
  );
}
