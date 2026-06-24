import "../styles/contact.css";

const Contact = () => {
  return (
    <div id="page-container" className="container">
      <div className="contact-grid">
        <div className="contact-media">
          <img
            src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80"
            alt="Team reviewing analytics"
          />
        </div>
        <form className="dashboard-card">
          <div className="eyebrow">Contact</div>
          <h1 className="page-title" style={{ fontSize: "2.6rem" }}>Talk to sales.</h1>
          <label>Name</label>
          <input type="text" placeholder="Jane Doe" style={{ width: "100%", margin: "0.45rem 0 1rem" }} />
          <label>Email</label>
          <input type="email" placeholder="jane@example.com" style={{ width: "100%", margin: "0.45rem 0 1rem" }} />
          <label>Message</label>
          <textarea rows="5" placeholder="What are you tracking?" style={{ width: "100%", margin: "0.45rem 0 1rem", resize: "vertical" }} />
          <button type="button" className="btn btn-primary" style={{ width: "100%" }} data-cf-cta="Contact submit CTA">Send Message</button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
