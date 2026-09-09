import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import AppShell from "./components/AppShell.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Doctors from "./pages/Doctors.jsx";
import Patients from "./pages/Patients.jsx";
import PatientDetail from "./pages/PatientDetail.jsx";
import Appointments from "./pages/Appointments.jsx";
import Admissions from "./pages/Admissions.jsx";
import Beds from "./pages/Beds.jsx";
import Billing from "./pages/Billing.jsx";
import Staff from "./pages/Staff.jsx";
import Reports from "./pages/Reports.jsx";
import Profile from "./pages/Profile.jsx";
import AddStaff from "./pages/AddStaff.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";

function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13.5 } }} />
      <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
      <Route path="/reset-password/:token" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AppShell>
              <Dashboard />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/doctors"
        element={
          <PrivateRoute>
            <AppShell>
              <Doctors />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <PrivateRoute roles={["admin", "doctor", "receptionist"]}>
            <AppShell>
              <Patients />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <PrivateRoute roles={["admin", "doctor", "receptionist"]}>
            <AppShell>
              <PatientDetail />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <PrivateRoute>
            <AppShell>
              <Appointments />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/admissions"
        element={
          <PrivateRoute roles={["admin", "receptionist", "doctor"]}>
            <AppShell>
              <Admissions />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/beds"
        element={
          <PrivateRoute roles={["admin", "receptionist", "doctor"]}>
            <AppShell>
              <Beds />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <PrivateRoute roles={["admin", "receptionist", "patient"]}>
            <AppShell>
              <Billing />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <PrivateRoute roles={["admin"]}>
            <AppShell>
              <Staff />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute roles={["admin", "receptionist"]}>
            <AppShell>
              <Reports />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute roles={["patient"]}>
            <AppShell>
              <Profile />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/staff/new"
        element={
          <PrivateRoute roles={["admin"]}>
            <AppShell>
              <AddStaff />
            </AppShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <PrivateRoute roles={["admin"]}>
            <AppShell>
              <AuditLogs />
            </AppShell>
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
    </>
  );
}

export default App;
