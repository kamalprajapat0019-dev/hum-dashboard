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

export default EmptyState;
