import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

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

const heatmapRoute = (url = "") => {
  const path = pagePath(url);
  if (path === "/features") return "features";
  if (path === "/pricing") return "pricing";
  if (path === "/contact") return "contact";
  return "home";
};

const eventLabel = (event) => {
  if (event.eventType === "page_view") return "Page view";
  if (event.eventType === "cta_click") return `CTA: ${event.metadata?.label || "Untitled"}`;
  if (event.eventType === "time_spent") return `Time: ${formatDuration(event.metadata?.durationMs)}`;
  return "Click";
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

const HeatmapSkeleton = ({ route }) => {
  if (route === "features") {
    return (
      <>
        {/* <div className="skel-topbar" />
        <div className="skel-title compact" />
        <div className="skel-feature-layout">
          <div className="skel-image" />
          <div className="skel-stack">
            <span /><span /><span />
          </div>
        </div>
        <div className="skel-two-col">
          <div className="skel-panel tall" />
          <div className="skel-panel short" />
        </div>
        <div className="skel-cta" /> */}
        
      <img style={{width: '100%', height: '100%'}} src='http://localhost:5000/api/uploads/features.png'/>
      </>
    );
  }

  if (route === "pricing") {
    return (
      <>
        {/* <div className="skel-topbar" />
        <div className="skel-title" />
        <div className="skel-pricing">
          <div className="skel-price-card" />
          <div className="skel-price-card dark" />
        </div> */}
        
      <img style={{width: '100%', height: '100%'}} src='http://localhost:5000/api/uploads/pricing.png'/>
      </>
    );
  }

  if (route === "contact") {
    return (
      <>
        {/* <div className="skel-topbar" />
        <div className="skel-contact">
          <div className="skel-image" />
          <div className="skel-form">
            <span /><span /><span /><span />
          </div>
        </div> */}
        
      <img style={{width: '100%', height: '100%'}} src='http://localhost:5000/api/uploads/contact.png'/>
      </>
    );
  }

  // default to homepage
  return (
    <>
      {/* <div className="skel-topbar" />
      <div className="skel-home-hero">
        <div className="skel-copy">
          <span className="line small" />
          <span className="line xl" />
          <span className="line xl narrow" />
          <span className="line medium" />
          <div className="skel-buttons"><span /><span /></div>
          <div className="skel-metrics"><span /><span /><span /></div>
        </div>
        <div className="skel-image hero-img" />
      </div>
      <div className="skel-dashboard-preview">
        <div className="skel-list"><span /><span /><span /></div>
        <div className="skel-heat-preview" />
      </div>
      <div className="skel-three-cards"><span /><span /><span /></div> */}
      <img style={{width: '100%', height: '100%'}} src='http://localhost:5000/api/uploads/home.png'/>
    </>
  );
};

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("sessions");
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [urlInput, setUrlInput] = useState("http://localhost:5173/");
  const [heatmapClicks, setHeatmapClicks] = useState([]);
  const [heatmapMeta, setHeatmapMeta] = useState({ documentHeight: 2200, documentWidth: 1440, clickCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSession = useMemo(
    () => sessions.find((session) => session.sessionId === selectedSessionId),
    [sessions, selectedSessionId]
  );
  const activeHeatmapRoute = heatmapRoute(urlInput);

  const refreshOverview = async () => {
    setError("");
    try {
      const [summaryRes, sessionsRes] = await Promise.all([
        axios.get(`${BASE_URL}/events/summary`),
        axios.get(`${BASE_URL}/sessions`)
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
      const res = await axios.get(`${BASE_URL}/sessions/${sessionId}/events`);
      setSessionEvents(res.data.data);
    } catch {
      setError("Could not load journey.");
    }
  };

  const fetchHeatmap = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${BASE_URL}/heatmaps?url=${encodeURIComponent(urlInput)}`);
      setHeatmapClicks(res.data.data);
      console.log(res.data.meta)
      setHeatmapMeta(res.data.meta || { documentHeight: 2200, documentWidth: 1440, clickCount: res.data.data.length });
    } catch {
      setError("Could not load heatmap.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(refreshOverview, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="container dashboard-shell">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <div className="eyebrow">Dashboard</div>
          <h1>Behavior analytics</h1>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-outline" onClick={refreshOverview}>Refresh</button>
          <a className="btn btn-primary" href="http://localhost:5173/tracker.js" target="_blank" rel="noreferrer">Tracker Script</a>
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
          <div className="dashboard-card">
            <h3>Sessions</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Events</th>
                    <th>CTA</th>
                    <th>Time</th>
                    <th>Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length ? sessions.map((session) => (
                    <tr key={session.sessionId} className={`clickable ${selectedSessionId === session.sessionId ? "selected" : ""}`} onClick={() => fetchSessionJourney(session.sessionId)}>
                      <td>{session.sessionId.slice(0, 8)}...</td>
                      <td>{session.totalEvents}</td>
                      <td>{session.ctaClicks || 0}</td>
                      <td>{formatDuration(session.timeSpentMs)}</td>
                      <td>{new Date(session.lastActive).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="empty-state">No sessions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="dashboard-card">
            <h3>{selectedSession ? `Journey ${selectedSession.sessionId.slice(0, 8)}` : "Journey"}</h3>
            {!selectedSessionId ? (
              <p className="muted">Select a session.</p>
            ) : (
              <div className="timeline">
                {sessionEvents.map((event) => (
                  <div className="timeline-item" key={event._id}>
                    <div className="timeline-time">{new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div className="timeline-content">
                      <strong>{eventLabel(event)}</strong>
                      <p className="muted">{pagePath(event.url)}</p>
                      {(event.eventType === "click" || event.eventType === "cta_click") && (
                        <p className="coordinate-line">
                          x {Number(event.metadata?.x || 0).toFixed(3)} · y {Number(event.metadata?.y || 0).toFixed(3)}
                          {event.metadata?.absoluteX ? ` · ${Math.round(event.metadata.absoluteX)}, ${Math.round(event.metadata.absoluteY)}px` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {activeTab === "heatmap" && (
        <div className="dashboard-card">
          <div className="dashboard-header" style={{ marginBottom: "1rem" }}>
            <div>
              <h3>Scrollable heatmap</h3>
              <p className="muted">{heatmapMeta.clickCount || heatmapClicks.length} clicks · {Math.round(heatmapMeta.documentHeight || 2200)}px · {pagePath(urlInput)}</p>
            </div>
            <div className="url-form">
              <input value={urlInput} onChange={(event) => setUrlInput(event.target.value)} placeholder="http://localhost:5173/" />
              <button className="btn btn-primary" onClick={fetchHeatmap} disabled={loading}>{loading ? "Loading" : "Generate"}</button>
            </div>
          </div>
          <div className="heatmap-scroll-shell">
            <div className={`heatmap-page `} style={{ height: `${980 * (2970 / 2474)}px` }}>
              <HeatmapSkeleton route={activeHeatmapRoute} />
              {heatmapClicks.length ? heatmapClicks.map((click, index) => (
                <span
                  className="heatmap-dot"
                  key={`${click.x}-${click.y}-${index}`}
                  title={`x ${Number(click.x || 0).toFixed(3)}, y ${Number(click.y || 0).toFixed(3)}`}
style={{
  left: `${(click.absoluteX / click.documentWidth) * 100}%`,
  top: `${(click.absoluteY / click.documentHeight) * 100}%`
}}                />
              )) : <div className="empty-state">No click coordinates for this URL.</div>}
            </div>
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
