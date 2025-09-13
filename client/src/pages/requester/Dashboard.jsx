// src/pages/requester/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ← add useNavigate
import { getRequesterDashboard } from "../../api/requester";
import { getMyProfile } from "../../api/profile"; // ← add
import { showToast } from "../../utils/toast";

function Badge({ color = "blue", children }) {
  const colorMap = {
    blue: { bg: "var(--blue-100)", bd: "var(--blue-300)", fg: "var(--blue-900)" },
    green: { bg: "var(--green-100)", bd: "var(--green-300)", fg: "var(--green-900)" },
    amber: { bg: "var(--amber-100)", bd: "var(--amber-300)", fg: "var(--amber-900)" },
    red: { bg: "var(--red-100)", bd: "var(--red-300)", fg: "var(--red-900)" },
    gray: { bg: "var(--gray-100)", bd: "var(--gray-300)", fg: "var(--gray-900)" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <span
      className="badge"
      style={{ padding: "4px 8px", borderRadius: 999, fontWeight: 600, background: c.bg, border: `1px solid ${c.bd}`, color: c.fg }}
    >
      {children}
    </span>
  );
}

function StatCard({ title, value, hint, icon }) {
  return (
    <div className="card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="form-label" style={{ marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
        {hint ? <div className="form-hint">{hint}</div> : null}
      </div>
    </div>
  );
}

function EmptyState({ title, hint, action }) {
  return (
    <div style={{ border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)", padding: 16, textAlign: "center" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div className="muted" style={{ marginBottom: 8 }}>{hint}</div>
      {action}
    </div>
  );
}

export default function RequesterDashboard() {
  const navigate = useNavigate(); // ← add
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Guard: ensure requester profile exists, else redirect to creation
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMyProfile();
        // Require correct role and presence of requesterProfile
        if (me?.role !== "REQUESTER" || !me?.requesterProfile) {
          // Optional: toast to inform the user
          showToast({ variant: "info", message: "Please create your requester profile to continue." });
          navigate("/requester/profile", { replace: true }); // adjust path if needed
          return;
        }
        if (alive) await load();
      } catch (e) {
        console.error(e);
        // If fetching profile fails (e.g., unauthorized), send to landing/login
        navigate("/", { replace: true });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  async function load() {
    setLoading(true);
    try {
      const res = await getRequesterDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
      showToast({ variant: "error", message: e.message || "Failed to load dashboard" });
    } finally {
      setLoading(false);
    }
  }

  const stats = data?.stats || {
    openRequests: 0,
    resolvedRequests: 0,
    cancelledRequests: 0,
    totalApplicants: 0,
    recentActivity: 0,
  };

  const recentRequests = data?.recentRequests || [];
  const recentApplicants = data?.recentApplicants || [];

  const primaryCTA = useMemo(() => {
    if (stats.openRequests === 0) {
      return { to: "/requester/requests/new", label: "Create your first request", variant: "primary" };
    }
    return { to: "/requester/requests", label: "Manage requests", variant: "ghost" };
  }, [stats.openRequests]);

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 24, width: 240, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 320 }} />
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 26, width: "30%", marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 14, width: "50%" }} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16, marginTop: 12 }}>
          <div className="skeleton" style={{ height: 18, width: "30%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 60, width: "100%" }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: 0 }}>Couldn’t load your dashboard</h3>
          <p className="muted">Please try again.</p>
          <button className="btn" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="card" style={{ padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Requester Dashboard</h2>
          <p className="muted" style={{ margin: 0 }}>
            Track your blood requests and connect with donors faster.
          </p>
        </div>
        <Link className={`btn ${primaryCTA.variant === "ghost" ? "ghost" : ""}`} to={primaryCTA.to}>
          {primaryCTA.label}
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        <StatCard title="Open Requests" value={stats.openRequests} hint="Currently accepting donors" icon="📌" />
        <StatCard title="Resolved" value={stats.resolvedRequests} hint="Requests you resolved" icon="✅" />
        <StatCard title="Cancelled" value={stats.cancelledRequests} hint="No longer active" icon="🗑️" />
        <StatCard title="Total Applicants" value={stats.totalApplicants} hint="Across your last 20 requests" icon="👥" />
      </div>

      {/* Recent Requests */}
      <section className="card" style={{ padding: 16, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Recent Requests</h3>
          <Link className="btn ghost" to="/requester/requests">View all</Link>
        </div>

        {recentRequests.length === 0 ? (
          <EmptyState
            title="You have no requests yet"
            hint="Create your first request to start receiving donor applications."
            action={<Link className="btn" to="/requester/requests/new">Create request</Link>}
          />
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {recentRequests.map((r) => (
              <li key={r.id} className="card" style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{r.bloodType}</strong>
                      <span className="muted">• {r.city}, {r.country}</span>
                      <Badge color={r.status === "Open" ? "green" : r.status === "Resolved" ? "blue" : "gray"}>
                        {r.status}
                      </Badge>
                      <Badge color={r.urgency === "Critical" ? "red" : r.urgency === "High" ? "amber" : "blue"}>
                        {r.urgency}
                      </Badge>
                    </div>
                    <div className="form-hint">
                      Needs {r.unitsNeeded} unit{r.unitsNeeded !== 1 ? "s" : ""} • Applicants: {r.applicantCount} • Posted {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link className="btn" to={`/requester/requests/${r.id}/applications`}>View applicants</Link>
                    <Link className="btn ghost" to={`/requester/requests/${r.id}/edit`}>Edit</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent Applicants */}
      <section className="card" style={{ padding: 16, marginTop: 12, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Recent Applicants</h3>
        {recentApplicants.length === 0 ? (
          <EmptyState
            title="No recent applicants"
            hint="As donors apply to your requests, you’ll see them here."
            action={<Link className="btn ghost" to="/requester/requests">Open requests</Link>}
          />
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {recentApplicants.map((a) => (
              <li key={a.id} className="card" style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: "50%", background: "var(--gray-100)",
                        display: "grid", placeItems: "center", overflow: "hidden",
                      }}
                      aria-hidden="true"
                    >
                      {a.donor.photoURL ? (
                        <img src={a.donor.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span role="img" aria-label="donor">🩸</span>
                      )}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <strong>{a.donor.name || "Anonymous Donor"}</strong>
                        {a.donor.bloodType ? <Badge>{a.donor.bloodType}</Badge> : null}
                        <span className="muted">• {a.donor.city || "—"}, {a.donor.country || ""}</span>
                      </div>
                      <div className="form-hint">
                        Applied to {a.request.bloodType} in {a.request.city} • {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {a.donor.phone ? (
                      <a className="btn" href={`tel:${a.donor.phone}`}>Call</a>
                    ) : null}
                    {a.donor.email ? (
                      <a className="btn ghost" href={`mailto:${a.donor.email}?subject=Blood Request`} target="_blank" rel="noreferrer">
                        Email
                      </a>
                    ) : null}
                    <Link className="btn ghost" to={`/requester/requests/${a.request.id}/applications`}>View</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}