// src/pages/donor/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // ← added useNavigate here
import { getDonorDashboard, setDonorLastDonation } from "../../api/donor";
import { getMyProfile } from "../../api/profile"; // ← added
import { showToast } from "../../utils/toast";

function daysBetween(a, b) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function formatDateISO(d) {
  // Returns YYYY-MM-DD suitable for <input type="date">
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DonorDashboard() {
  const navigate = useNavigate(); // ← added
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [dateInput, setDateInput] = useState("");

  // Guard: ensure donor profile exists, else redirect to creation
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMyProfile();
        if (me?.role !== "DONOR" || !me?.donorProfile) {
          navigate("/donor/profile", { replace: true });
          return;
        }
        // If ok, load dashboard data
        if (alive) await load();
      } catch (e) {
        console.error(e);
        // If fetching profile fails (e.g., unauthorized), take user to landing/login
        navigate("/", { replace: true });
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  async function load() {
    setLoading(true);
    try {
      const res = await getDonorDashboard();
      setData(res);

      // Pre-fill with current last donation if present
      if (res?.stats?.lastDonationDate) {
        const d = new Date(res.stats.lastDonationDate);
        setDateInput(formatDateISO(d));
      }
    } catch (e) {
      console.error(e);
      showToast({ variant: "error", message: e.message || "Failed to load dashboard" });
    } finally {
      setLoading(false);
    }
  }

  const { eligibilityText, isEligible, daysRemaining, nextEligibleDate } = useMemo(() => {
    const cooldownDays = 54;
    const last = data?.stats?.lastDonationDate ? new Date(data.stats.lastDonationDate) : null;

    if (!last) {
      return {
        eligibilityText: "Tell us your last donation date to check eligibility",
        isEligible: null,
        daysRemaining: null,
        nextEligibleDate: null,
      };
    }

    const today = new Date();
    const since = daysBetween(today, last);

    if (since >= cooldownDays) {
      return {
        eligibilityText: "You’re eligible to donate now",
        isEligible: true,
        daysRemaining: 0,
        nextEligibleDate: null,
      };
    }
    const remaining = cooldownDays - since;
    const eligibleOn = new Date(last);
    eligibleOn.setDate(eligibleOn.getDate() + cooldownDays);

    return {
      eligibilityText: `Eligible in ${remaining} day${remaining !== 1 ? "s" : ""}`,
      isEligible: false,
      daysRemaining: remaining,
      nextEligibleDate: eligibleOn,
    };
  }, [data]);

  async function onSaveDate() {
    if (!dateInput) {
      return showToast({ variant: "warning", message: "Please pick a date" });
    }
    const picked = new Date(dateInput);
    if (isNaN(picked.getTime())) {
      return showToast({ variant: "error", message: "Invalid date" });
    }
    setSaving(true);
    try {
      await setDonorLastDonation(dateInput);
      await load();
      showToast({ variant: "success", message: "Last donation date updated" });
    } catch (e) {
      console.error(e);
      showToast({ variant: "error", message: e.message || "Failed to update last donation date" });
    } finally {
      setSaving(false);
    }
  }

  // Skeleton for loading state
  if (loading) {
    return (
      <div className="container">
        <div style={{ marginBottom: 16 }}>
          <div className="skeleton" style={{ height: 28, width: 220, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 320 }} />
        </div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: 12 }}>
              <div className="skeleton" style={{ height: 14, width: "50%", marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 28, width: "30%" }} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 12, marginTop: 12 }}>
          <div className="skeleton" style={{ height: 16, width: "40%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 40, width: "100%" }} />
        </div>
        <div className="card" style={{ padding: 12, marginTop: 12 }}>
          <div className="skeleton" style={{ height: 20, width: "30%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 60, width: "100%" }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: 0 }}>No data</h3>
          <p className="muted">We couldn’t load your dashboard. Please try again.</p>
          <button className="btn" onClick={load}>Retry</button>
        </div>
      </div>
    );
  }

  const { stats, recommended = [], recentApplications = [] } = data;
  const lastDonationDisplay = stats.lastDonationDate
    ? new Date(stats.lastDonationDate).toLocaleDateString()
    : "—";

  return (
    <div className="container">
      {/* Header: Greeting + Eligibility */}
      <div className="card" style={{ padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Your Donor Dashboard</h2>
          <p className="muted" style={{ margin: 0 }}>
            {isEligible === null ? "Update your last donation date to get accurate eligibility." : eligibilityText}
            {nextEligibleDate ? ` - Next eligible on ${nextEligibleDate.toLocaleDateString()}` : ""}
          </p>
        </div>
        {/* Status chip */}
        <div
          className="badge"
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontWeight: 600,
            color: isEligible ? "var(--green-900)" : "var(--amber-900)",
            background: isEligible ? "var(--green-100)" : "var(--amber-100)",
            border: `1px solid ${isEligible ? "var(--green-300)" : "var(--amber-300)"}`,
            whiteSpace: "nowrap",
          }}
          aria-live="polite"
        >
          {isEligible === null ? "Unknown" : isEligible ? "Eligible" : `Wait ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        <StatCard
          title="Matching Requests"
          value={stats.matchingRequests}
          hint="Compatible requests near you"
          icon="🩸"
        />
        <StatCard
          title="Applied"
          value={stats.applicationsApplied}
          hint="Active applications"
          icon="📨"
        />
        <StatCard
          title="Withdrawn"
          value={stats.applicationsWithdrawn}
          hint="Past withdrawn applications"
          icon="↩️"
        />
        <StatCard
          title="Last Donation"
          value={lastDonationDisplay}
          hint="Used to compute eligibility"
          icon="📅"
        />
      </div>

      {/* Last Donation Inline Update */}
      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="form-label">When did you last donate blood?</div>
            <div className="form-hint">This helps keep your eligibility up to date.</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="input"
              type="date"
              value={dateInput}
              max={formatDateISO(new Date())}
              onChange={(e) => setDateInput(e.target.value)}
            />
            <button className="btn" onClick={onSaveDate} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Requests */}
      <section className="card" style={{ padding: 16, marginTop: 12 }}>
        <SectionHeader
          title="Recommended Requests"
          action={
            <Link className="btn ghost" to="/donor/requests" aria-label="Browse all matching requests">
              Browse all
            </Link>
          }
        />
        {recommended.length === 0 ? (
          <EmptyState
            title="No recommendations right now"
            hint="We’ll show compatible requests here as they appear."
            action={<Link className="btn" to="/donor/requests">Check requests</Link>}
          />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {recommended.map((r) => (
              <li
                key={r.id}
                className="card"
                style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "12px 12px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {r.bloodType}  ({r.city}, {r.country})
                    </div>
                    <div className="form-hint">
                      Needs {r.unitsNeeded} unit{r.unitsNeeded !== 1 ? "s" : ""} - Urgency: {r.urgency} - Posted {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link className="btn" to={`/donor/requests/${r.id}`}>View</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent Applications */}
      <section className="card" style={{ padding: 16, marginTop: 12, marginBottom: 24 }}>
        <SectionHeader title="Recent Applications" />
        {recentApplications.length === 0 ? (
          <EmptyState
            title="No recent applications"
            hint="Apply to a request to track your status here."
            action={<Link className="btn ghost" to="/donor/requests">Find a request</Link>}
          />
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {recentApplications.map((a) => (
              <li
                key={a.id}
                className="card"
                style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "12px 12px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {a.request.bloodType}  ({a.request.city})
                    </div>
                    <div className="form-hint">
                      {a.status} • {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Link className="btn ghost" to={`/donor/requests/${a.request.id}`}>View</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, hint, icon }) {
  return (
    <div className="card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ fontSize: 24, lineHeight: 1 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="form-label" style={{ marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
        {hint ? <div className="form-hint" aria-hidden="true">{hint}</div> : null}
      </div>
    </div>
  );
}

function SectionHeader({ title, action = null }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {action}
    </div>
  );
}

function EmptyState({ title, hint, action }) {
  return (
    <div
      style={{
        border: "1px dashed var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: 16,
        textAlign: "center",
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div className="muted" style={{ marginBottom: 8 }}>{hint}</div>
      {action}
    </div>
  );
}