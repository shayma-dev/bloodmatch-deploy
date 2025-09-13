// src/pages/requester/CreateOrEditRequest.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createRequest, getRequestById, updateRequest } from "../../api/requests";
import { BLOOD_TYPES, URGENCY } from "../../utils/constants";
import { validateCreateRequest } from "../../utils/validators";
import { showToast } from "../../utils/toast";
import Button from "../../ui/controls/Button";
// If you added a new stylesheet, import it here (remove if you already include globally):
// import "../../styles/forms.css";

export default function CreateOrEditRequest() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    bloodType: "O+",
    unitsNeeded: 1,
    urgency: "Normal",
    caseDescription: "",
    city: "",
    country: "",
    status: "Open",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const data = await getRequestById(id);
        if (!active) return;
        setForm({
          bloodType: data.bloodType ?? "O+",
          unitsNeeded: data.unitsNeeded ?? 1,
          urgency: data.urgency ?? "Normal",
          caseDescription: data.caseDescription ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
          status: data.status ?? "Open",
        });
      } catch (e) {
        showToast({ variant: "error", message: e.message || "Failed to load request" });
        navigate("/requester/requests");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, isEdit, navigate]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (isEdit) {
      const errs = validateCreateRequest({
        bloodType: form.bloodType,
        unitsNeeded: form.unitsNeeded,
        urgency: form.urgency,
        caseDescription: form.caseDescription,
        city: form.city || "x",
        country: form.country || "x",
      });
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      const payload = {
        unitsNeeded: Number(form.unitsNeeded),
        urgency: form.urgency,
        caseDescription: form.caseDescription.trim(),
        // Optionally: status: form.status,
      };

      try {
        setSaving(true);
        await updateRequest(id, payload);
        showToast({ variant: "success", message: "Request updated successfully" });
        navigate("/requester/requests", { replace: true });
      } catch (e) {
        showToast({
          variant: "error",
          message: e.response?.data?.message || e.message || "Failed to update request",
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    // Create mode (unchanged)
    const errs = validateCreateRequest(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      bloodType: form.bloodType,
      unitsNeeded: Number(form.unitsNeeded),
      urgency: form.urgency,
      caseDescription: form.caseDescription.trim(),
      ...(form.city?.trim() ? { city: form.city.trim() } : {}),
      ...(form.country?.trim() ? { country: form.country.trim() } : {}),
    };

    try {
      setSaving(true);
      await createRequest(payload);
      showToast({ variant: "success", message: "Request created successfully" });
      navigate("/requester/requests", { replace: true });
    } catch (e) {
      showToast({ variant: "error", message: e.message || "Failed to create request" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container"><p className="muted">Loading...</p></div>;

  // Helper class for locked state
  const lockCls = isEdit ? "locked" : "";

  return (
    <div className="container">
      <div className="card">
        <h2>{isEdit ? "Edit Blood Request" : "Create Blood Request"}</h2>
        <form onSubmit={onSubmit} className="form">

          {/* Blood Type: visible but locked in edit mode */}
          <div className="form-field">
            <label className="form-label" htmlFor="bloodType">
              Blood Type {isEdit && <span className="locked-badge">Locked</span>}
            </label>
            <select
              id="bloodType"
              className={`input ${lockCls}`}
              value={form.bloodType}
              onChange={(e) => updateField("bloodType", e.target.value)}
              disabled={isEdit}
              aria-readonly={isEdit}
            >
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {isEdit && <div className="form-help muted-note">This value cannot be changed after creation.</div>}
            {errors.bloodType && <p className="error">{errors.bloodType}</p>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="unitsNeeded">Units Needed</label>
            <input
              id="unitsNeeded"
              type="number"
              min={1}
              step={1}
              className="input"
              value={form.unitsNeeded}
              onChange={(e) => updateField("unitsNeeded", e.target.value)}
            />
            {errors.unitsNeeded && <p className="error">{errors.unitsNeeded}</p>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="urgency">Urgency</label>
            <select
              id="urgency"
              className="input"
              value={form.urgency}
              onChange={(e) => updateField("urgency", e.target.value)}
            >
              {URGENCY.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {errors.urgency && <p className="error">{errors.urgency}</p>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="caseDescription">Case Description</label>
            <textarea
              id="caseDescription"
              className="input"
              rows={4}
              maxLength={300}
              value={form.caseDescription}
              onChange={(e) => updateField("caseDescription", e.target.value)}
              placeholder="Brief summary of the case (max 300 chars)"
            />
            <div className="muted" style={{ textAlign: "right" }}>
              {form.caseDescription.length}/300
            </div>
            {errors.caseDescription && <p className="error">{errors.caseDescription}</p>}
          </div>

          {/* City/Country: visible but disabled in edit mode */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="city">
                City {isEdit && <span className="locked-badge">Locked</span>}
              </label>
              <input
                id="city"
                className={`input ${lockCls}`}
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                disabled={isEdit}
                aria-readonly={isEdit}
              />
              {isEdit && <div className="form-help muted-note">City is fixed for this request.</div>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="country">
                Country {isEdit && <span className="locked-badge">Locked</span>}
              </label>
              <input
                id="country"
                className={`input ${lockCls}`}
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                disabled={isEdit}
                aria-readonly={isEdit}
              />
              {isEdit && <div className="form-help muted-note">Country is fixed for this request.</div>}
            </div>
          </div>

          {/* Optional: status selector in edit mode */}
          {/* If you want to update status on this same page, uncomment this and include status in payload */}
          {/* {isEdit && (
            <div className="form-field">
              <label className="form-label" htmlFor="status">Status</label>
              <select
                id="status"
                className="input"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                {["Open", "Resolved", "Cancelled"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )} */}

          <div style={{ marginTop: 12 }}>
            <Button type="submit" disabled={saving}>
              {saving ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}