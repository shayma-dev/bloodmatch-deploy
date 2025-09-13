// src/api/donor.js
import http from "./http";

/**
 * GET /requests/dashboard
 * Returns:
 * {
 *   stats: {
 *     matchingRequests: number,
 *     applicationsApplied: number,
 *     applicationsWithdrawn: number,
 *     lastDonationDate: string | null
 *   },
 *   recommended: Array<{
 *     id: string, bloodType: string, unitsNeeded: number,
 *     urgency: string, city: string, country: string, createdAt: string
 *   }>,
 *   recentApplications: Array<{
 *     id: string, status: string, createdAt: string,
 *     request: { id: string, bloodType: string, urgency: string, city: string }
 *   }>
 * }
 */
export async function getDonorDashboard() {
  const res = await http.get("/requests/donor-dashboard");
  return res.data;
}

/**
 * POST /requests/last-donation
 * Body: { date: "YYYY-MM-DD" | ISO string }
 * Returns: { lastDonationDate: string | null }
 */
export async function setDonorLastDonation(date) {
  const res = await http.post("/requests/last-donation", { date });
  return res.data;
}