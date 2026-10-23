import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * KPI Card component
 * Props: label, value, sub, icon (string), iconBg, trend, trendLabel, onClick
 */
export function KpiCard({ label, value, sub, icon, iconBg = '#eff6ff', iconColor = '#1e40af', trend, trendLabel, onClick }) {
  const Icon = icon && Icons[icon] ? Icons[icon] : null;

  let TrendIcon = Minus;
  let trendClass = 'badge-neutral';
  if (trend === 'up')   { TrendIcon = TrendingUp;   trendClass = 'badge-up'; }
  if (trend === 'down') { TrendIcon = TrendingDown; trendClass = 'badge-down'; }

  return (
    <div
      className={`kpi-card ${onClick ? 'kpi-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="kpi-card__header">
        <span className="kpi-card__label">{label}</span>
        {Icon && (
          <div className="kpi-card__icon" style={{ background: iconBg }}>
            <Icon size={16} color={iconColor} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="kpi-card__value">{value}</div>
      {(sub || trendLabel) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {sub && <div className="kpi-card__sub">{sub}</div>}
          {trendLabel && trend && (
            <span className={`kpi-card__badge badge ${trendClass}`}>
              <TrendIcon size={10} />
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Status Badge
 */
const STATUS_MAP = {
  Active:        'badge-success',
  Approved:      'badge-success',
  Passed:        'badge-success',
  Accepted:      'badge-success',
  Paid:          'badge-success',
  Eligible:      'badge-success',
  Confirmed:     'badge-success',
  Completed:     'badge-success',
  OnTrack:       'badge-success',

  Pending:       'badge-warning',
  Draft:         'badge-warning',
  'Under Review':'badge-warning',
  'In Progress': 'badge-warning',
  AtRisk:        'badge-warning',
  Discussed:     'badge-warning',

  Rejected:      'badge-danger',
  Failed:        'badge-danger',
  Blacklisted:   'badge-danger',
  Delayed:       'badge-danger',
  Critical:      'badge-danger',

  Closed:        'badge-neutral',
  Inactive:      'badge-neutral',
  'N/A':         'badge-neutral',
  'Not Conducted':'badge-neutral',

  'Re-audit Required': 'badge-warning',
  'Audit Passed': 'badge-success',
};

export function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'badge-neutral';
  return <span className={`badge ${cls}`}>{status}</span>;
}

/**
 * Progress Ring
 */
export function ProgressRing({ value, max, size = 56, strokeWidth = 5, color = '#1e40af' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, (value / max) * 100);
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-default)" strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

/**
 * Section Header
 */
export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h3 className="section-title" style={{ margin: 0 }}>{title}</h3>
      {action}
    </div>
  );
}

/**
 * Empty State
 */
export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={40} strokeWidth={1} />}
      <div className="empty-state__title">{title}</div>
      {desc && <div className="empty-state__desc">{desc}</div>}
      {action}
    </div>
  );
}

/**
 * Loading Skeleton rows
 */
export function SkeletonRows({ rows = 4, cols = 4 }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="skeleton"
              style={{ height: 14, flex: j === 0 ? 2 : 1, borderRadius: 4 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Page Last Updated timestamp
 */
export function LastUpdated({ ts }) {
  const d = ts ? new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
      Last updated: {d}
    </span>
  );
}
