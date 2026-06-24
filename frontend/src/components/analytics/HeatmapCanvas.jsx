import { useEffect, useState } from "react";

export const HeatmapCanvas = ({ asset, clicks }) => {
  const [error, setError] = useState(false);
  
  useEffect(() => {
    setError(false);
  }, [asset.src])

  if (error) {
    return <div className="empty-state">No screenshot available for this page.</div>;
  }

  return (
    <div className="heatmap-frame">
      <img
        className="heatmap-background"
        src={asset.src}
        alt={`${asset.label || "Page"} heatmap background`}
        style={{
          width: "100%",
          height: "auto"
        }}
        onError={() => setError(true)}
      />

      <div className="heatmap-overlay">
        {clicks.map((click, i) => (
          <span
            key={i}
            className="heatmap-dot"
            style={{
              position: "absolute",
              left: `${click.x * 100}%`,
              top: `${click.y * 100}%`,
              transform: "translate(-50%, -50%)"
            }}
          />
        ))}
      </div>
      {!clicks.length && (
        <div className="heatmap-empty">No clicks recorded for this device size.</div>
      )}
    </div>
  );
};
