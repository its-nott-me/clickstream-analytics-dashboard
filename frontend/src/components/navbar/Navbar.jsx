import { NavLink } from "react-router-dom";
import { Target } from "lucide-react";

export const Navbar = ({menuOpen, setMenuOpen}) => {
  return (
    <header className="navbar">
      <NavLink to="/" className="logo" data-cf-cta="Brand home">
        <span className="logo-mark">
          <Target size={18} strokeWidth={2.25} />
        </span>
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
    </header>
  )
}