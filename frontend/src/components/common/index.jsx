/**
 * Common components bridge (Backward compatibility & shared primitives)
 */
export { KpiCard } from '../ui/KpiCard';
export { StatusBadge } from '../ui/StatusBadge';
export { ProgressRing } from '../ui/ProgressRing';
export { EmptyState } from '../feedback/EmptyState';
export { SkeletonRows } from '../feedback/SkeletonRows';
export { ErrorBoundary } from '../feedback/ErrorBoundary';

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
 * Page Last Updated timestamp
 */
export function LastUpdated({ ts }) {
  const d = ts
    ? new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
      Last updated: {d}
    </span>
  );
}
