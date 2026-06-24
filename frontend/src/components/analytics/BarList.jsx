export const BarList = ({ data = [], empty = "No data yet." }) => {
  const max = Math.max(...data.map((item) => item.value || 0), 1);

  if (!data.length) return <p className="muted">{empty}</p>;

  return (
    <div className="bar-list">
      {data.map((item) => (
        <div className="bar-row" key={`${item.label}-${item.value}`}>
          <div className="bar-label">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-track">
            <span style={{ width: `${Math.max(6, ((item.value || 0) / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};