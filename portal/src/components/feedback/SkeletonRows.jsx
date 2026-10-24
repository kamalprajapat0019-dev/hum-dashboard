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

export default SkeletonRows;
