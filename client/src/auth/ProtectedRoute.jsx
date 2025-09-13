// src/auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "./useAuth";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }} className="muted">Loading...</div>;
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;

  return <Outlet />;
}