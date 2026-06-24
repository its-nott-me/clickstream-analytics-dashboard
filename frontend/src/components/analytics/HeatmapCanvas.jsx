export const HeatmapCanvas = ({ asset, clicks }) => {
  return (
    <div className="heatmap-frame">
      <img
        className="heatmap-background"
        src={asset.src}
        style={{
          width: "100%",
          height: "auto"
        }}
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
    </div>
  );
};