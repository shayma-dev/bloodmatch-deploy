// src/api/requests.js
import http from "./http";

/**
 * Create a new request (Requester-only)
 * Required payload:
 * {
 *   bloodType: "A+"|"A-"|"B+"|"B-"|"AB+"|"AB-"|"O+"|"O-",
 *   unitsNeeded: number (>=1),
 *   urgency: "Low"|"Normal"|"High"|"Critical",
 *   caseDescription: string (<=300),
 *   city?: string,   // optional; server will default from requester profile if omitted
 *   country?: string // optional; server will default from requester profile if omitted
 * }
 * Returns: Request object created by server
 */
export async function createRequest(payload) {
  const { data } = await http.post("/requests", payload);
  return data;
}

/**
 * Update a request (Requester-only)
 * Allowed fields:
 *  - unitsNeeded: integer ≥ 1
 *  - urgency: "Low" | "Normal" | "High" | "Critical"
 *  - caseDescription: string ≤ 300 chars
 *  - status: "Open" | "Resolved" | "Cancelled"
 *
 * @param {string} id - Request ID (UUID)
 * @param {Partial<{
 *   unitsNeeded: number;
 *   urgency: "Low" | "Normal" | "High" | "Critical";
 *   caseDescription: string;
 *   status: "Open" | "Resolved" | "Cancelled";
 * }>} updates
 * @returns {Promise<Request>} Updated Request object
 */
export async function updateRequest(id, updates) {
  const { data } = await http.patch(`/requests/${id}`, updates);
  return data;
}
/**
 * Get the current requester's requests with applicant counts (Requester-only)
 * Returns: Array<{ ...request, applicantCount: number }>
 */
export async function getMyRequests() {
  const { data } = await http.get("/requests/my/requests");
  return data;
}


/**
 * Convenience wrapper to update only the status.
 * Prefer calling updateRequest(id, { status }) directly in new code.
 */
export async function updateRequestStatus(id, status) {
  return updateRequest(id, { status });
}

/**
 * Get applicants for a specific request (Requester-only, must own the request)
 * @param {string} id - Request ID
 * Returns: Array of applications with donor info
 */
export async function getApplicants(id) {
  const { data } = await http.get(`/requests/${id}/applicants`);
  return data;
}

/**
 * Get a request by ID (Authorized: Donor or Requester)
 * @param {string} id - Request ID
 * @param {{ noCache?: boolean }} [opts]
 * @returns {Promise<any>} Request object
 */
export async function getRequestById(id, opts = {}) {
  const noCache = opts.noCache ? `?ts=${Date.now()}` : "";
  const { data } = await http.get(`/requests/${id}${noCache}`);
  return data;
}

export async function getMatchingRequests(opts = {}) {
  const noCache = opts.noCache ? `?ts=${Date.now()}` : "";
  const { data } = await http.get(`/requests${noCache}`);
  return data;
}