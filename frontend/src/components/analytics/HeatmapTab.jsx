import { HeatmapCanvas } from "./HeatmapCanvas";

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

export const HeatMapTab = ({
  heatmapClicks,
  selectedAsset,
  pageAssets,
  pageOptions,
  urlInput,
  setUrlInput,
}) => {
  return(
    <div className="dashboard-card">
      <div className="dashboard-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h3>Container heatmap</h3>
          <p className="muted">
            {heatmapClicks.length} clicks · {selectedAsset?.label || "Unknown page"}
          </p>            
        </div>
        <div className="url-form">
          <select
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          >
            {pageOptions.map((path) => (
              <option
                key={path}
                value={`${FRONTEND_URL}${path}`}
              >
                {pageAssets[path]?.label || path}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="heatmap-stage">
        <HeatmapCanvas asset={selectedAsset} clicks={heatmapClicks} />
      </div>
    </div>
  )
}