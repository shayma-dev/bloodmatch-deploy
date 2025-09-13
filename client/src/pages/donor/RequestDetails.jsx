/* eslint-disable no-unused-vars */
// src/pages/donor/RequestDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../ui/controls/Button";
import { getRequestById } from "../../api/requests";
import { applyToRequest, withdrawApplication } from "../../api/applications";
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
function initialsFromName(name) {
  if (!name) return "R";
  const parts = String(name).trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b || a || "R").toUpperCase();
}

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState(null);
  const [myApp, setMyApp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Prefer the backend-provided boolean; fallback to local check for safety
  const hasActive = useMemo(() => {
    if (req?.hasActiveApplication !== undefined)
      return !!req.hasActiveApplication;
    return myApp?.status === "Applied";
  }, [req, myApp]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getRequestById(id);
        if (!active) return;
        setReq(data);
        // Seed myApp from the server if present
        if (data?.myApplication) setMyApp(data.myApplication);
      } catch (e) {
        showToast({
          variant: "error",
          message: e.message || "Failed to load request",
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function refreshRequest() {
    try {
      const data = await getRequestById(id);
      setReq(data);
      setMyApp(data?.myApplication ?? null);
    } catch (e) {
      // Keep page usable even if refresh fails; surface a toast
      showToast({
        variant: "error",
        message: e.message || "Failed to refresh request",
      });
    }
  }

  async function onApply() {
    if (!req) return;
    if (
      !confirm(
        "Apply to this request? Your contact details will be shared with the requester."
      )
    )
      return;
    try {
      setSubmitting(true);
      const created = await applyToRequest(req.id);
      // Update local state from server to ensure consistency (gating, counts, etc.)
      await refreshRequest();
      showToast({ variant: "success", message: "Applied successfully" });
    } catch (e) {
      showToast({ variant: "error", message: e.message || "Failed to apply" });
    } finally {
      setSubmitting(false);
    }
  }

  async function onWithdraw() {
    // Strong guards: require an active application
    if (
      !req?.hasActiveApplication ||
      myApp?.status !== "Applied" ||
      !myApp?.id
    ) {
      return showToast({
        variant: "error",
        message: "No active application to withdraw",
      });
    }
    if (!confirm("Withdraw your application?")) return;
    try {
      setSubmitting(true);
      await withdrawApplication(myApp.id);
      // Ensure UI reflects inactive state using authoritative server data
      await refreshRequest();
      showToast({ variant: "success", message: "Application withdrawn" });
    } catch (e) {
      showToast({
        variant: "error",
        message: e.message || "Failed to withdraw",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const urgencyClass = (u) => `badge badge-${toLowerSafe(u)}`;
  const statusClass = (s) => `chip chip-${toLowerSafe(s) || "default"}`;

  // Derived requester fields (post-gating)
  const requester = req?.requester;
  const requesterName = requester?.name;
  const requesterEmail = requester?.user?.email; // may be gated
  const requesterPhone = requester?.phone; // may be gated

  return (
    <div className="container">
      {loading ? (
        <p className="muted">Loading...</p>
      ) : !req ? (
        <div className="card">
          <p className="error">Request not found.</p>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </div>
      ) : (
        <div className="card">
          {/* Header */}
          <div
            className="flex-between"
            style={{ alignItems: "center", gap: 12 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0 }}>Request Details</h2>
              <span className={statusClass(req.status)}>{req.status}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Urgency:
              </span>
              <span className={urgencyClass(req.urgency)}>{req.urgency}</span>
            </div>
          </div>

          {/* At a glance */}
          <div
            className="card subtle"
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Blood Type
              </div>
              <div style={{ fontWeight: 700 }}>{req.bloodType}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Units Needed
              </div>
              <div style={{ fontWeight: 700 }}>{req.unitsNeeded}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Location
              </div>
              <div>
                {req.city}, {req.country}
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>
                Posted
              </div>
              <div>{timeAgo(req.createdAt)}</div>
            </div>
            {req?._count?.applications !== undefined && (
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Applicants
                </div>
                <div style={{ fontWeight: 700 }}>{req._count.applications}</div>
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginTop: 12 }}>
            <h4 style={{ marginBottom: 6 }}>Case Description</h4>
            <p>{req.caseDescription}</p>
          </div>

          {/* Requester Panel */}
          {(requesterName ||
            requesterEmail ||
            requesterPhone ||
            requester?.city ||
            requester?.country) && (
            <div className="card subtle" style={{ marginTop: 12 }}>
              <h4 style={{ marginBottom: 10 }}>Requester</h4>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Avatar Initials (no photoURL in schema for requester) */}
                <div
                  aria-label="Requester initials"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(255,255,255,0.14)",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {initialsFromName(requesterName || requesterEmail || "R")}
                </div>

                {/* Identity */}
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontWeight: 600 }}>
                    {requesterName || "Requester"}
                  </div>
                  {(requester?.category ||
                    requester?.city ||
                    requester?.country) && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {requester?.category ? `${requester.category}` : ""}
                      {requester?.category &&
                      (requester?.city || requester?.country)
                        ? " • "
                        : ""}
                      {requester?.city || requester?.country
                        ? `${requester?.city || ""}${
                            requester?.city && requester?.country ? ", " : ""
                          }${requester?.country || ""}`
                        : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Contacts */}
              {requesterPhone || requesterEmail ? (
                <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                  {requesterPhone && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span className="muted" style={{ width: 80 }}>
                        Phone
                      </span>
                      <span>{requesterPhone}</span>
                      <button
                        type="button"
                        className="btn tiny"
                        onClick={() =>
                          navigator.clipboard.writeText(requesterPhone)
                        }
                        title="Copy phone"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {requesterEmail && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span className="muted" style={{ width: 80 }}>
                        Email
                      </span>
                      <a
                        href={`mailto:${requesterEmail}`}
                        style={{
                          color: "#93C5FD", // light, friendly accent
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        {requesterEmail}
                      </a>
                      <button
                        type="button"
                        className="btn tiny"
                        onClick={() =>
                          navigator.clipboard.writeText(requesterEmail)
                        }
                        title="Copy email"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                  Apply to view requester contact details.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {!hasActive ? (
              <Button onClick={onApply} disabled={submitting}>
                {submitting ? "Applying..." : "Apply to Donate"}
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={onWithdraw}
                disabled={
                  submitting || !myApp?.id || myApp?.status !== "Applied"
                }
              >
                {submitting ? "Withdrawing..." : "Withdraw Application"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Back
            </Button>
            <span className="muted" style={{ fontSize: 12 }}>
              Your contact info will be shared with the requester upon applying.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
