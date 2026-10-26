import { Wrench } from 'lucide-react';

export default function ComingSoon({ title = 'Coming Soon', desc = 'This module is under development. It will be available in the next phase.' }) {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">{title}</h1>
      </div>
      <div className="card">
        <div className="empty-state" style={{ padding: '64px 24px' }}>
          <Wrench size={48} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
          <div className="empty-state__title">{title}</div>
          <div className="empty-state__desc">{desc}</div>
        </div>
      </div>
    </div>
  );
}
