import { BarList } from "./BarList"

export const InsightsTab = ({
  summary,
  pagePath
}) => {
  return (
    <div className="analytics-grid">
      <div className="dashboard-card">
        <h3>Event mix</h3>
        <BarList data={summary?.eventBreakdown || []} />
      </div>
      <div className="dashboard-card">
        <h3>Conversion path</h3>
        <BarList data={summary?.funnel || []} />
      </div>
      <div className="dashboard-card">
        <h3>Top pages</h3>
        <BarList data={(summary?.topPages || []).map((page) => ({ label: pagePath(page.url), value: page.views }))} empty="No page views recorded." />
      </div>
      <div className="dashboard-card">
        <h3>Top CTAs</h3>
        <BarList data={(summary?.topCtas || []).map((cta) => ({ label: cta.label || "Untitled", value: cta.clicks }))} empty="No CTA clicks recorded." />
      </div>
      <div className="dashboard-card wide-card">
        <h3>Avg time by page</h3>
        <BarList data={(summary?.engagementByPage || []).map((page) => ({ label: pagePath(page.url), value: Math.round(page.avgTimeMs / 1000) }))} empty="No dwell-time samples yet." />
      </div>
    </div>
  )
}