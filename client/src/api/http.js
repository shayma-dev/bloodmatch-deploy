// src/api/http.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Simple token store that other modules can use
let token = null;

export function setToken(nextToken) {
  token = nextToken || null;
  try {
    if (nextToken) {
      localStorage.setItem("bm_token", nextToken);
    } else {
      localStorage.removeItem("bm_token");
    }
  } catch {
    // Ignore storage errors (SSR or private modes)
  }
}

export function getToken() {
  if (token) return token;
  try {
    const stored = localStorage.getItem("bm_token");
    if (stored) token = stored;
  } catch {
    // ignore
  }
  return token;
}

export function clearToken() {
  setToken(null);
}

const http = axios.create({
  baseURL,
  // No refresh cookies for MVP; CORS allowed to 5173 per your backend
  withCredentials: false,
});

// Attach Bearer token if present
http.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// Normalize error objects to match AppError structure for the client
function toAppError(err) {
  // Axios network or timeout error
  if (!err.response) {
    return {
      message: "Network error. Please try again.",
      statusCode: 0,
      error: "NetworkError",
      details: {},
    };
  }
  const { data, status } = err.response;
  // Your backend error handler shape: { message, statusCode, error, details }
  return {
    message: data?.message || "Request failed",
    statusCode: data?.statusCode ?? status ?? 500,
    error: data?.error || "AppError",
    details: data?.details || {},
  };
}

http.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(toAppError(err))
);

export default http;