import { useMemo, useState } from "react";
import { HeatmapCanvas } from "./HeatmapCanvas";

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;
const VIEWPORT_SEGMENTS = [
  { key: "desktop", label: "Desktop" },
  { key: "tablet", label: "Tablet" },
  { key: "mobile", label: "Mobile" }
];

const getViewportSegment = (click) => {
  const viewportWidth = Number(click?.viewportWidth);

  if (!Number.isFinite(viewportWidth)) return "desktop";
  if (viewportWidth < 768) return "mobile";
  if (viewportWidth < 1024) return "tablet";

  return "desktop";
};

export const HeatMapTab = ({
  heatmapClicks,
  selectedAsset,
  pageAssets,
  pageOptions,
  urlInput,
  setUrlInput,
  heatmapLoading
}) => {
  const [selectedSegment, setSelectedSegment] = useState("desktop");
  const segmentedClicks = useMemo(
    () => heatmapClicks.filter((click) => getViewportSegment(click) === selectedSegment),
    [heatmapClicks, selectedSegment]
  );
  const segmentCounts = useMemo(
    () => heatmapClicks.reduce(
      (counts, click) => {
        const segment = getViewportSegment(click);
        counts[segment] = (counts[segment] || 0) + 1;
        return counts;
      },
      { desktop: 0, tablet: 0, mobile: 0 }
    ),
    [heatmapClicks]
  );

  const selectedAssetForSegment = useMemo(() => {
    const segmentAsset = selectedAsset?.images?.[selectedSegment];
    return segmentAsset ? { ...selectedAsset, ...segmentAsset } : selectedAsset;
  }, [selectedAsset, selectedSegment]);

  return (
    <div className="dashboard-card">
      <div className="dashboard-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h3>Device heatmap</h3>
          <p className="muted">
            {segmentedClicks.length} of {heatmapClicks.length} clicks - {selectedAsset?.label || "Unknown page"}
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

      <div className="heatmap-segments" aria-label="Heatmap device segment">
        {VIEWPORT_SEGMENTS.map((segment) => (
          <button
            key={segment.key}
            type="button"
            className={`segment-button ${selectedSegment === segment.key ? "active" : ""}`}
            onClick={() => setSelectedSegment(segment.key)}
          >
            <span>{segment.label}</span>
            <strong>{segmentCounts[segment.key] || 0}</strong>
          </button>
        ))}
      </div>
      {heatmapLoading ? 
        <div>Loading heatmap...</div> : (
        <div className="heatmap-stage">
          <HeatmapCanvas asset={selectedAssetForSegment} clicks={segmentedClicks} />
        </div>
        )
      }
    </div>
  );
};
