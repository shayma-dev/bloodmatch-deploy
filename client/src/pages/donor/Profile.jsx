// src/pages/donor/Profile.jsx
import { useEffect, useRef, useState } from "react";
import { getMyProfile, createMyProfile, updateMyProfile } from "../../api/profile";
import { isNonEmpty, isYYYYMMDD } from "../../utils/validators";
import { BLOOD_TYPES } from "../../utils/constants";
import { showToast } from "../../utils/toast";
import Button from "../../ui/controls/Button";
import Input from "../../ui/controls/Input";
import useAuth from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinaryUnsigned } from "../../api/uploads";

export default function DonorProfile() {
  // eslint-disable-next-line no-unused-vars
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    bloodType: "A+",
    lastDonationDate: "",
    city: "",
    country: "",
    addressLine: "",
    photoURL: "",
  });

  // Cloudinary config — replace with your values if needed
  const CLOUD_NAME = "dhaw1cebd";
  const UPLOAD_PRESET = "bloodmatch_unsigned_avatars";
  const UPLOAD_FOLDER = "bloodmatch/avatars";

  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getMyProfile();
        if (!mounted) return;
        if (me?.donorProfile) {
          setHasExisting(true);
          const d = me.donorProfile;
          setForm({
            name: d.name || "",
            phone: d.phone || "",
            bloodType: d.bloodType || "A+",
            lastDonationDate: d.lastDonationDate ? d.lastDonationDate.slice(0, 10) : "",
            city: d.city || "",
            country: d.country || "",
            addressLine: d.addressLine || "",
            photoURL: d.photoURL || "",
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

  async function handleFileSelect(file) {
    if (!file) return;

    // Client-side validation
    const MAX_MB = 5;
    const valid = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!valid.includes(file.type)) {
      return showToast({ variant: "error", message: "Upload a PNG, JPG, or WEBP image" });
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return showToast({ variant: "error", message: `Image must be under ${MAX_MB}MB` });
    }

    try {
      setUploading(true);
      const { url } = await uploadToCloudinaryUnsigned(file, {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        folder: UPLOAD_FOLDER,
      });
      updateField("photoURL", url);
      showToast({ variant: "success", message: "Photo uploaded" });
    } catch (e) {
      showToast({ variant: "error", message: e.message || "Failed to upload image" });
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  async function onSubmit(e) {
    e.preventDefault();
    // Validations
    if (!isNonEmpty(form.name)) return showToast({ variant: "error", message: "Name is required" });
    if (!isNonEmpty(form.phone)) return showToast({ variant: "error", message: "Phone is required" });
    if (!isNonEmpty(form.bloodType)) return showToast({ variant: "error", message: "Blood type is required" });
    if (!BLOOD_TYPES.includes(form.bloodType)) return showToast({ variant: "error", message: "Choose a valid blood type" });
    if (!isNonEmpty(form.lastDonationDate) || !isYYYYMMDD(form.lastDonationDate))
      return showToast({ variant: "error", message: "Last donation date is required (YYYY-MM-DD)" });
    if (!isNonEmpty(form.city)) return showToast({ variant: "error", message: "City is required" });
    if (!isNonEmpty(form.country)) return showToast({ variant: "error", message: "Country is required" });

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      bloodType: form.bloodType,
      lastDonationDate: form.lastDonationDate,
      city: form.city.trim(),
      country: form.country.trim(),
      addressLine: form.addressLine?.trim() || undefined,
      photoURL: form.photoURL?.trim() || undefined,
    };

    try {
      setSaving(true);
      if (hasExisting) {
        await updateMyProfile(payload);
      } else {
        await createMyProfile(payload);
      }
      await refreshUser?.(); // ensures Navbar gets updated avatar
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
        <h2>{hasExisting ? "Edit Donor Profile" : "Create Donor Profile"}</h2>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <form onSubmit={onSubmit}>
            <Input id="name" label="Full Name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            <Input id="phone" label="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />

            <div className="form-field">
              <label className="form-label" htmlFor="bloodType">Blood Type</label>
              <select
                id="bloodType"
                className="input"
                value={form.bloodType}
                onChange={(e) => updateField("bloodType", e.target.value)}
              >
                {BLOOD_TYPES.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="lastDonationDate">Last Donation Date</label>
              <input
                id="lastDonationDate"
                type="date"
                className="input"
                value={form.lastDonationDate}
                onChange={(e) => updateField("lastDonationDate", e.target.value)}
              />
            </div>

            <Input id="city" label="City" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            <Input id="country" label="Country" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
            <Input id="addressLine" label="Address (optional)" value={form.addressLine} onChange={(e) => updateField("addressLine", e.target.value)} />

            {/* Photo uploader */}
            <div className="form-field">
              <label className="form-label">Profile Photo</label>

              {form.photoURL ? (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img
                    src={form.photoURL}
                    alt="Profile"
                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Change"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => updateField("photoURL", "")}
                      disabled={uploading}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  style={{
                    border: "1px dashed rgba(255,255,255,0.25)",
                    borderRadius: 8,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div className="muted">Drag & drop an image here, or click Upload</div>
                  <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}