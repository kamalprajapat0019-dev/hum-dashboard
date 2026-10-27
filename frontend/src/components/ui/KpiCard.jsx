import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as Icons from 'lucide-react';

/**
 * KPI Card component
 * Props: label, value, sub, icon (string), iconBg, trend, trendLabel, onClick
 */
export function KpiCard({
  label,
  value,
  sub,
  icon,
  iconBg = 'rgba(37, 99, 235, 0.12)',
  iconColor = 'var(--color-primary)',
  trend,
  trendLabel,
  onClick,
  variant,
  className = '',
  style
}) {
  const Icon = icon && Icons[icon] ? Icons[icon] : null;

  let TrendIcon = Minus;
  let trendClass = 'badge-neutral';
  if (trend === 'up')   { TrendIcon = TrendingUp;   trendClass = 'badge-up'; }
  if (trend === 'down') { TrendIcon = TrendingDown; trendClass = 'badge-down'; }

  // Resolve variant or infer from icon/label/iconColor
  let resolvedVariant = variant;
  if (!resolvedVariant) {
    const l = (label || '').toLowerCase();
    const ic = (iconColor || '').toLowerCase();
    const i = (icon || '').toLowerCase();

    if (l.includes('project') || ic.includes('1d4ed8') || ic.includes('1e40af') || i === 'briefcase') {
      resolvedVariant = 'blue';
    } else if (l.includes('centre') || l.includes('center') || ic.includes('0d9488') || ic.includes('16a34a') || i === 'building2') {
      resolvedVariant = 'teal';
    } else if (l.includes('user') || ic.includes('7c3aed') || ic.includes('purple') || i === 'users') {
      resolvedVariant = 'purple';
    } else if (l.includes('exception') || l.includes('critical') || ic.includes('dc2626') || ic.includes('red') || i === 'alerttriangle' || i === 'alertoctagon') {
      resolvedVariant = 'red';
    } else if (l.includes('approval') || l.includes('pending') || ic.includes('d97706') || ic.includes('orange') || i === 'checkcircle' || i === 'filetext') {
      resolvedVariant = 'orange';
    } else if (l.includes('security') || l.includes('audit') || ic.includes('2563eb') || i === 'shieldcheck' || i === 'clipboardcheck') {
      resolvedVariant = 'indigo';
    } else {
      resolvedVariant = 'blue';
    }
  }

  const variantClass = resolvedVariant ? `kpi-card--${resolvedVariant}` : '';

  return (
    <div
      className={`kpi-card ${variantClass} ${onClick ? 'kpi-card--clickable' : ''} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      <div className="kpi-card__header">
        <span className="kpi-card__label">{label}</span>
        {Icon && (
          <div className="kpi-card__icon" style={{ background: iconBg }}>
            <Icon size={18} color={iconColor} strokeWidth={2} />
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

export default KpiCard;
