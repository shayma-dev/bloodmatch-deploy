// src/pages/requester/RequestApplicants.jsx
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApplicants, getRequestById, updateRequestStatus } from "../../api/requests";
import { showToast } from "../../utils/toast";

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initialsFrom(text = "D") {
  return String(text)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0] || "")
    .join("")
    .toUpperCase() || "D";
}

export default function RequestApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [apps, setApps] = useState([]);

  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [reqData, appData] = await Promise.all([
          getRequestById(id),
          getApplicants(id),
        ]);
        if (!active) return;
        setRequest(reqData);
        setApps(appData || []);
      } catch (e) {
        showToast({ variant: "error", message: e.message || "Failed to load applicants" });
        navigate("/requester/requests");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, navigate]);

  const filteredApps = useMemo(() => {
    if (!showActiveOnly) return apps;
    return apps.filter((a) => a.status === "Applied");
  }, [apps, showActiveOnly]);

  async function onResolve() {
    try {
      if (!confirm("Mark this request as Resolved? This will indicate you found enough donors.")) return;
      const updated = await updateRequestStatus(id, "Resolved");
      setRequest(updated);
      showToast({ variant: "success", message: "Request marked as Resolved" });
    } catch (e) {
      showToast({ variant: "error", message: e.message || "Failed to update status" });
    }
  }

  return (
    <div className="container">
      <div className="flex-between" style={{ alignItems: "center", gap: 8 }}>
        <h2>Applicants</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn btn-secondary" to="/requester/requests">Back</Link>
          <button className="btn" onClick={onResolve} disabled={request?.status === "Resolved"}>
            {request?.status === "Resolved" ? "Resolved" : "Mark as Resolved"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : !request ? (
        <p className="muted">Request not found.</p>
      ) : (
        <>
          {/* Request summary */}
          <div className="card subtle" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <span className="chip" style={{ background: "rgba(255,255,255,0.08)", padding: "6px 10px", borderRadius: 999, fontWeight: 700 }}>
                {request.bloodType}
              </span>
              <span className={`chip chip-${(request.status || "default").toLowerCase()}`}>{request.status}</span>
              <span className="muted">Urgency: <strong>{request.urgency}</strong></span>
              <span className="muted">Units: <strong>{request.unitsNeeded}</strong></span>
              <span className="muted">Posted {timeAgo(request.createdAt)}</span>
            </div>
            <p style={{ marginTop: 8 }}>{request.caseDescription}</p>
          </div>

          {/* Controls */}
          <div className="card subtle" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label htmlFor="activeOnly" className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  id="activeOnly"
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                />
                Show active only (Applied)
              </label>
              <div className="muted" style={{ marginLeft: "auto" }}>
                {filteredApps.length} of {apps.length} shown
              </div>
            </div>
          </div>

          {/* Applicants list */}
          {filteredApps.length === 0 ? (
            <p className="muted" style={{ marginTop: 12 }}>No applicants{showActiveOnly ? " with status Applied" : ""}.</p>
          ) : (
            <div className="grid" style={{ marginTop: 12 }}>
              {filteredApps.map((a) => {
                const donor = a.donor || {};
                const user = donor.user || {};
                const displayName = donor.name || user.email || "Donor";
                const email = user.email;
                const phone = donor.phone; // from DonorProfile (optional)
                const avatar = donor.photoURL; // from DonorProfile (note: photoURL)

                const isWithdrawn = a.status === "Withdrawn";

                return (
                  <div
                    className="card"
                    key={a.id}
                    style={isWithdrawn ? { opacity: 0.7 } : undefined}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      {/* Left: Avatar + identity */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          aria-label="Donor avatar"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.1)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                            color: "white",
                          }}
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={displayName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            initialsFrom(displayName)
                          )}
                        </div>

                        <div>
                          <div style={{ fontWeight: 600 }}>{displayName}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Applied {timeAgo(a.createdAt)}
                            {donor.bloodType ? ` • ${donor.bloodType}` : ""}
                          </div>
                          {(donor.city || donor.country) && (
                            <div className="muted" style={{ fontSize: 12 }}>
                              {donor.city || ""}{donor.city && donor.country ? ", " : ""}{donor.country || ""}
                            </div>
                          )}
                          {donor.lastDonationDate && (
                            <div className="muted" style={{ fontSize: 12 }}>
                              Last donation: {timeAgo(donor.lastDonationDate)}
                            </div>
                          )}
                          {isWithdrawn && (
                            <span className="chip chip-warning" title="Applicant withdrew">
                              Withdrawn
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: contact actions */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {phone && (
                          <a className="btn tiny" href={`tel:${phone}`}>Call</a>
                        )}
                        {email && (
                          <a
                            className="btn tiny"
                            href={`mailto:${email}`}
                            style={{ color: "#E5E7EB", textDecoration: "none", fontWeight: 500 }}
                          >
                            Email
                          </a>
                        )}
                        {phone && (
                          <button
                            className="btn tiny"
                            type="button"
                            onClick={() => navigator.clipboard.writeText(phone)}
                            title="Copy phone"
                          >
                            Copy Phone
                          </button>
                        )}
                        {email && (
                          <button
                            className="btn tiny"
                            type="button"
                            onClick={() => navigator.clipboard.writeText(email)}
                            title="Copy email"
                          >
                            Copy Email
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}