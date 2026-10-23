// ── Notification Service (Phase 7: Notification Engine & RBAC Dispatcher) ──────────

const STORAGE_KEY = 'oem_notifications_v1';
const RULES_STORAGE_KEY = 'oem_notification_rules_v1';

// Seed Notifications aligned with FRD/SRS requirements
const INITIAL_NOTIFICATIONS = [
  {
    id: 'NTF-101',
    triggerEvent: 'SCAN_DUPLICATE_MAC',
    projectId: 'PRJ-001',
    projectName: 'NEET UG 2026',
    centreId: 'TC-101',
    centreName: 'Lotus Computer Education, Jaipur',
    module: 'Audit',
    recordRef: 'SCAN-8821',
    actionType: 'TRIGGERED',
    actor: 'Network Scanner Daemon',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    priority: 'critical',
    title: 'Duplicate MAC Address Detected',
    desc: 'Automated technical scan detected 3 systems sharing identical MAC 00:1A:2B:3C:4D:5E. Immediate inspection mandatory.',
    deepLink: '/auditor/scan',
    recipients: ['admin', 'pm', 'auditor', 'operations'],
    read: false,
    readAt: null,
    deliveryStatus: 'DELIVERED',
    deliveryChannel: 'In-App + High-Priority Alert'
  },
  {
    id: 'NTF-102',
    triggerEvent: 'LOCKED_ALLOCATION_CHANGE',
    projectId: 'PRJ-002',
    projectName: 'JEE Mains 2027',
    centreId: 'TC-104',
    centreName: 'St. Xavier Tech Institute, Delhi',
    module: 'Allocation',
    recordRef: 'ALC-DEL-04',
    actionType: 'REQUESTED',
    actor: 'Sneha Patel (Ops Executive)',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    priority: 'high',
    title: 'Locked Allocation Change Requested',
    desc: 'Post-lock modification requested: 12 candidate buffer reduction for Shift 2. Justification submitted for PM approval.',
    deepLink: '/pm/allocation',
    recipients: ['admin', 'pm', 'operations'],
    read: false,
    readAt: null,
    deliveryStatus: 'DELIVERED',
    deliveryChannel: 'In-App'
  },
  {
    id: 'NTF-103',
    triggerEvent: 'BOOKING_CONFLICT',
    projectId: 'PRJ-003',
    projectName: 'CUET PG 2026',
    centreId: 'TC-108',
    centreName: 'Pioneer Academy, Kolkata',
    module: 'Booking',
    recordRef: 'BK-KOL-19',
    actionType: 'TRIGGERED',
    actor: 'System Conflict Engine',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    priority: 'critical',
    title: 'Concurrent Booking Overlap Alert',
    desc: 'Centre booked for CUET PG on 14-May-2026 overlaps with pre-existing booking reservation for State CET.',
    deepLink: '/ops/booking',
    recipients: ['admin', 'pm', 'operations'],
    read: false,
    readAt: null,
    deliveryStatus: 'DELIVERED',
    deliveryChannel: 'In-App + Alert Banner'
  },
  {
    id: 'NTF-104',
    triggerEvent: 'FAILED_MOCK',
    projectId: 'PRJ-002',
    projectName: 'JEE Mains 2027',
    centreId: 'TC-112',
    centreName: 'Sunrise IT Academy, Lucknow',
    module: 'Mock',
    recordRef: 'MCK-LKO-02',
    actionType: 'ESCALATED',
    actor: 'Amit Verma (IT Auditor)',
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    priority: 'high',
    title: 'Mock Examination Status Marked Failed',
    desc: 'Uninterruptible Power Supply (UPS) cutover failed during simulated 30-min blackout test. Rework order issued.',
    deepLink: '/auditor/mock',
    recipients: ['admin', 'pm', 'auditor'],
    read: true,
    readAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    deliveryStatus: 'READ',
    deliveryChannel: 'In-App'
  },
  {
    id: 'NTF-105',
    triggerEvent: 'DOC_REWORK',
    projectId: 'PRJ-001',
    projectName: 'NEET UG 2026',
    centreId: 'TC-115',
    centreName: 'Tech Valley Institute, Pune',
    module: 'Document',
    recordRef: 'DOC-MOU-09',
    actionType: 'REJECTED',
    actor: 'Priya Sharma (Ops Lead)',
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    priority: 'normal',
    title: 'MOU & Undertaking Sent for Rework',
    desc: 'Rejection reason: Missing official notary stamp and signature on Annexure-B. Target re-upload date: 28 Oct 2026.',
    deepLink: '/ops/documents',
    recipients: ['admin', 'operations', 'centre'],
    read: true,
    readAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    deliveryStatus: 'READ',
    deliveryChannel: 'In-App'
  },
  {
    id: 'NTF-106',
    triggerEvent: 'CRITICAL_INCIDENT',
    projectId: 'PRJ-001',
    projectName: 'NEET UG 2026',
    centreId: 'TC-120',
    centreName: 'Apex Engineering Institute, Bhopal',
    module: 'Incident',
    recordRef: 'INC-BPL-77',
    actionType: 'ESCALATED',
    actor: 'Exam Control Room',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    priority: 'critical',
    title: 'Core Switch Fiber Link Drop',
    desc: 'Lab-4 uplink fiber connection severed. Field IT dispatched. 35-minute SLA timer active.',
    deepLink: '/ops/incidents',
    recipients: ['admin', 'pm', 'auditor', 'operations'],
    read: false,
    readAt: null,
    deliveryStatus: 'DELIVERED',
    deliveryChannel: 'In-App + Emergency SMS'
  },
  {
    id: 'NTF-107',
    triggerEvent: 'COMMERCIAL_RATE_DISCREPANCY',
    projectId: 'PRJ-003',
    projectName: 'CUET PG 2026',
    centreId: 'TC-108',
    centreName: 'Pioneer Academy, Kolkata',
    module: 'Commercial',
    recordRef: 'CST-KOL-01',
    actionType: 'TRIGGERED',
    actor: 'Finance Audit Engine',
    timestamp: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    priority: 'high',
    title: 'Cost Sheet Deviation Detected',
    desc: 'Agreed commercial node rate of ₹380 exceeds sanctioned client benchmark of ₹350 by 8.5%. Approval required.',
    deepLink: '/finance/cost',
    recipients: ['admin', 'finance'],
    read: false,
    readAt: null,
    deliveryStatus: 'DELIVERED',
    deliveryChannel: 'In-App'
  },
  {
    id: 'NTF-108',
    triggerEvent: 'INVOICE_SUBMITTED',
    projectId: 'PRJ-001',
    projectName: 'NEET UG 2026',
    centreId: 'TC-101',
    centreName: 'Lotus Computer Education, Jaipur',
    module: 'Finance',
    recordRef: 'INV-2026-904',
    actionType: 'SUBMITTED',
    actor: 'Centre Accountant',
    timestamp: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    priority: 'normal',
    title: 'Final Examination Tax Invoice Submitted',
    desc: 'Tax invoice submitted for ₹4,92,400 along with candidate attendance sheet. Pending Finance verification.',
    deepLink: '/finance/invoices',
    recipients: ['admin', 'finance', 'centre'],
    read: true,
    readAt: new Date(Date.now() - 450 * 60 * 1000).toISOString(),
    deliveryStatus: 'READ',
    deliveryChannel: 'In-App'
  }
];

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
