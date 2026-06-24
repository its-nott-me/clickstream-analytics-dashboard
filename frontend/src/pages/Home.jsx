import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="container">
      <section className="hero">
        <div>
          <div className="eyebrow">Product analytics for funnels</div>
          <h1>See clicks, CTAs, and drop-offs clearly.</h1>
          <p className="hero-copy">A lightweight tracker plus a MERN dashboard for sessions, heatmaps, and page-time insights.</p>
          <div className="hero-actions">
            <Link to="/analytics">
              <button className="btn btn-primary" data-cf-cta="Hero open analytics">Open Analytics</button>
            </Link>
            <Link to="/features">
              <button className="btn btn-outline" data-cf-cta="Hero view features">Explore Features</button>
            </Link>
          </div>
          <div className="metric-strip">
            <div className="mini-metric"><strong>5s</strong><span>batch flush</span></div>
            <div className="mini-metric"><strong>10</strong><span>event batch</span></div>
            <div className="mini-metric"><strong>4</strong><span>event types</span></div>
          </div>
        </div>

        <div className="hero-media">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
            alt="Analytics dashboards on screens"
          />
          <div className="media-overlay">
            <strong>Live funnel health</strong>
            <span>CTA rate · page time · click depth</span>
          </div>
        </div>
      </section>

      <section className="product-frame compact-preview" aria-label="Analytics product preview">
        <div className="frame-top">
          <span>CausalFunnel workspace</span>
          <span>last 24h</span>
        </div>
        <div className="visual-dashboard">
          <div className="journey-list">
            <div className="journey-step"><strong>Checkout CTA</strong><p className="muted">38 clicks · 14 conversions</p></div>
            <div className="journey-step"><strong>Pricing page</strong><p className="muted">2m 18s avg time</p></div>
            <div className="journey-step"><strong>Home hero</strong><p className="muted">Highest click density</p></div>
          </div>
          <div className="heatmap-preview">
            <span className="heat-dot" style={{ left: "70%", top: "19%", "--size": "86px" }} />
            <span className="heat-dot" style={{ left: "44%", top: "36%" }} />
            <span className="heat-dot" style={{ left: "62%", top: "58%", "--size": "72px" }} />
            <span className="heat-dot" style={{ left: "28%", top: "76%", "--size": "48px" }} />
          </div>
        </div>
      </section>

      <section className="section-grid" aria-label="Platform capabilities">
        <article className="feature-card"><h3>Batch ingestion</h3><p className="muted">Low request volume, bulk writes.</p></article>
        <article className="feature-card"><h3>Session replay lite</h3><p className="muted">Chronological journeys with coordinates.</p></article>
        <article className="feature-card"><h3>Scrollable heatmaps</h3><p className="muted">Clicks plotted across full page height.</p></article>
      </section>
    </div>
  );
};

export default Home;
