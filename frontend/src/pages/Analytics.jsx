import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/analytics.css";
import "../styles/components/table.css";

const API_URL = import.meta.env.VITE_API_URL;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

const formatDuration = (ms = 0) => {
  if (!ms) return "0s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const pagePath = (url = "") => {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url || "/";
  }
};

const BarList = ({ data = [], empty = "No data yet." }) => {
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

const HeatmapCanvas = ({ asset, clicks }) => {
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

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("sessions");
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [urlInput, setUrlInput] = useState(FRONTEND_URL + "/");
  const [heatmapClicks, setHeatmapClicks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageAssets, setPageAssets] = useState({});

  const selectedSession = useMemo(
    () => sessions.find((session) => session.sessionId === selectedSessionId),
    [sessions, selectedSessionId]
  );

  const sessionSummary = useMemo(() => {
    if (!sessionEvents.length) return null;

    const pageViews = sessionEvents.filter(
      e => e.eventType === "page_view"
    );

    const clicks = sessionEvents.filter(
      e => e.eventType === "click"
    );

    const ctas = sessionEvents.filter(
      e => e.eventType === "cta_click"
    );

    const timeSpent = sessionEvents
      .filter(e => e.eventType === "time_spent")
      .reduce(
        (sum, e) => sum + (e.metadata?.durationMs || 0),
        0
      );

    return {
      pageViews: pageViews.length,
      clicks: clicks.length,
      ctas: ctas.length,
      timeSpent
    };
  }, [sessionEvents]);

  const journeyPath = useMemo(() => {
    const pages = sessionEvents
      .filter(e => e.eventType === "page_view")
      .map(e => pagePath(e.url));

    return pages.filter(
      (page, index) => page !== pages[index - 1]
    );
  }, [sessionEvents]);

  const pageStats = useMemo(() => {
    const stats = {};

    sessionEvents.forEach(event => {
      const page = pagePath(event.url);

      if (!stats[page]) {
        stats[page] = {
          page,
          views: 0,
          clicks: 0,
          ctas: 0
        };
      }

      if (event.eventType === "page_view") {
        stats[page].views += 1;
      }

      if (event.eventType === "click") {
        stats[page].clicks += 1;
      }

      if (event.eventType === "cta_click") {
        stats[page].ctas += 1;
      }
    });

    return Object.values(stats);
  }, [sessionEvents]);

  const getPageAsset = (url = "") => {
    const path = pagePath(url);
    return pageAssets[path] || pageAssets?.["/"] || null;
  }
  const selectedAsset = getPageAsset(urlInput);
  
  const refreshOverview = async () => {
    setError("");
    try {
      const [summaryRes, sessionsRes] = await Promise.all([
        axios.get(`${API_URL}/events/summary`),
        axios.get(`${API_URL}/sessions`)
      ]);
      setSummary(summaryRes.data.data);
      setSessions(sessionsRes.data.data);
    } catch {
      setError("API unavailable. Start backend and MongoDB.");
    }
  };

  const fetchSessionJourney = async (sessionId) => {
    setSelectedSessionId(sessionId);
    try {
      const res = await axios.get(`${API_URL}/sessions/${sessionId}/events`);
      setSessionEvents(res.data.data);
    } catch {
      setError("Could not load journey.");
    }
  };

  const fetchHeatmap = async () => {
    setLoading(true);
    try {
      const heatmapRes = await axios.get(
        `${API_URL}/heatmaps?url=${encodeURIComponent(urlInput)}`
      );
      setHeatmapClicks(heatmapRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchPageAssets = async() => {
    setLoading(true);
    setError("");
    try{
      await axios.get(`${API_URL}/heatmaps/page-assets`).then(res => {setPageAssets(res.data.data)})
    } catch {
      setError("Could not load page assets.");
    } finally {
      setLoading(false);
    }
  }

  const pageOptions = Object.keys(pageAssets);

  useEffect(() => {
    refreshOverview();
    fetchPageAssets();
  }, []);

  useEffect(() => {
    if(!urlInput) return;

    fetchHeatmap(urlInput);
  }, [urlInput])

  if(loading) return null;

  return (
    <div id="page-container" className="container dashboard-shell">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <div className="eyebrow">Dashboard</div>
          <h1>Behavior analytics</h1>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline" onClick={refreshOverview}>Refresh</button>
        </div>
      </div>

      {error && <div className="panel" style={{ borderColor: "rgba(220,38,38,0.35)", color: "var(--error)" }}>{error}</div>}

      <div className="stat-grid">
        <div className="stat-card"><span>Sessions</span><strong>{summary?.totalSessions || 0}</strong></div>
        <div className="stat-card"><span>Events</span><strong>{summary?.totalEvents || 0}</strong></div>
        <div className="stat-card"><span>CTA rate</span><strong>{summary?.ctaRate || 0}%</strong></div>
        <div className="stat-card"><span>Avg time</span><strong>{formatDuration(summary?.avgTimePerSessionMs)}</strong></div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === "sessions" ? "active" : ""}`} onClick={() => setActiveTab("sessions")}>Sessions</div>
        <div className={`tab ${activeTab === "heatmap" ? "active" : ""}`} onClick={() => { setActiveTab("heatmap"); if (!heatmapClicks.length) fetchHeatmap(); }}>Heatmap</div>
        <div className={`tab ${activeTab === "insights" ? "active" : ""}`} onClick={() => setActiveTab("insights")}>Insights</div>
      </div>

      {activeTab === "sessions" && (
        <div className="dashboard-grid">

          {/* Main Content - Detailed Journey */}
          <div className="dashboard-card">
            <h3>
              {selectedSession
                ? `Session ${selectedSession.sessionId.slice(0, 8)}`
                : "Session Details"}
            </h3>

            {!selectedSessionId ? (
              <p className="muted">Select a session.</p>
            ) : (
              <>
                <div className="session-summary">
                  <div className="stat-mini">
                    <span>Pages</span>
                    <strong>{sessionSummary?.pageViews || 0}</strong>
                  </div>

                  <div className="stat-mini">
                    <span>Clicks</span>
                    <strong>{sessionSummary?.clicks || 0}</strong>
                  </div>

                  <div className="stat-mini">
                    <span>CTAs</span>
                    <strong>{sessionSummary?.ctas || 0}</strong>
                  </div>

                  <div className="stat-mini">
                    <span>Time</span>
                    <strong>{formatDuration(sessionSummary?.timeSpent)}</strong>
                  </div>
                </div>

                <div className="dashboard-card journey-card">
                  <h4>Journey</h4>

                  <div className="journey-path">
                    {journeyPath.length ? (
                      journeyPath.map((page, index) => (
                        <div
                          key={`${page}-${index}`}
                          className="journey-node"
                        >
                          {page}
                        </div>
                      ))
                    ) : (
                      <p className="muted">No journey data.</p>
                    )}
                  </div>
                </div>

                <div className="dashboard-card">
                  <h4>Page Breakdown</h4>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Page</th>
                          <th>Views</th>
                          <th>Clicks</th>
                          <th>CTAs</th>
                        </tr>
                      </thead>

                      <tbody>
                        {pageStats.map(page => (
                          <tr key={page.page}>
                            <td>{page.page}</td>
                            <td>{page.views}</td>
                            <td>{page.clicks}</td>
                            <td>{page.ctas}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar - Sessions */}
          <aside className="dashboard-card">
            <h3>Sessions</h3>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Session</th>
                    {/* <th>Events</th> */}
                    <th>CTA</th>
                    <th>Time</th>
                    <th>Last active</th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.length ? (
                    sessions.map((session) => (
                      <tr
                        key={session.sessionId}
                        className={`clickable ${
                          selectedSessionId === session.sessionId
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          fetchSessionJourney(session.sessionId)
                        }
                      >
                        <td>{session.sessionId.slice(0, 8)}...</td>
                        {/* <td>{session.totalEvents}</td> */}
                        <td>{session.ctaClicks || 0}</td>
                        <td>{formatDuration(session.timeSpentMs)}</td>
                        <td>
                          {new Date(
                            session.lastActive
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No sessions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </aside>

        </div>
      )}

      {activeTab === "heatmap" && (
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
      )}

      {activeTab === "insights" && (
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
      )}
    </div>
  );
};

export default Analytics;
