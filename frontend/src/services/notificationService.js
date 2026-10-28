// ── Notification Service (Phase 7: Notification Engine & RBAC Dispatcher) ──────────

const STORAGE_KEY = 'oem_notifications_v1';
const RULES_STORAGE_KEY = 'oem_notification_rules_v1';

// Notifications initialized empty per Data Integrity policy (zero fake notifications)
const INITIAL_NOTIFICATIONS = [];


export const NOTIFICATION_TRIGGER_RULES = [
  {
    id: 'RULE-01',
    code: 'SCAN_DUPLICATE_MAC',
    name: 'Duplicate MAC Address Detection',
    module: 'Compliance',
    priority: 'critical',
    recipients: ['admin', 'pm', 'auditor', 'operations'],
    immediateDelivery: true,
    channels: ['In-App', 'High-Priority Alert Banner'],
    desc: 'Triggers instantaneous alert to Technical Lead and PM when duplicate hardware MAC addresses are identified at any examination lab.',
    condition: 'Count of identical MACs > 1 on same subnet'
  },
  {
    id: 'RULE-02',
    code: 'BOOKING_CONFLICT',
    name: 'Booking Date & Venue Overlap',
    module: 'Operations',
    priority: 'critical',
    recipients: ['admin', 'pm', 'operations'],
    immediateDelivery: true,
    channels: ['In-App', 'Banner'],
    desc: 'Fired when a centre is invited or allocated to overlapping shifts across divergent client examinations.',
    condition: 'Overlap of dates >= 1 with prior confirmed booking'
  },
  {
    id: 'RULE-03',
    code: 'LOCKED_ALLOCATION_CHANGE',
    name: 'Post-Lock Candidate Allocation Modification',
    module: 'Execution',
    priority: 'high',
    recipients: ['admin', 'pm', 'operations'],
    immediateDelivery: true,
    channels: ['In-App'],
    desc: 'Alerts Project Manager when an operations executive attempts to alter candidate nodes after formal allocation lock.',
    condition: 'Allocation status == LOCKED and Delta nodes != 0'
  },
  {
    id: 'RULE-04',
    code: 'FAILED_MOCK',
    name: 'Simulated Mock Test Failure',
    module: 'Compliance',
    priority: 'high',
    recipients: ['admin', 'pm', 'auditor'],
    immediateDelivery: true,
    channels: ['In-App'],
    desc: 'Escalates failure findings with mandatory technician notes when rehearsal/mock test fails compliance benchmarks.',
    condition: 'Mock test status == FAILED'
  },
  {
    id: 'RULE-05',
    code: 'ELIGIBILITY_RESTRICTION',
    name: 'Centre Blacklist / Suspension Flag',
    module: 'Core Operations',
    priority: 'critical',
    recipients: ['admin', 'pm'],
    immediateDelivery: true,
    channels: ['In-App', 'Restricted Feed'],
    desc: 'Confidential alert dispatched solely to Admin & PM whenever a test venue is flagged for legal or integrity infringement.',
    condition: 'Centre eligibility marked BLACKLISTED'
  },
  {
    id: 'RULE-06',
    code: 'READINESS_BLOCKER',
    name: 'Exam-Day Infrastructure Readiness Blocker',
    module: 'Execution',
    priority: 'critical',
    recipients: ['admin', 'pm', 'operations', 'auditor'],
    immediateDelivery: true,
    channels: ['In-App', 'Emergency Push'],
    desc: 'Dispatches emergency alert if generator power cutover, CCTV feeds, or jammer checks fail 4 hours prior to exam roll-out.',
    condition: 'Readiness checklist item marked NON_COMPLIANT'
  },
  {
    id: 'RULE-07',
    code: 'CRITICAL_INCIDENT',
    name: 'Live Examination Incident Escalation',
    module: 'Execution',
    priority: 'critical',
    recipients: ['admin', 'pm', 'auditor', 'operations'],
    immediateDelivery: true,
    channels: ['In-App', 'SMS'],
    desc: 'Activates SLA countdown timer for Priority-1 operational disturbances during live candidate sessions.',
    condition: 'Incident severity == CRITICAL'
  },
  {
    id: 'RULE-08',
    code: 'COMMERCIAL_RATE_DISCREPANCY',
    name: 'Cost Sheet Rate Benchmark Deviation',
    module: 'Finance',
    priority: 'high',
    recipients: ['admin', 'finance'],
    immediateDelivery: false,
    channels: ['In-App'],
    desc: 'Alerts finance controllers if negotiated venue payout deviates beyond allowable client threshold.',
    condition: 'Node rate > Client sanctioned benchmark'
  }
];

// In-memory subscribers for real-time reactive updates
const listeners = new Set();

function emitChange() {
  const all = getStoredNotifications();
  listeners.forEach(fn => {
    try {
      fn(all);
    } catch (e) {
      console.error('Notification listener error:', e);
    }
  });
}

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read notifications from localStorage', e);
    return INITIAL_NOTIFICATIONS;
  }
}

function saveNotifications(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    emitChange();
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

// ── RBAC Scope Filter ─────────────────────────────────────────────────────────
// Rule:
// Internal Notifications -> Admin, PM, Auditor, Ops Exec ONLY
// Accounts/Finance & Centre User -> workflow-specific notifications only
export function filterNotificationsByRole(notifications, userRole) {
  if (!userRole) return [];
  const role = userRole.toLowerCase();

  return notifications.filter(n => {
    if (!n.recipients || !Array.isArray(n.recipients)) return true;
    return n.recipients.map(r => r.toLowerCase()).includes(role);
  });
}

// ── Public Service API ────────────────────────────────────────────────────────

export function getAllNotifications(userRole) {
  const all = getStoredNotifications();
  if (!userRole) return all;
  return filterNotificationsByRole(all, userRole);
}

export function getUnreadCount(userRole) {
  const list = getAllNotifications(userRole);
  return list.filter(n => !n.read).length;
}

export function markAsRead(id) {
  const all = getStoredNotifications();
  const updated = all.map(n => {
    if (n.id === id) {
      return { ...n, read: true, readAt: new Date().toISOString(), deliveryStatus: 'READ' };
    }
    return n;
  });
  saveNotifications(updated);
}

export function markAsUnread(id) {
  const all = getStoredNotifications();
  const updated = all.map(n => {
    if (n.id === id) {
      return { ...n, read: false, readAt: null, deliveryStatus: 'DELIVERED' };
    }
    return n;
  });
  saveNotifications(updated);
}

export function markAllAsRead(userRole) {
  const all = getStoredNotifications();
  const role = userRole ? userRole.toLowerCase() : null;

  const updated = all.map(n => {
    if (!role || (n.recipients && n.recipients.map(r => r.toLowerCase()).includes(role))) {
      return { ...n, read: true, readAt: new Date().toISOString(), deliveryStatus: 'READ' };
    }
    return n;
  });
  saveNotifications(updated);
}

export function deleteNotification(id) {
  const all = getStoredNotifications();
  const updated = all.filter(n => n.id !== id);
  saveNotifications(updated);
}

export function clearAllNotifications(userRole) {
  const all = getStoredNotifications();
  const role = userRole ? userRole.toLowerCase() : null;
  if (!role) {
    saveNotifications([]);
    return;
  }
  const updated = all.filter(n => !n.recipients || !n.recipients.map(r => r.toLowerCase()).includes(role));
  saveNotifications(updated);
}

// ── Duplicate Consolidation Engine ───────────────────────────────────────────
// If same trigger event for same project + centre arrives within 60 mins, consolidate!
export function dispatchNotification(payload) {
  const all = getStoredNotifications();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  const existingIdx = all.findIndex(n =>
    n.triggerEvent === payload.triggerEvent &&
    n.projectId === payload.projectId &&
    n.centreId === payload.centreId &&
    (now - new Date(n.timestamp).getTime()) < ONE_HOUR
  );

  if (existingIdx !== -1) {
    // Consolidate duplicate into existing record
    const existing = all[existingIdx];
    const occurrences = (existing.occurrences || 1) + 1;
    const consolidated = {
      ...existing,
      occurrences,
      title: `${payload.title} (${occurrences}x detected)`,
      desc: payload.desc,
      timestamp: new Date().toISOString(),
      read: false,
      deliveryStatus: 'DELIVERED',
      actionType: 'UPDATED'
    };

    all.splice(existingIdx, 1);
    all.unshift(consolidated);
    saveNotifications(all);
    return consolidated;
  }

  // New notification
  const newNotif = {
    id: `NTF-${Date.now().toString().slice(-4)}`,
    triggerEvent: payload.triggerEvent || 'MANUAL_TRIGGER',
    projectId: payload.projectId || 'PRJ-001',
    projectName: payload.projectName || 'General Examination',
    centreId: payload.centreId || 'TC-GEN',
    centreName: payload.centreName || 'Designated Centre',
    module: payload.module || 'Operations',
    recordRef: payload.recordRef || 'REC-AUTO',
    actionType: payload.actionType || 'TRIGGERED',
    actor: payload.actor || 'System Dispatcher',
    timestamp: new Date().toISOString(),
    priority: payload.priority || 'normal',
    title: payload.title || 'System Notification',
    desc: payload.desc || 'Notification details recorded.',
    deepLink: payload.deepLink || '/admin',
    recipients: payload.recipients || ['admin', 'pm', 'auditor', 'operations'],
    read: false,
    readAt: null,
    deliveryStatus: 'DELIVERED',
    deliveryChannel: payload.deliveryChannel || 'In-App',
    occurrences: 1
  };

  all.unshift(newNotif);
  saveNotifications(all);
  return newNotif;
}

export function subscribeNotifications(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function resetToSeedNotifications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
  emitChange();
}
