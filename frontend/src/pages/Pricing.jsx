const Pricing = () => {
  return (
    <div id="page-container" className="container">
      <div className="eyebrow">Pricing</div>
      <h1 className="page-title">Simple plans for product teams.</h1>

      <div className="pricing-grid">
        <div className="price-card">
          <h2>Starter</h2>
          <strong style={{ display: "block", fontSize: "2.4rem", margin: "1rem 0" }}>$0</strong>
          <p className="muted">50k events · heatmaps · journeys</p>
          <button className="btn btn-outline" style={{ width: "100%", marginTop: "1.25rem" }} data-cf-cta="Pricing starter CTA">Start Free</button>
        </div>
        <div className="price-card" style={{ background: "#111827", color: "#fff", borderColor: "#111827" }}>
          <h2>Scale</h2>
          <strong style={{ display: "block", fontSize: "2.4rem", margin: "1rem 0" }}>Custom</strong>
          <p style={{ color: "#cbd5e1" }}>Unlimited events · retention · support</p>
          <button className="btn" style={{ width: "100%", marginTop: "1.25rem", background: "#fff", color: "#111827" }} data-cf-cta="Pricing scale CTA">Contact Sales</button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
