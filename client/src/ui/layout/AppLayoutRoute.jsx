// src/ui/layout/AppLayoutRoute.jsx
import { Outlet } from "react-router-dom";
import useAuth from "../../auth/useAuth";
import AppLayout from "./AppLayout";

export default function AppLayoutRoute() {
  const { user, logout } = useAuth();
  return (
    <AppLayout user={user} onLogout={logout}>
      <Outlet />
    </AppLayout>
  );
}