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

export default KpiCard;
