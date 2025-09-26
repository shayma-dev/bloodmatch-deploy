/* eslint-disable no-unused-vars */
// src/pages/donor/RequestDetails.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
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

  // Authoritative per-user state: prefer myApp.status
  const hasActive = useMemo(() => {
    if (myApp?.status) return myApp.status === "Applied";
    if (typeof req?.hasActiveApplication === "boolean")
      return req.hasActiveApplication;
    return false;
  }, [myApp?.status, req?.hasActiveApplication]);

  const fetchRequest = useCallback(async () => {
    const data = await getRequestById(id, { noCache: true });
    setReq(data);
    setMyApp(data?.myApplication ?? null);
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        await fetchRequest();
      } catch (e) {
        if (alive) {
          showToast({
            variant: "error",
            message: e?.message || "Failed to load request",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchRequest]);

  // Optimistic state setters
  function setOptimisticApplied() {
    setMyApp((prev) => {
      if (prev?.id) return { ...prev, status: "Applied" };
      return {
        id: prev?.id || "__local__",
        status: "Applied",
        createdAt: new Date().toISOString(),
      };
    });
    setReq((prev) =>
      prev
        ? {
            ...prev,
            hasActiveApplication: true,
            _count:
              prev._count?.applications !== undefined
                ? {
                    ...prev._count,
                    // If your count is "active applicants", increment; if "total ever", remove this change.
                    applications: prev._count.applications + 1,
                  }
                : prev._count,
          }
        : prev
    );
  }

  function setOptimisticWithdrawn() {
    setMyApp((prev) => (prev ? { ...prev, status: "Withdrawn" } : prev));
    setReq((prev) =>
      prev
        ? {
            ...prev,
            hasActiveApplication: false,
            _count:
              prev._count?.applications !== undefined
                ? {
                    ...prev._count,
                    applications:
                      typeof prev._count.applications === "number" &&
                      prev._count.applications > 0
                        ? prev._count.applications - 1
                        : 0,
                  }
                : prev._count,
          }
        : prev
    );
  }

  async function onApply() {
    if (!req) return;
    if (hasActive) {
      return showToast({
        variant: "info",
        message: "You have already applied to this request",
      });
    }
    if (
      !confirm(
        "Apply to this request? Your contact details will be shared with the requester."
      )
    )
      return;

    try {
      setSubmitting(true);
      // Optimistic flip
      setOptimisticApplied();

      // Server call
      const created = await applyToRequest(req.id);

      // Seed real ID immediately so Withdraw is enabled even before refetch
      if (created?.id) {
        setMyApp((prev) => ({
          id: created.id,
          status: created.status || "Applied",
          createdAt: created.createdAt || new Date().toISOString(),
        }));
      }

      // Re-sync authoritative state
      await fetchRequest();

      showToast({ variant: "success", message: "Applied successfully" });
    } catch (e) {
      // Rollback by refetching current server state
      await fetchRequest();
      showToast({ variant: "error", message: e?.message || "Failed to apply" });
    } finally {
      setSubmitting(false);
    }
  }

  async function onWithdraw() {
    if (!hasActive || !myApp?.id) {
      return showToast({
        variant: "error",
        message: "No active application to withdraw",
      });
    }
    if (!confirm("Withdraw your application?")) return;

    try {
      setSubmitting(true);
      setOptimisticWithdrawn();

      await withdrawApplication(myApp.id);

      await fetchRequest();

      showToast({ variant: "success", message: "Application withdrawn" });
    } catch (e) {
      await fetchRequest();
      showToast({
        variant: "error",
        message: e?.message || "Failed to withdraw",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const urgencyClass = (u) => `badge badge-${toLowerSafe(u)}`;
  const statusClass = (s) => `chip chip-${toLowerSafe(s) || "default"}`;

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
          <div className="flex-between" style={{ alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0 }}>Request Details</h2>
              <span className={statusClass(req.status)}>{req.status}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="muted" style={{ fontSize: 12 }}>Urgency:</span>
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
              <div className="muted" style={{ fontSize: 12 }}>Blood Type</div>
              <div style={{ fontWeight: 700 }}>{req.bloodType}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>Units Needed</div>
              <div style={{ fontWeight: 700 }}>{req.unitsNeeded}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>Location</div>
              <div>{req.city}, {req.country}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 12 }}>Posted</div>
              <div>{timeAgo(req.createdAt)}</div>
            </div>
            {req?._count?.applications !== undefined && (
              <div>
                <div className="muted" style={{ fontSize: 12 }}>Applicants</div>
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
                {/* Avatar Initials */}
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
                      {requester?.category && (requester?.city || requester?.country) ? " • " : ""}
                      {requester?.city || requester?.country
                        ? `${requester?.city || ""}${requester?.city && requester?.country ? ", " : ""}${requester?.country || ""}`
                        : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Contacts */}
              {requesterPhone || requesterEmail ? (
                <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                  {requesterPhone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="muted" style={{ width: 80 }}>Phone</span>
                      <span>{requesterPhone}</span>
                      <button
                        type="button"
                        className="btn tiny"
                        onClick={() => navigator.clipboard.writeText(requesterPhone)}
                        title="Copy phone"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {requesterEmail && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="muted" style={{ width: 80 }}>Email</span>
                      <a
                        href={`mailto:${requesterEmail}`}
                        style={{ color: "#93C5FD", textDecoration: "none", fontWeight: 500 }}
                      >
                        {requesterEmail}
                      </a>
                      <button
                        type="button"
                        className="btn tiny"
                        onClick={() => navigator.clipboard.writeText(requesterEmail)}
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
                {submitting ? "Withdrawing..." : "Apply to Donate"}
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={onWithdraw}
                disabled={submitting || !myApp?.id || myApp?.status !== "Applied"}
              >
                {submitting ? "Applying..." : "Withdraw Application"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
            <span className="muted" style={{ fontSize: 12 }}>
              Your contact info will be shared with the requester upon applying.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}