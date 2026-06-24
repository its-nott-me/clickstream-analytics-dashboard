import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/features.css";

const features = [
  ["Tracker", "Page views, CTA clicks, coordinates, and time spent."],
  ["Pipeline", "Queued events, beacon exit flush, bulk MongoDB writes."],
  ["Dashboard", "Sessions, heatmaps, charts, and CTA insights."]
];

const Features = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [CTA, setCTA] = useState(true);

  return (
    <div id="page-container" className="container">
      <div className="eyebrow">Platform</div>
      <h1 className="page-title">Built for fast signal.</h1>

      <section className="feature-showcase">
        <img
          src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1100&q=80"
          alt="Analytics workspace on a laptop"
        />
        <div className="feature-stack">
          {features.map(([title, copy], index) => (
            <button
              key={title}
              className={`insight-row feature-select ${activeFeature === index ? "selected-feature" : ""}`}
              onClick={() => setActiveFeature(index)}
              data-cf-cta={`Feature ${title}`}
            >
              <strong>{title}</strong>
              <span>{copy}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-grid" style={{ marginTop: "1rem" }}>
        <div className="dashboard-card">
          <h3>{features[activeFeature][0]}</h3>
          <div className="insight-list">
            <div className="insight-row"><strong>POST /api/events</strong><p className="muted">Batched ingestion.</p></div>
            <div className="insight-row"><strong>GET /api/sessions</strong><p className="muted">Journeys and dwell time.</p></div>
            <div className="insight-row"><strong>GET /api/heatmaps</strong><p className="muted">Full-page coordinates.</p></div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>Reliability mode</h3>
          <button className={`btn ${CTA ? "btn-primary" : "btn-outline"}`} onClick={() => setCTA(p => !p)} data-cf-cta="Toggle Button">
            CTA
          </button>
        </div>
      </section>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/analytics">
          <button className="btn btn-primary" data-cf-cta="Features open dashboard">Open Dashboard</button>
        </Link>
      </div>
    </div>
  );
};

export default Features;
