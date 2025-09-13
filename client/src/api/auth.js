// src/api/auth.js
import http, { setToken, clearToken, getToken } from "./http";

/**
 * Signup
 * @param {{ email: string, password: string, role: "DONOR"|"REQUESTER" }} payload
 * @returns {Promise<{ token: string }>}
 */
export async function signup(payload) {
  // role must be "DONOR" or "REQUESTER"
  const { data } = await http.post("/auth/signup", payload);
  if (data?.token) setToken(data.token);
  return data; // { token }
}

/**
 * Login
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ token: string }>}
 */
export async function login(payload) {
  const { data } = await http.post("/auth/login", payload);
  if (data?.token) setToken(data.token);
  return data; // { token }
}

/**
 * Logout (client-side only for MVP)
 * Clears the stored token; server has no logout endpoint.
 */
export function logout() {
  clearToken();
}

/**
 * Access current token (if any)
 */
export function getAuthToken() {
  return getToken();
}