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

export default StatusBadge;
