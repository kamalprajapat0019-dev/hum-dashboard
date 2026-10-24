import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, AlertCircle, CheckCircle2, Clock, Search,
  Filter, Check, Trash2, ArrowUpRight, Zap, RefreshCw, Eye,
  ShieldAlert, Settings2, Send, ChevronRight, Layers, FileCode2,
  SlidersHorizontal, CheckCheck, Info, ExternalLink
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '@/context/AuthContext';
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  dispatchNotification,
  subscribeNotifications,
  resetToSeedNotifications,
  NOTIFICATION_TRIGGER_RULES
} from '@/services/notificationService';

export default function NotificationCenterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(() => getAllNotifications(user?.role));
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'rules' | 'audit'
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all'); // all | critical | high | normal
  const [moduleFilter, setModuleFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all'); // all | unread | read
  const [selectedNotif, setSelectedNotif] = useState(null); // for inspect modal
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Subscribe to reactive updates
  useEffect(() => {
    const unsubscribe = subscribeNotifications(() => {
      setNotifications(getAllNotifications(user?.role));
    });
    return unsubscribe;
  }, [user?.role]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleMarkRead = (id, e) => {
    e?.stopPropagation();
    markAsRead(id);
    showToast('Notification marked as read');
  };

  const handleMarkUnread = (id, e) => {
    e?.stopPropagation();
    markAsUnread(id);
    showToast('Notification marked as unread');
  };

  const handleDelete = (id, e) => {
    e?.stopPropagation();
    deleteNotification(id);
    showToast('Notification removed from feed');
  };

  const handleMarkAllRead = () => {
    markAllAsRead(user?.role);
    showToast('All notifications marked as read');
  };

  const handleNavigateDeepLink = (notif) => {
    markAsRead(notif.id);
    if (notif.deepLink) {
      navigate(notif.deepLink);
    }
  };

  // Quick Simulation Dispatcher
  const handleSimulateTrigger = (rule) => {
    const simulated = dispatchNotification({
      triggerEvent: rule.code,
      projectId: 'PRJ-001',
      projectName: 'NEET UG 2026',
      centreId: 'TC-101',
      centreName: 'Lotus Computer Education, Jaipur',
      module: rule.module,
      recordRef: `${rule.code}-TEST-${Math.floor(100 + Math.random() * 900)}`,
      actionType: 'TRIGGERED',
      actor: `${user?.name || 'Simulator'} (Manual Trigger)`,
      priority: rule.priority,
      title: `${rule.name} (Simulated)`,
      desc: rule.desc,
      deepLink: rule.code === 'SCAN_DUPLICATE_MAC' ? '/auditor/scan'
              : rule.code === 'BOOKING_CONFLICT' ? '/ops/booking'
              : rule.code === 'LOCKED_ALLOCATION_CHANGE' ? '/pm/allocation'
              : rule.code === 'FAILED_MOCK' ? '/auditor/mock'
              : rule.code === 'CRITICAL_INCIDENT' ? '/ops/incidents'
              : rule.code === 'COMMERCIAL_RATE_DISCREPANCY' ? '/finance/cost'
              : '/admin',
      recipients: rule.recipients,
      deliveryChannel: rule.channels.join(' + ')
    });

    setSimulationModalOpen(false);
    showToast(`Dispatched event: ${rule.name}`);
  };

  // Filter calculations
  const filteredList = useMemo(() => {
    return notifications.filter(n => {
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
      if (moduleFilter !== 'all' && n.module.toLowerCase() !== moduleFilter.toLowerCase()) return false;
      if (readFilter === 'unread' && n.read) return false;
      if (readFilter === 'read' && !n.read) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const text = `${n.title} ${n.desc} ${n.projectName} ${n.centreName} ${n.recordRef} ${n.triggerEvent}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [notifications, priorityFilter, moduleFilter, readFilter, search]);

  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const critical = notifications.filter(n => n.priority === 'critical' && !n.read).length;
    const high = notifications.filter(n => n.priority === 'high' && !n.read).length;
    return { total, unread, critical, high };
  }, [notifications]);

  // Modules list for dropdown
  const modulesList = useMemo(() => {
    const set = new Set(notifications.map(n => n.module));
    return Array.from(set);
  }, [notifications]);

  const formatTimeAgo = (iso) => {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="notif-page-root">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="notif-toast">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="notif-header-banner">
        <div className="notif-header-text">
          <div className="notif-badge-role">
            <span className="pulsing-dot" />
            <span>Scope: {ROLE_LABELS[user?.role] || user?.role}</span>
          </div>
          <h1 className="notif-title">Internal Notification & Alert Center</h1>
          <p className="notif-subtitle">
            Real-time event notification engine with role-based routing, duplicate consolidation, and critical compliance alerts.
          </p>
        </div>

        <div className="notif-header-actions">
          <button className="btn btn-secondary" onClick={() => setSimulationModalOpen(true)}>
            <Zap size={15} style={{ color: 'var(--brand-accent, #38bdf8)' }} />
            <span>Simulate Event Trigger</span>
          </button>
          <button className="btn btn-primary" onClick={handleMarkAllRead} disabled={stats.unread === 0}>
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="notif-kpi-grid">
        <div className="notif-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
            <Bell size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Total Notifications</div>
            <div className="kpi-val">{stats.total}</div>
          </div>
        </div>

        <div className="notif-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
            <Clock size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Unread Alerts</div>
            <div className="kpi-val">{stats.unread}</div>
          </div>
        </div>

        <div className="notif-kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">Critical Alerts (Active)</div>
            <div className="kpi-val" style={{ color: '#ef4444' }}>{stats.critical}</div>
          </div>
        </div>

        <div className="notif-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(249, 115, 22, 0.12)', color: '#f97316' }}>
            <ShieldAlert size={20} />
          </div>
          <div className="kpi-content">
            <div className="kpi-label">High Priority Unresolved</div>
            <div className="kpi-val">{stats.high}</div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="notif-tabs-nav">
        <button
          className={`notif-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <Bell size={16} />
          <span>Notification Feed</span>
          {stats.unread > 0 && <span className="tab-pill">{stats.unread}</span>}
        </button>

        <button
          className={`notif-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Settings2 size={16} />
          <span>Event Engine Rules ({NOTIFICATION_TRIGGER_RULES.length})</span>
        </button>

        <button
          className={`notif-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <Layers size={16} />
          <span>Dispatch & Audit Log</span>
        </button>
      </div>

      {/* ── TAB 1: FEED ── */}
      {activeTab === 'feed' && (
        <div className="notif-tab-content">
          {/* Filter Bar */}
          <div className="notif-filters-card">
            <div className="filter-search-box">
              <Search size={16} className="search-ico" />
              <input
                type="text"
                placeholder="Search alerts, centres, projects, record ref…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
            </div>

            <div className="filter-dropdowns">
              <div className="filter-group">
                <span className="filter-lbl">Priority:</span>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                  <option value="all">All Priorities</option>
                  <option value="critical">🚨 Critical Only</option>
                  <option value="high">⚠️ High Priority</option>
                  <option value="normal">ℹ️ Normal</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-lbl">Module:</span>
                <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                  <option value="all">All Modules</option>
                  {modulesList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-lbl">Status:</span>
                <select value={readFilter} onChange={e => setReadFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>

              {(search || priorityFilter !== 'all' || moduleFilter !== 'all' || readFilter !== 'all') && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearch('');
                    setPriorityFilter('all');
                    setModuleFilter('all');
                    setReadFilter('all');
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Alert List */}
          <div className="notif-feed-container">
            {filteredList.length === 0 ? (
              <div className="empty-notif-state">
                <div className="empty-icon"><CheckCircle2 size={44} style={{ color: '#10b981' }} /></div>
                <h3>All Caught Up!</h3>
                <p>No notifications match the active filter criteria.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => resetToSeedNotifications()}
                >
                  <RefreshCw size={14} /> Reset Demo Notifications
                </button>
              </div>
            ) : (
              filteredList.map(n => {
                const isCritical = n.priority === 'critical';
                const isHigh = n.priority === 'high';

                return (
                  <div
                    key={n.id}
                    className={`notif-card-item ${!n.read ? 'unread' : 'read'} ${isCritical ? 'critical-border' : ''}`}
                    onClick={() => handleNavigateDeepLink(n)}
                  >
                    {/* Left Severity Indicator */}
                    <div className="card-severity-indicator">
                      {isCritical && <span className="alert-pulse red" />}
                      {isHigh && <span className="alert-pulse amber" />}
                      {!isCritical && !isHigh && <span className="alert-dot blue" />}
                    </div>

                    {/* Main Content */}
                    <div className="card-body-content">
                      <div className="card-top-row">
                        <div className="card-badge-row">
                          <span className={`priority-badge ${n.priority}`}>
                            {n.priority.toUpperCase()}
                          </span>
                          <span className="module-pill">{n.module}</span>
                          <span className="record-ref-code">{n.recordRef}</span>
                          {n.occurrences > 1 && (
                            <span className="badge-consolidated">
                              {n.occurrences}x consolidated
                            </span>
                          )}
                        </div>

                        <div className="card-timestamp">
                          <Clock size={12} />
                          <span>{formatTimeAgo(n.timestamp)}</span>
                        </div>
                      </div>

                      <div className="card-title-text">{n.title}</div>
                      <div className="card-desc-text">{n.desc}</div>

                      <div className="card-meta-footer">
                        <div className="meta-entities">
                          <span className="meta-tag project">🎯 {n.projectName}</span>
                          <span className="meta-tag centre">🏢 {n.centreName}</span>
                          <span className="meta-tag actor">👤 {n.actor}</span>
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="card-actions" onClick={e => e.stopPropagation()}>
                          <button
                            className="action-btn link-btn"
                            title="Open related module"
                            onClick={() => handleNavigateDeepLink(n)}
                          >
                            <span>Open Module</span>
                            <ArrowUpRight size={14} />
                          </button>

                          <button
                            className="action-btn inspect-btn"
                            title="Inspect Payload"
                            onClick={() => setSelectedNotif(n)}
                          >
                            <FileCode2 size={14} />
                          </button>

                          {n.read ? (
                            <button
                              className="action-btn toggle-read-btn"
                              title="Mark as unread"
                              onClick={(e) => handleMarkUnread(n.id, e)}
                            >
                              <Clock size={14} />
                            </button>
                          ) : (
                            <button
                              className="action-btn toggle-read-btn"
                              title="Mark as read"
                              onClick={(e) => handleMarkRead(n.id, e)}
                            >
                              <Check size={14} />
                            </button>
                          )}

                          <button
                            className="action-btn delete-btn"
                            title="Dismiss"
                            onClick={(e) => handleDelete(n.id, e)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: RULES ENGINE ── */}
      {activeTab === 'rules' && (
        <div className="notif-tab-content">
          <div className="rules-intro-card">
            <div>
              <h3>Automated Notification Trigger Rules</h3>
              <p>
                Rules configured to fire instant alerts upon operational milestone updates or compliance anomalies across all 6 roles.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSimulationModalOpen(true)}>
              <Zap size={14} /> Test All Rules
            </button>
          </div>

          <div className="rules-grid">
            {NOTIFICATION_TRIGGER_RULES.map(rule => (
              <div key={rule.id} className="rule-card">
                <div className="rule-card-header">
                  <div>
                    <span className={`priority-badge ${rule.priority}`}>{rule.priority}</span>
                    <span className="rule-code">{rule.code}</span>
                  </div>
                  <span className="rule-module-tag">{rule.module}</span>
                </div>

                <div className="rule-name">{rule.name}</div>
                <div className="rule-desc">{rule.desc}</div>

                <div className="rule-condition-box">
                  <div className="condition-label">Condition:</div>
                  <code>{rule.condition}</code>
                </div>

                <div className="rule-footer">
                  <div className="rule-recipients">
                    <span className="subtle-lbl">Dispatched To:</span>
                    <div className="roles-pill-row">
                      {rule.recipients.map(r => (
                        <span key={r} className="role-chip">{r}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm simulate-btn"
                    onClick={() => handleSimulateTrigger(rule)}
                  >
                    <Send size={13} />
                    <span>Fire Rule</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: AUDIT & DISPATCH LOG ── */}
      {activeTab === 'audit' && (
        <div className="notif-tab-content">
          <div className="audit-table-card">
            <div className="audit-table-header">
              <h3>Notification Dispatch Trail (Immutable Record)</h3>
              <p>Chronological transmission log capturing trigger actors, recipient routing, and delivery channels.</p>
            </div>

            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Timestamp</th>
                    <th>Event Trigger</th>
                    <th>Module / Project</th>
                    <th>Actor</th>
                    <th>Channel</th>
                    <th>Recipient Roles</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map(n => (
                    <tr key={n.id}>
                      <td><code style={{ fontSize: '0.75rem', fontWeight: 600 }}>{n.id}</code></td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                        {new Date(n.timestamp).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{n.title}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{n.triggerEvent}</div>
                      </td>
                      <td>
                        <span className="module-pill">{n.module}</span>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.projectName}</div>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{n.actor}</td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                          {n.deliveryChannel || 'In-App'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {n.recipients?.map(r => (
                            <span key={r} className="role-chip" style={{ fontSize: '0.675rem' }}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${n.read ? 'read' : 'delivered'}`}>
                          {n.read ? 'READ' : 'DELIVERED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SIMULATE EVENT TRIGGER ── */}
      {simulationModalOpen && (
        <div className="notif-modal-backdrop" onClick={() => setSimulationModalOpen(false)}>
          <div className="notif-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={20} style={{ color: '#38bdf8' }} />
                <h3>Simulate Operational Event Trigger</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSimulationModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Select an operational rule below to fire a synthetic notification. It will validate RBAC routing, unread counts, and duplicate consolidation in real-time.
              </p>

              <div className="simulation-rule-list">
                {NOTIFICATION_TRIGGER_RULES.map(r => (
                  <div key={r.id} className="sim-rule-item">
                    <div className="sim-rule-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span className={`priority-badge ${r.priority}`}>{r.priority}</span>
                        <strong>{r.name}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSimulateTrigger(r)}
                    >
                      Fire Alert
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSimulationModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: INSPECT NOTIFICATION PAYLOAD ── */}
      {selectedNotif && (
        <div className="notif-modal-backdrop" onClick={() => setSelectedNotif(null)}>
          <div className="notif-modal-card payload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCode2 size={20} style={{ color: '#818cf8' }} />
                <h3>Notification Dispatch Payload</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedNotif(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="payload-field-grid">
                <div><strong>ID:</strong> {selectedNotif.id}</div>
                <div><strong>Event Code:</strong> {selectedNotif.triggerEvent}</div>
                <div><strong>Record Ref:</strong> {selectedNotif.recordRef}</div>
                <div><strong>Actor:</strong> {selectedNotif.actor}</div>
                <div><strong>Project:</strong> {selectedNotif.projectName} ({selectedNotif.projectId})</div>
                <div><strong>Centre:</strong> {selectedNotif.centreName} ({selectedNotif.centreId})</div>
                <div><strong>Timestamp:</strong> {selectedNotif.timestamp}</div>
                <div><strong>Priority:</strong> {selectedNotif.priority}</div>
                <div><strong>Status:</strong> {selectedNotif.deliveryStatus}</div>
                <div><strong>Deep Link:</strong> {selectedNotif.deepLink}</div>
              </div>

              <div style={{ marginTop: 16 }}>
                <strong>Raw JSON Payload:</strong>
                <pre className="json-box">
                  {JSON.stringify(selectedNotif, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  handleNavigateDeepLink(selectedNotif);
                  setSelectedNotif(null);
                }}
              >
                <span>Navigate to Deep Link</span>
                <ArrowUpRight size={14} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedNotif(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component Styles */}
      <style>{`
        .notif-page-root {
          padding: 24px;
          max-width: 1380px;
          margin: 0 auto;
        }

        .notif-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 8px;
          padding: 12px 18px;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
          z-index: 9999;
          animation: slideUp 0.25s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .notif-header-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 24px 28px;
          margin-bottom: 24px;
          gap: 20px;
          flex-wrap: wrap;
        }
        .notif-badge-role {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 0.725rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .pulsing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
        }
        .notif-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
        }
        .notif-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          max-width: 720px;
          margin: 0;
          line-height: 1.5;
        }
        .notif-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* KPI Cards */
        .notif-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .notif-kpi-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .notif-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(56, 189, 248, 0.3);
        }
        .kpi-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .kpi-val {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Tabs */
        .notif-tabs-nav {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border-default);
          margin-bottom: 20px;
        }
        .notif-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 10px 18px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
        }
        .notif-tab-btn:hover {
          color: var(--text-primary);
        }
        .notif-tab-btn.active {
          color: var(--brand-accent, #38bdf8);
          border-bottom-color: var(--brand-accent, #38bdf8);
        }
        .tab-pill {
          background: #ef4444;
          color: #fff;
          font-size: 0.675rem;
          padding: 2px 7px;
          border-radius: 999px;
          font-weight: 700;
        }

        /* Filter Card */
        .notif-filters-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 18px;
        }
        .filter-search-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 260px;
          max-width: 440px;
        }
        .search-ico {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .filter-search-box input {
          width: 100%;
          padding: 8px 32px 8px 36px;
          border-radius: 8px;
          border: 1px solid var(--border-default);
          background: var(--bg-subtle);
          color: var(--text-primary);
          font-size: 0.8125rem;
        }
        .clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .filter-dropdowns {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .filter-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .filter-group select {
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid var(--border-default);
          background: var(--bg-subtle);
          color: var(--text-primary);
          font-size: 0.775rem;
          cursor: pointer;
        }

        /* Notification Feed Items */
        .notif-feed-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .notif-card-item {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 16px 20px;
          display: flex;
          gap: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }
        .notif-card-item:hover {
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .notif-card-item.unread {
          background: rgba(30, 41, 59, 0.35);
          border-left: 3px solid var(--brand-accent, #38bdf8);
        }
        .notif-card-item.critical-border {
          border-left: 3px solid #ef4444;
        }

        .card-severity-indicator {
          padding-top: 4px;
        }
        .alert-pulse {
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          position: relative;
        }
        .alert-pulse.red {
          background: #ef4444;
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: pulseRed 2s infinite;
        }
        .alert-pulse.amber {
          background: #f59e0b;
          box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
          animation: pulseAmber 2s infinite;
        }
        .alert-dot.blue {
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #38bdf8;
        }
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pulseAmber {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }

        .card-body-content {
          flex: 1;
        }
        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .card-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .priority-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        .priority-badge.critical {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .priority-badge.high {
          background: rgba(249, 115, 22, 0.15);
          color: #f97316;
          border: 1px solid rgba(249, 115, 22, 0.3);
        }
        .priority-badge.normal {
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .module-pill {
          background: var(--bg-subtle);
          color: var(--text-muted);
          border: 1px solid var(--border-default);
          border-radius: 4px;
          padding: 2px 7px;
          font-size: 0.675rem;
          font-weight: 600;
        }
        .record-ref-code {
          font-family: monospace;
          font-size: 0.725rem;
          color: var(--text-muted);
        }
        .badge-consolidated {
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.675rem;
          font-weight: 600;
        }

        .card-timestamp {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.725rem;
          color: var(--text-muted);
        }
        .card-title-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .card-desc-text {
          font-size: 0.8125rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin-bottom: 12px;
        }

        .card-meta-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .meta-entities {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .meta-tag {
          font-size: 0.725rem;
          padding: 3px 8px;
          border-radius: 4px;
          background: var(--bg-subtle);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .action-btn {
          background: var(--bg-subtle);
          border: 1px solid var(--border-default);
          color: var(--text-muted);
          padding: 5px 9px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s ease;
        }
        .action-btn:hover {
          color: var(--text-primary);
          border-color: rgba(56, 189, 248, 0.4);
          background: rgba(56, 189, 248, 0.1);
        }
        .action-btn.link-btn {
          color: #38bdf8;
          font-weight: 600;
          background: rgba(56, 189, 248, 0.08);
          border-color: rgba(56, 189, 248, 0.25);
        }
        .action-btn.delete-btn:hover {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
        }

        .empty-notif-state {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 48px 24px;
          text-align: center;
        }
        .empty-icon {
          margin-bottom: 12px;
        }

        /* Rules Tab */
        .rules-intro-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .rules-intro-card h3 {
          margin: 0 0 4px 0;
          font-size: 1.05rem;
        }
        .rules-intro-card p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 16px;
        }
        .rule-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rule-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rule-code {
          font-family: monospace;
          font-size: 0.725rem;
          color: var(--text-muted);
          margin-left: 6px;
        }
        .rule-module-tag {
          font-size: 0.7rem;
          background: var(--bg-subtle);
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid var(--border-default);
        }
        .rule-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .rule-desc {
          font-size: 0.775rem;
          color: var(--text-muted);
          line-height: 1.45;
        }
        .rule-condition-box {
          background: var(--bg-subtle);
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 0.725rem;
        }
        .condition-label {
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 2px;
        }
        .rule-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--border-default);
          margin-top: auto;
        }
        .roles-pill-row {
          display: flex;
          gap: 4px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .role-chip {
          background: rgba(56, 189, 248, 0.1);
          color: #38bdf8;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: capitalize;
        }
        .subtle-lbl {
          font-size: 0.675rem;
          color: var(--text-muted);
        }

        /* Audit Table */
        .audit-table-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          overflow: hidden;
        }
        .audit-table-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-default);
        }
        .audit-table-header h3 {
          margin: 0 0 4px 0;
          font-size: 1.05rem;
        }
        .audit-table-header p {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .audit-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }
        .audit-table th {
          text-align: left;
          padding: 12px 16px;
          background: var(--bg-subtle);
          border-bottom: 1px solid var(--border-default);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .audit-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-default);
        }
        .status-pill {
          font-size: 0.675rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
        }
        .status-pill.delivered {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }
        .status-pill.read {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        /* Modals */
        .notif-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }
        .notif-modal-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        .payload-modal {
          max-width: 740px;
        }
        .modal-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 1.05rem;
        }
        .modal-close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
        }
        .modal-body {
          padding: 20px 24px;
        }
        .modal-footer {
          padding: 14px 24px;
          border-top: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .simulation-rule-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 50vh;
          overflow-y: auto;
        }
        .sim-rule-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--bg-subtle);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          gap: 14px;
        }

        .payload-field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          background: var(--bg-subtle);
          padding: 14px;
          border-radius: 8px;
          font-size: 0.8rem;
        }
        .json-box {
          background: #090d16;
          color: #38bdf8;
          padding: 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          overflow-x: auto;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
