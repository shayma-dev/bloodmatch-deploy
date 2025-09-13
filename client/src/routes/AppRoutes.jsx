// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import RoleGate from "../auth/RoleGate";
import Landing from "../pages/Landing";
import NotFound from "../pages/NotFound";
import AppLayoutRoute from "../ui/layout/AppLayoutRoute";

// Profiles
import DonorProfile from "../pages/donor/Profile";
import RequesterProfile from "../pages/requester/Profile";

// Donor pages
import DonorDashboard from "../pages/donor/Dashboard"; // ADDED
import MatchingRequests from "../pages/donor/MatchingRequests";
import RequestDetails from "../pages/donor/RequestDetails";

// Requester pages
import RequesterDashboard from "../pages/requester/Dashboard";
import CreateOrEditRequest from "../pages/requester/CreateOrEditRequest"; // Unified page
import MyRequests from "../pages/requester/MyRequests";
import RequestApplicants from "../pages/requester/RequestApplicants";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public landing; will redirect if user is logged in (handled inside Landing) */}
      <Route path="/" element={<Landing />} />

      {/* Protected area uses AppLayout for all children */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayoutRoute />}>
          {/* Donor */}
          <Route
            path="/donor/dashboard"
            element={
              <RoleGate role="DONOR">
                <DonorDashboard />
              </RoleGate>
            }
          />
          <Route
            path="/donor/profile"
            element={
              <RoleGate role="DONOR">
                <DonorProfile />
              </RoleGate>
            }
          />
          <Route
            path="/donor/requests"
            element={
              <RoleGate role="DONOR">
                <MatchingRequests />
              </RoleGate>
            }
          />
          <Route
            path="/donor/requests/:id"
            element={
              <RoleGate role="DONOR">
                <RequestDetails />
              </RoleGate>
            }
          />

          {/* Requester */}
          <Route
            path="/requester/dashboard"
            element={
              <RoleGate role="REQUESTER">
                <RequesterDashboard />
              </RoleGate>
            }
          />
          <Route
            path="/requester/profile"
            element={
              <RoleGate role="REQUESTER">
                <RequesterProfile />
              </RoleGate>
            }
          />
          <Route
            path="/requester/requests"
            element={
              <RoleGate role="REQUESTER">
                <MyRequests />
              </RoleGate>
            }
          />

          {/* Unified Create/Edit page */}
          <Route
            path="/requester/requests/new"
            element={
              <RoleGate role="REQUESTER">
                <CreateOrEditRequest />
              </RoleGate>
            }
          />
          <Route
            path="/requester/requests/:id/edit"
            element={
              <RoleGate role="REQUESTER">
                <CreateOrEditRequest />
              </RoleGate>
            }
          />

          <Route
            path="/requester/requests/:id/applications"
            element={
              <RoleGate role="REQUESTER">
                <RequestApplicants />
              </RoleGate>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
