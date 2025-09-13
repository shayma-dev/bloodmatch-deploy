// src/ui/layout/Navbar.jsx
import { Link, NavLink } from "react-router-dom";

function initialsFromName(name) {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b || a || "U").toUpperCase();
}

export default function Navbar({ user, onLogout }) {
  const navLinkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " nav-link-active" : "");

  const role = user?.role;
  const displayName =
    user?.donorProfile?.name || user?.name || user?.email || "User";
  const photoURL = user?.donorProfile?.photoURL || user?.photoURL || "";

  const profileHref = role === "REQUESTER" ? "/requester/profile" : "/donor/profile";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link
          to="/"
          className="brand"
          style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "white" }}
          aria-label="BloodMatch Home"
        >
          {/* Prefer inline SVG in public for caching and quick load */}
          <img
            src="/bloodmatch.svg"
            alt=""
            aria-hidden="true"
            style={{ height: 28, width: "auto", display: "block" }}
          />
          <span style={{ fontWeight: 800, letterSpacing: 0.2 }}>BloodMatch</span>
        </Link>

        {/* Center nav (role-based) */}
        <div className="navbar-center" style={{ display: "flex", gap: 12 }}>
          {!user ? (
            <span className="muted">Save lives with smarter matching</span>
          ) : role === "DONOR" ? (
            <>
              <NavLink to="/donor/requests" className={navLinkClass}>
                Matching Requests
              </NavLink>
              <NavLink to="/donor/profile" className={navLinkClass}>
                My Profile
              </NavLink>
            </>
          ) : role === "REQUESTER" ? (
            <>
              <NavLink to="/requester/requests" className={navLinkClass}>
                My Requests
              </NavLink>
              <NavLink to="/requester/requests/new" className={navLinkClass}>
                Create Request
              </NavLink>
              <NavLink to="/requester/profile" className={navLinkClass}>
                My Profile
              </NavLink>
            </>
          ) : null}
        </div>

        {/* Right side: avatar, role badge, logout */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {user ? (
            <>
              <Link to={profileHref} title={displayName}>
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt="Profile"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,255,255,0.14)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {initialsFromName(displayName)}
                  </div>
                )}
              </Link>

              <span className="badge" title={`Role: ${role}`}>{role}</span>
              <button className="btn ghost" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <span className="muted">Welcome</span>
          )}
        </div>
      </div>
    </nav>
  );
}