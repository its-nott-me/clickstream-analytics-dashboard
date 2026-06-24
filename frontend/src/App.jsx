import { BrowserRouter as Router, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Features from "./pages/Features";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/components/button.css";
import "./styles/components/input.css";
import { useState } from "react";
import { Navbar } from "./components/navbar/Navbar";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        {/* <header className="navbar">
          <NavLink to="/" className="logo" data-cf-cta="Brand home">
            <span className="logo-mark" />
            <span>CausalFunnel</span>
          </NavLink>

            <button
              className="menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>

          <nav 
            className={`nav-links ${menuOpen ? "open" : ""}`}
            aria-label="Primary navigation"
          >
            <NavLink 
              to="/" 
              className={
                ({ isActive }) => (isActive ? "nav-item active" : "nav-item")
              }
              onClick={() => setMenuOpen(false)}
            >
              Product
            </NavLink>
            <NavLink 
              to="/features" 
              className={
                ({ isActive }) => (isActive ? "nav-item active" : "nav-item")
              }
              onClick={() => setMenuOpen(false)}
            >
              Features
            </NavLink>
            <NavLink 
              to="/pricing" 
              className={
                ({ isActive }) => (isActive ? "nav-item active" : "nav-item")
              }
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </NavLink>
            <NavLink 
              to="/contact" 
              className={
                ({ isActive }) => (isActive ? "nav-item active" : "nav-item")
              }
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </NavLink>
            <NavLink 
              to="/analytics" 
              className={
                ({ isActive }) => (isActive ? "nav-item nav-cta active" : "nav-item nav-cta")
              } 
              data-cf-cta="Open dashboard nav"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          </nav>
        </header> */}

        <Navbar 
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
