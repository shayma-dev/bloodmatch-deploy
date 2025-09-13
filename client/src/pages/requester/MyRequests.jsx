import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyRequests, updateRequestStatus } from "../../api/requests";
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

const URGENCY_WEIGHT = { Low: 1, Normal: 2, High: 3, Critical: 4 };

export default function MyRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  // Filters/sorting
  const [filters, setFilters] = useState({
    urgency: "",
    status: "Open", // most actionable by default
    minUnits: "",
  });
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'urgency' | 'units'
  const [sortDir, setSortDir] = useState("desc");  // 'asc' | 'desc'

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMyRequests();
        if (active) setRequests(data || []);
      } catch (e) {
        showToast({ variant: "error", message: e.message || "Failed to load your requests" });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const statuses = useMemo(() => {
    const set = new Set(requests.map(r => r.status).filter(Boolean));
    return Array.from(set).sort();
  }, [requests]);

  const derived = useMemo(() => {
    const f = filters;
    let list = requests.slice();

    if (f.urgency) list = list.filter(r => r.urgency === f.urgency);
    if (f.status) list = list.filter(r => r.status === f.status);

    const minUnits = Number(f.minUnits);
    if (!Number.isNaN(minUnits) && f.minUnits !== "") {
      list = list.filter((r) => Number(r.unitsNeeded) >= minUnits);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "urgency": {
          const wa = URGENCY_WEIGHT[a.urgency] || 0;
          const wb = URGENCY_WEIGHT[b.urgency] || 0;
          cmp = wa - wb;
          break;
        }
        case "units": {
          const ua = Number(a.unitsNeeded) || 0;
          const ub = Number(b.unitsNeeded) || 0;
          cmp = ua - ub;
          break;
        }
        case "newest":
        default: {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          cmp = ta - tb;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [requests, filters, sortBy, sortDir]);

  function patchFilters(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }
  function clearFilters() {
    setFilters({ urgency: "", status: "Open", minUnits: "" });
  }

  async function onChangeStatus(id, next) {
    try {
      const updated = await updateRequestStatus(id, next);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      showToast({ variant: "success", message: `Status updated to ${next}` });
    } catch (e) {
      showToast({ variant: "error", message: e.message || "Failed to update status" });
    }
  }

  return (
    <div className="container">
      <div className="flex-between" style={{ alignItems: "center", gap: 8 }}>
        <h2>My Requests</h2>
        <Link className="btn" to="/requester/requests/new">Create Request</Link>
      </div>

      {/* Filter/sort bar */}
      <div className="card subtle" style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          <div>
            <label className="muted" style={{ fontSize: 12 }}>Urgency</label>
            <select
              className="input"
              value={filters.urgency}
              onChange={(e) => patchFilters({ urgency: e.target.value })}
            >
              <option value="">Any</option>
              {["Low","Normal","High","Critical"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="muted" style={{ fontSize: 12 }}>Min Units</label>
            <input
              type="number"
              className="input"
              min={0}
              value={filters.minUnits}
              onChange={(e) => patchFilters({ minUnits: e.target.value })}
              placeholder="e.g., 2"
            />
          </div>

          <div>
            <label className="muted" style={{ fontSize: 12 }}>Sort By</label>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="urgency">Urgency</option>
              <option value="units">Units needed</option>
            </select>
          </div>

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

      {/* Summary */}
      {!loading && derived.length > 0 && (
        <p className="muted" style={{ marginTop: 6 }}>
          Showing {derived.length} of {requests.length} request{requests.length !== 1 ? "s" : ""}{" "}
          {filters.urgency || filters.status || filters.minUnits ? "(filtered)" : ""}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : derived.length === 0 ? (
        <p className="muted">No requests match your filters.</p>
      ) : (
        <div className="grid" style={{ marginTop: 12 }}>
          {derived.map((r) => (
            <div className="card" key={r.id}>
              {/* Header */}
              <div className="flex-between" style={{ alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div
                    className="chip"
                    style={{
                      fontWeight: 700,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.08)",
                    }}
                    aria-label={`Blood type ${r.bloodType}`}
                  >
                    {r.bloodType}
                  </div>
                  <span className={`chip chip-${toLowerSafe(r.status) || "default"}`}>{r.status}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                  <span className="muted" style={{ fontSize: 12 }}>Urgency:</span>
                  <span className={`badge badge-${toLowerSafe(r.urgency)}`}>{r.urgency}</span>
                </div>
              </div>

              {/* Meta */}
              <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span>Units Needed: <strong>{r.unitsNeeded}</strong></span>
                {r.createdAt && (
                  <>
                    <span className="dot-sep muted">•</span>
                    <span className="muted">Posted {timeAgo(r.createdAt)}</span>
                  </>
                )}
                <span className="dot-sep muted">•</span>
                <span className="muted">Applicants: <strong>{r.applicantCount ?? 0}</strong></span>
              </div>

              {/* Description */}
              <p className="clamp-3" style={{ marginTop: 8 }}>{r.caseDescription}</p>

              {/* Actions */}
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Link className="btn" to={`/requester/requests/${r.id}/edit`}>Edit</Link>
                <Link className="btn btn-secondary" to={`/requester/requests/${r.id}/applications`}>Applicants</Link>

                {/* Inline status change */}
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                  <label className="muted" style={{ fontSize: 12 }}>Update status:</label>
                  <select
                    className="input"
                    value={r.status}
                    onChange={(e) => onChangeStatus(r.id, e.target.value)}
                  >
                    {["Open", "Resolved", "Cancelled"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}