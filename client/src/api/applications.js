// src/api/applications.js
import http from "./http";

/**
 * Apply to a specific request (Donor-only)
 * POST /requests/:id/apply
 *
 * @param {string} requestId - Request UUID
 * @returns {Promise<{
 *   id: string,
 *   requestId: string,
 *   donorId: string,
 *   status: "Applied" | "Withdrawn",
 *   createdAt: string
 * }>}
 *
 * Errors you may handle:
 * - 400 ValidationError: missing/invalid lastDonationDate, not eligible, mismatch, duplicate application
 * - 403 AppError: Only donors can apply
 * - 404 NotFoundError: Request not found
 */
export async function applyToRequest(requestId) {
  const { data } = await http.post(`/requests/${requestId}/apply`);
  return data;
}

/**
 * Withdraw an application (Donor-only)
 * POST /applications/:id/withdraw
 *
 * @param {string} applicationId - Application UUID
 * @returns {Promise<{
 *   id: string,
 *   requestId: string,
 *   donorId: string,
 *   status: "Withdrawn",
 *   createdAt: string
 * }>}
 *
 * Errors you may handle:
 * - 400 ValidationError: Only 'Applied' applications can be withdrawn
 * - 403 AppError: Only donors or not owner of the application
 * - 404 NotFoundError: Application not found
 */
export async function withdrawApplication(applicationId) {
  const { data } = await http.post(`/requests/applications/${applicationId}/withdraw`);
  return data;
}

/**
 * Get my applications (Donor-only)
 * GET /my/applications
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   requestId: string,
 *   donorId: string,
 *   status: "Applied" | "Withdrawn",
 *   createdAt: string,
 *   request: {
 *     id: string,
 *     bloodType: string,
 *     city: string,
 *     country: string,
 *     status: "Open" | "Resolved" | "Cancelled",
 *     unitsNeeded: number,
 *     urgency: "Low" | "Normal" | "High" | "Critical",
 *     caseDescription: string
 *   }
 * }>>}
 *
 * Errors you may handle:
 * - 403 AppError: Only donors can view their applications
 * - 400/500 as per your handler
 */
export async function getMyApplications() {
  const { data } = await http.get("/my/applications");
  return data;
}