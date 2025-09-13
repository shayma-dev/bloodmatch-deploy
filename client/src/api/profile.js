// src/api/profile.js
import http from "./http";

/**
 * Get my profile (role-aware)
 * Response example (DONOR):
 * {
 *   "id": "...",
 *   "email": "...",
 *   "role": "DONOR",
 *   "donorProfile": {
 *     "userId": "...",
 *     "name": "...",
 *     "phone": "...",
 *     "bloodType": "A+",
 *     "lastDonationDate": "2025-07-01T00:00:00.000Z",
 *     "city": "Cairo",
 *     "country": "Palestine",
 *     "addressLine": "123 Main St",
 *     "photoURL": null
 *   },
 *   "requesterProfile": null
 * }
 */
export async function getMyProfile() {
  const { data } = await http.get("/me/profile");
  return data;
}

/**
 * Create my profile (first time after signup)
 *
 * DONOR payload example:
 * {
 *   "name": "Donor",
 *   "phone": "1234567890",
 *   "bloodType": "A+",
 *   "lastDonationDate": "2025-07-01", // YYYY-MM-DD
 *   "city": "Cairo",
 *   "country": "Egypt",
 *   "addressLine": "123 Main St",
 *   "photoURL": null
 * }
 * Returns DonorProfile
 *
 * REQUESTER payload example:
 * {
 *   "name": "S",
 *   "category": "Hospital", // or "Patient"
 *   "phone": "1234567890",
 *   "city": "Cairo",
 *   "country": "Egypt",
 *   "addressLine": "123 Main St"
 * }
 * Returns RequesterProfile
 */
export async function createMyProfile(payload) {
  const { data } = await http.post("/me/profile", payload);
  return data;
}

/**
 * Update my profile
 *
 * DONOR payload example (date as YYYY-MM-DD string):
 * {
 *   "name": "Donor",
 *   "phone": "1234567890",
 *   "bloodType": "A+",
 *   "lastDonationDate": "2025-07-01",
 *   "city": "Cairo",
 *   "country": "Palestine",
 *   "addressLine": "123 Main St",
 *   "photoURL": null
 * }
 *
 * REQUESTER payload example:
 * {
 *   "name": "Shayma",
 *   "category": "Hospital",
 *   "phone": "1234567890",
 *   "city": "Cairo",
 *   "country": "Egypt",
 *   "addressLine": "123 Main St"
 * }
 *
 * Returns the full User with nested updated profile.
 */
export async function updateMyProfile(payload) {
  const { data } = await http.put("/me/profile", payload);
  return data;
}