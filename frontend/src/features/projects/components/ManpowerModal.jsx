import React from 'react';
import { X, Edit, Users } from 'lucide-react';

const MANPOWER_CATEGORIES_ORDER = [
  { key: 'invigilatorsRatio', label: 'Invigilators (per nodes)', type: 'ratio' },
  { key: 'centreManager', label: 'Centre Manager (per venue)', type: 'fixed' },
  { key: 'networkAdmin', label: 'Network Admin / IT Support (per venue)', type: 'fixed' },
  { key: 'bodycamOperator', label: 'Bodycam Operator (per venue)', type: 'fixed' },
  { key: 'biometricOperatorRatio', label: 'Biometric Operator (per nodes)', type: 'ratio' },
  { key: 'securityMaleRatio', label: 'Security Male (per nodes)', type: 'ratio' },
  { key: 'securityFemaleRatio', label: 'Security Female (per nodes)', type: 'ratio' },
  { key: 'supportStaff', label: 'Support Staff (per venue)', type: 'fixed' },
  { key: 'electrician', label: 'Electrician (per venue)', type: 'fixed' },
  { key: 'cctvOperator', label: 'CCTV Operator (per venue)', type: 'fixed' },
  { key: 'serverManagerRatio', label: 'Server Manager (per nodes)', type: 'ratio' },
  { key: 'seniorCentreManager', label: 'Senior Centre Manager (per venue)', type: 'fixed' },
  { key: 'registrationDeskManagerRatio', label: 'Registration Desk Manager (per nodes)', type: 'ratio' },
  { key: 'cleaningStaff', label: 'Cleaning / Sanitation Staff (per venue)', type: 'fixed' },
];

export function ManpowerModal({
  isOpen,
  onClose,
  viewingManpowerExam,
  onOpenEditExam,
  parseExamMeta,
}) {
  if (!isOpen || !viewingManpowerExam) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={20} color="var(--color-primary)" />
            <div>
              <h3 className="modal-title">Manpower Configuration</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {viewingManpowerExam.examName} · {viewingManpowerExam.examType?.project?.name || viewingManpowerExam.project?.name || 'Project'}
              </p>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: 4 }} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(() => {
            const meta = parseExamMeta(viewingManpowerExam);
            const mp = meta.manpower || {};

            return (
              <div className="grid-2" style={{ gap: 10 }}>
                {MANPOWER_CATEGORIES_ORDER.map((cat, idx) => {
                  const val = mp[cat.key];
                  const isRatio = cat.type === 'ratio';

                  return (
                    <div
                      key={cat.key}
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {idx + 1}. {cat.label}
                      </span>
                      {isRatio ? (
                        <span
                          className={val ? 'badge badge-purple' : 'badge badge-outline'}
                          style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                        >
                          {val ? `${val} (1 per ${val.split(':')[1] || ''} nodes)` : 'Not Configured'}
                        </span>
                      ) : (
                        <span
                          className={val && val !== 'none' ? 'badge badge-info' : 'badge badge-outline'}
                          style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                        >
                          {val && val !== 'none' ? `${val} per venue` : 'None (NULL)'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { onClose(); onOpenEditExam(viewingManpowerExam); }}
          >
            <Edit size={13} /> Edit Manpower
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
