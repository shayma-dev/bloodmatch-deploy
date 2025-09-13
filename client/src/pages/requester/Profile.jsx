// src/pages/requester/Profile.jsx
import { useEffect, useState } from "react";
import { getMyProfile, createMyProfile, updateMyProfile } from "../../api/profile";
import { isNonEmpty } from "../../utils/validators";
import { showToast } from "../../utils/toast";
import Button from "../../ui/controls/Button";
import Input from "../../ui/controls/Input";
import useAuth from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["Hospital", "Patient"];

export default function RequesterProfile() {
  // eslint-disable-next-line no-unused-vars
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    category: "Hospital",
    city: "",
    country: "",
    addressLine: "",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMyProfile();
        if (!mounted) return;
        if (me?.requesterProfile) {
          setHasExisting(true);
          const r = me.requesterProfile;
          setForm({
            name: r.name || "",
            phone: r.phone || "",
            category: CATEGORIES.includes(r.category) ? r.category : "Hospital",
            city: r.city || "",
            country: r.country || "",
            addressLine: r.addressLine || "",
          });
        } else {
          setHasExisting(false);
        }
      } catch (e) {
        showToast({ variant: "error", message: e.message || "Failed to load profile" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    // Required validations
    if (!isNonEmpty(form.name)) return showToast({ variant: "error", message: "Name is required" });
    if (!isNonEmpty(form.phone)) return showToast({ variant: "error", message: "Phone is required" });
    if (!CATEGORIES.includes(form.category)) return showToast({ variant: "error", message: "Choose a valid category" });
    if (!isNonEmpty(form.city)) return showToast({ variant: "error", message: "City is required" });
    if (!isNonEmpty(form.country)) return showToast({ variant: "error", message: "Country is required" });

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      category: form.category,
      city: form.city.trim(),
      country: form.country.trim(),
      addressLine: form.addressLine?.trim() || undefined,
    };

    try {
      setSaving(true);
      if (hasExisting) {
        await updateMyProfile(payload);
      } else {
        await createMyProfile(payload);
      }
      await refreshUser?.();
      showToast({ variant: "success", message: "Profile saved" });
      navigate("/", { replace: true });
    } catch (e) {
      showToast({ variant: "error", message: e.message || "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  }

  return (
      <div className="container">
        <div className="card">
          <h2>{hasExisting ? "Edit Requester Profile" : "Create Requester Profile"}</h2>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : (
            <form onSubmit={onSubmit}>
              <Input id="name" label="Organization/Full Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
              <Input id="phone" label="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />

              <div className="form-field">
                <label className="form-label" htmlFor="category">Category</label>
                <select
                  id="category"
                  className="input"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <Input id="city" label="City" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
              <Input id="country" label="Country" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
              <Input id="addressLine" label="Address (optional)" value={form.addressLine} onChange={(e) => updateField("addressLine", e.target.value)} />

              <div style={{ marginTop: 12 }}>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button>
              </div>
            </form>
          )}
        </div>
      </div>
  );
}