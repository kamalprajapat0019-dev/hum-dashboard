import React from 'react';

export function HistoryTab({ history }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 700 }}>Centre Audit & Activity Trail</h3>
      {!history || history.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
          No recent audit history recorded for this centre.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((log) => (
            <div
              key={log.id}
              style={{
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{log.action}</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: 2 }}>
                  by <strong>{log.user?.name || log.userEmail || 'System'}</strong> ({log.user?.role || 'SYSTEM'})
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
