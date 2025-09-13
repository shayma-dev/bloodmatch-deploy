// src/api/requester.js
import http from "./http";

/**
 * GET /requests/dashboard
 * Returns:
 * {
 *   stats: {
 *     openRequests: number,
 *     resolvedRequests: number,
 *     cancelledRequests: number,
 *     totalApplicants: number,
 *     recentActivity: number
 *   },
 *   recentRequests: Array<{
 *     id: string,
 *     createdAt: string,
 *     status: "Open" | "Resolved" | "Cancelled",
 *     bloodType: string,
 *     unitsNeeded: number,
 *     urgency: "Low" | "Normal" | "High" | "Critical",
 *     city: string,
 *     country: string,
 *     applicantCount: number
 *   }>,
 *   recentApplicants: Array<{
 *     id: string,
 *     createdAt: string,
 *     status?: string,
 *     request: { id: string, bloodType: string, urgency: string, city: string },
 *     donor: {
 *       userId: string,
 *       name: string | null,
 *       phone: string | null,
 *       email: string | null,
 *       bloodType: string | null,
 *       city: string | null,
 *       country: string | null,
 *       lastDonationDate: string | null,
 *       photoURL: string | null
 *     }
 *   }>
 * }
 */
export async function getRequesterDashboard() {
  const res = await http.get("/requests/requester-dashboard");
  return res.data;
}