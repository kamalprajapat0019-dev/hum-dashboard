import React from 'react';
import { X, Building2, Key, Clock, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { StatusBadge } from '@/components/common';

export function UserViewModal({
  user,
  onClose,
  ROLE_LABELS = {},
  ROLE_COLORS = {},
}) {
  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role] || '#2563eb';
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div className="card" style={{
        background: '#fff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 540,
        padding: 0,
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Modal Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: roleColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              {user.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                {user.name}
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {user.email}
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                User ID
              </div>
              <div style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: '#1e293b', marginTop: 2 }}>
                {user.id}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Account Status
              </div>
              <div style={{ marginTop: 2 }}>
                <StatusBadge status={user.status} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Assigned Role
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: roleColor, marginTop: 2 }}>
                {roleLabel}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Phone Number
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#1e293b', marginTop: 2 }}>
                {user.phoneNumber || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Created Date
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#1e293b', marginTop: 2 }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleString('en-GB') : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Last Active
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#1e293b', marginTop: 2 }}>
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : 'Never logged in'}
              </div>
            </div>
          </div>

          {/* Manager & Scope Details */}
          {user.manager && (
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.8125rem' }}>
              <strong>Delegated Reporting Manager:</strong> {user.manager.name} ({user.manager.role})
            </div>
          )}

          {user.scope && (
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Permitted Operational Scope:
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Projects: {Array.isArray(user.scope.projects) ? user.scope.projects.join(', ') : 'All Projects'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                Centres: {Array.isArray(user.scope.centres) ? user.scope.centres.join(', ') : 'All Venues'}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
