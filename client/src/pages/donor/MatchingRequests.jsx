// src/pages/donor/MatchingRequests.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMatchingRequests } from "../../api/requests";
import { showToast } from "../../utils/toast";

function toLowerSafe(v) {
  return String(v || "").toLowerCase();
}
function timeAgo(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Urgency rank to enable sorting: higher = more urgent
const URGENCY_WEIGHT = { Low: 1, Normal: 2, High: 3, Critical: 4 };

export default function MatchingRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  // Filters and sorting (simplified: no city/country, no blood type)
  const [filters, setFilters] = useState({
    urgency: "",        // "", "Low", "Normal", "High", "Critical"
    status: "Open",     // default to Open; values come from request.status: "Open" | "Resolved" | "Cancelled"
    hideApplied: false, // hide those I've applied to
    minUnits: "",       // numeric string
  });
  const [sortBy, setSortBy] = useState("urgency"); // 'urgency' | 'newest' | 'units' | 'distance'
  const [sortDir, setSortDir] = useState("desc");  // 'asc' | 'desc'

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMatchingRequests();
        if (active) setRequests(data || []);
      } catch (e) {
        showToast({ variant: "error", message: e.message || "Failed to load matching requests" });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const urgencyClass = (u) => `badge badge-${toLowerSafe(u)}`;
  const statusClass = (s) => `chip chip-${toLowerSafe(s) || "default"}`;

  // Unique request statuses from data (e.g., "Open", "Resolved", "Cancelled")
  const statuses = useMemo(() => {
    const set = new Set(requests.map(r => r.status).filter(Boolean));
    return Array.from(set).sort();
  }, [requests]);

  // Apply filters and sorting
  const derived = useMemo(() => {
    const f = filters;
    let list = requests.slice();

    // Filter: urgency (exact)
    if (f.urgency) list = list.filter(r => r.urgency === f.urgency);

    // Filter: request status (Open | Resolved | Cancelled)
    if (f.status) list = list.filter(r => r.status === f.status);

    // Filter: hide applied (based on my application)
    if (f.hideApplied) {
      list = list.filter((r) => {
        const hasActive = r.hasActiveApplication ?? (r.myApplication?.status === "Applied");
        return !hasActive;
      });
    }

    // Filter: minimum units
    const minUnits = Number(f.minUnits);
    if (!Number.isNaN(minUnits) && f.minUnits !== "") {
      list = list.filter((r) => Number(r.unitsNeeded) >= minUnits);
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;

      switch (sortBy) {
        case "urgency": {
          const wa = URGENCY_WEIGHT[a.urgency] || 0;
          const wb = URGENCY_WEIGHT[b.urgency] || 0;
          cmp = wa - wb;
          break;
        }
        case "newest": {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          cmp = ta - tb; // newer = larger timestamp
          break;
        }
        case "units": {
          const ua = Number(a.unitsNeeded) || 0;
          const ub = Number(b.unitsNeeded) || 0;
          cmp = ua - ub;
          break;
        }
        case "distance": {
          // Works if your backend provides r.distanceKm; otherwise leaves order unchanged
          const da = Number(a.distanceKm);
          const db = Number(b.distanceKm);
          if (!Number.isNaN(da) && !Number.isNaN(db)) {
            cmp = da - db; // nearer first
          } else {
            cmp = 0;
          }
          break;
        }
        default:
          cmp = 0;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [requests, filters, sortBy, sortDir]);

  function patchFilters(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }
  function clearFilters() {
    setFilters({
      urgency: "",
      status: "Open",
      hideApplied: false,
      minUnits: "",
    });
  }

  return (
    <div className="container">
      <h2>Matching Requests</h2>

      {/* Filter and sort bar */}
      <div className="card subtle" style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          {/* Urgency */}
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Urgency</label>
            <select
              className="input"
              value={filters.urgency}
              onChange={(e) => patchFilters({ urgency: e.target.value })}
            >
              <option value="">Any</option>
              {["Low", "Normal", "High", "Critical"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Status (request status: Open | Resolved | Cancelled) */}
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => patchFilters({ status: e.target.value })}
            >
              <option value="">Any</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Min units */}
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Min Units</label>
            <input
              type="number"
              className="input"
              min={0}
              placeholder="e.g., 2"
              value={filters.minUnits}
              onChange={(e) => patchFilters({ minUnits: e.target.value })}
            />
          </div>

          {/* Hide applied */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 16 }}>
            <input
              id="hideApplied"
              type="checkbox"
              checked={filters.hideApplied}
              onChange={(e) => patchFilters({ hideApplied: e.target.checked })}
            />
            <label htmlFor="hideApplied" className="muted">Hide applied</label>
          </div>

          {/* Sort by */}
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Sort By</label>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="urgency">Urgency</option>
              <option value="newest">Newest</option>
              <option value="units">Units needed</option>
              <option value="distance">Distance</option>
            </select>
          </div>

          {/* Sort direction */}
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Order</label>
            <select className="input" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn" onClick={clearFilters}>Clear Filters</button>
        </div>
      </div>

      {/* Top summary */}
      {!loading && derived.length > 0 && (
        <p className="muted" style={{ marginTop: 6 }}>
          Showing {derived.length} of {requests.length} request{requests.length > 1 ? "s" : ""}{" "}
          {filters.urgency || filters.status || filters.hideApplied || filters.minUnits ? "(filtered)" : ""}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : derived.length === 0 ? (
        <p className="muted">No requests match your filters. Try clearing some filters.</p>
      ) : (
        <div className="grid" style={{ marginTop: 12 }}>
          {derived.map((r) => {
            const hasActive = r.hasActiveApplication ?? (r.myApplication?.status === "Applied");
            const lastStatus = r.myApplication?.status; // "Withdrawn" | "Applied"

            return (
              <div className="card" key={r.id}>
                {/* Header */}
                <div className="flex-between" style={{ alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Status chip (request status) */}
                    <span className={statusClass(r.status)}>{r.status}</span>

                    {/* Applied state chip */}
                    {hasActive && (
                      <span
                        className="chip chip-success"
                        title="You have an active application on this request"
                      >
                        Applied
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                    <span className="muted" style={{ fontSize: 12 }}>Urgency:</span>
                    <span className={urgencyClass(r.urgency)}>{r.urgency}</span>
                  </div>
                </div>

                {/* Meta row */}
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span>
                    Units Needed: <strong>{r.unitsNeeded}</strong>
                  </span>

                  {typeof r.distanceKm !== "undefined" && (
                    <>
                      <span className="dot-sep muted">•</span>
                      <span className="muted">{Number(r.distanceKm).toFixed(1)} km away</span>
                    </>
                  )}

                  {r.createdAt && (
                    <>
                      <span className="dot-sep muted">•</span>
                      <span className="muted">Posted {timeAgo(r.createdAt)}</span>
                    </>
                  )}
                </div>

                {/* Summary */}
                <p className="clamp-2" style={{ marginTop: 10 }}>
                  {r.caseDescription}
                </p>

                {/* Bottom row */}
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <Link to={`/donor/requests/${r.id}`} className="btn btn-primary">
                    {hasActive ? "View / Manage" : "View Details"}
                  </Link>

                  {!hasActive && lastStatus === "Withdrawn" && (
                    <span className="muted" style={{ fontSize: 12 }}>
                      You previously withdrew your application
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}