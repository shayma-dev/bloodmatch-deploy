// src/auth/RoleGate.jsx
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "./useAuth";

export default function RoleGate({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 16 }} className="muted">Loading...</div>;
  if (!user) return <Navigate to="/" replace state={{ from: location }} />;
  if (user.role !== role) return <Navigate to="/" replace />;

  return children;
}