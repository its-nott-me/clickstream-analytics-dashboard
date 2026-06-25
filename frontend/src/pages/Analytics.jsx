import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/analytics.css";
import "../styles/components/table.css";
import { SessionsTab } from "../components/analytics/SessionsTab";
import { HeatMapTab } from "../components/analytics/HeatmapTab";
import { InsightsTab } from "../components/analytics/InsightsTab";

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

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("sessions");
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [urlInput, setUrlInput] = useState(FRONTEND_URL + "/");
  const [heatmapClicks, setHeatmapClicks] = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
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
      setSelectedSessionId(sessionsRes.data.data[0]?.sessionId);
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
    setHeatmapLoading(true);
    try {
      const heatmapRes = await axios.get(
        `${API_URL}/heatmaps?url=${encodeURIComponent(urlInput)}`
      );
      setHeatmapClicks(heatmapRes.data.data);
    } finally {
      setHeatmapLoading(false);
    }
  };

  const fetchPageAssets = async() => {
    setHeatmapLoading(true);
    setError("");
    try{
      await axios.get(`${API_URL}/heatmaps/page-assets`).then(res => {setPageAssets(res.data.data)})
    } catch {
      setError("Could not load page assets.");
    } finally {
      setHeatmapLoading(false);
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
        <SessionsTab
          sessions={sessions}
          selectedSession={selectedSession}
          selectedSessionId={selectedSessionId}
          sessionSummary={sessionSummary}
          journeyPath={journeyPath}
          pageStats={pageStats}
          fetchSessionJourney={fetchSessionJourney}
        />
      )}

      {activeTab === "heatmap" && (
        <HeatMapTab
          heatmapClicks={heatmapClicks}
          selectedAsset={selectedAsset}
          pageAssets={pageAssets}
          pageOptions={pageOptions}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          heatmapLoading={heatmapLoading}
        />
      )}

      {activeTab === "insights" && (
        <InsightsTab 
          summary={summary}
          pagePath={pagePath}
        />
      )}
    </div>
  );
};

export default Analytics;
