import React from 'react';
import { Building2, X, Layers, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/common';

export function ClientViewModal({
  isOpen,
  onClose,
  selectedClient,
  loading,
}) {
  if (!isOpen || !selectedClient) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={22} color="var(--color-primary)" />
            <div>
              <h3 className="modal-title">{selectedClient.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  background: 'rgba(30, 64, 175, 0.1)',
                  color: 'var(--color-primary)',
                  padding: '2px 6px',
                  borderRadius: 4
                }}>
                  {selectedClient.code || selectedClient.id}
                </span>
                <StatusBadge status={selectedClient.status || 'Active'} />
              </div>
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={onClose}
            style={{ padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Client Master Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Representative Name</div>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{selectedClient.fullName || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official Email ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8125rem', marginTop: 2 }}>
                {selectedClient.contactEmail || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registration Date</div>
              <div style={{ marginTop: 2, fontSize: '0.8125rem' }}>
                {selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleDateString('en-IN') : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Associated Examination Projects</div>
              <div style={{ marginTop: 2, fontWeight: 700, color: 'var(--color-primary)' }}>
                {selectedClient.totalExams ?? (selectedClient.projects?.length || 0)} Total ({selectedClient.activeExams ?? 0} Active)
              </div>
            </div>
          </div>

          {/* Contextual Associated Projects Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={15} color="var(--color-primary)" />
                Associated Examination Projects (Read-Only Context)
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Managed in Project Management module
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto 6px', display: 'block' }} />
                Loading associated examination drives...
              </div>
            ) : !selectedClient.projects || selectedClient.projects.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 6,
                border: '1px dashed rgba(255,255,255,0.1)',
                color: 'var(--text-muted)',
                fontSize: '0.8125rem'
              }}>
                No examination projects have been created for this client yet.
              </div>
            ) : (
              <div className="table-wrapper" style={{ maxHeight: 240, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Project Code</th>
                      <th>Project Title</th>
                      <th>Stage</th>
                      <th>Target Candidates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClient.projects.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                            {p.projectCode}
                          </span>
                        </td>
                        <td>{p.name}</td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                            {p.stage}
                          </span>
                        </td>
                        <td>{p.candidateTarget ? Number(p.candidateTarget).toLocaleString('en-IN') : '—'}</td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Client ID: <code style={{ color: 'var(--color-primary)' }}>{selectedClient.code || selectedClient.id}</code>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
