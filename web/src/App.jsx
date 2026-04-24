import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminClasses from "./pages/admin/Classes.jsx";
import AdminStaff from "./pages/admin/Staff.jsx";
import AdminMemberships from "./pages/admin/Memberships.jsx";
import AdminAttendance from "./pages/admin/Attendance.jsx";
import AdminSettings from "./pages/admin/Settings.jsx";
import ReceptionScan from "./pages/reception/Scan.jsx";
import ReceptionIssueMembership from "./pages/reception/IssueMembership.jsx";

const ALLOWED_ROLES = ["gym_admin", "front_desk"];

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: 0.1,
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!ALLOWED_ROLES.includes(user.role)) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          className="display upper"
          style={{ fontSize: 20, color: "var(--accent)" }}
        >
          Access Denied
        </div>
        <div
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--mono)",
            fontSize: 12,
          }}
        >
          This portal is for gym staff only.
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("kn.token");
            window.location.href = "/login";
          }}
          style={{
            color: "var(--coral)",
            fontFamily: "var(--mono)",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.1,
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  const isAdmin = user.role === "gym_admin";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <Routes>
          {isAdmin ? (
            <>
              <Route
                path="/"
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/classes" element={<AdminClasses />} />
              <Route path="/admin/staff" element={<AdminStaff />} />
              <Route path="/admin/memberships" element={<AdminMemberships />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route
                path="*"
                element={<Navigate to="/admin/dashboard" replace />}
              />
            </>
          ) : (
            <>
              <Route
                path="/"
                element={<Navigate to="/reception/scan" replace />}
              />
              <Route path="/reception/scan" element={<ReceptionScan />} />
              <Route
                path="/reception/issue"
                element={<ReceptionIssueMembership />}
              />
              <Route
                path="*"
                element={<Navigate to="/reception/scan" replace />}
              />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
