// src/api/uploads.js
/**
 * Cloudinary unsigned upload (frontend-only).
 * You must create an unsigned upload preset in Cloudinary.
 *
 * Returns: { url, publicId }
 */
export async function uploadToCloudinaryUnsigned(
  file,
  { cloudName, uploadPreset, folder = "bloodmatch/avatars" }
) {
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("folder", folder);

  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Cloudinary upload failed");
  }
  const data = await res.json(); // secure_url, public_id, etc.
  return { url: data.secure_url, publicId: data.public_id };
}