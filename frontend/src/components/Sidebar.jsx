import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import "./Sidebar.css";

const linksByRole = {
  admin: [
    { to: "/dashboard", label: "Overview" },
    { to: "/patients", label: "Patients" },
    { to: "/doctors", label: "Doctors" },
    { to: "/appointments", label: "Appointments" },
    { to: "/admissions", label: "OPD / IPD" },
    { to: "/beds", label: "Rooms & Beds" },
    { to: "/billing", label: "Billing" },
    { to: "/staff", label: "Staff Directory" },
    { to: "/staff/new", label: "Add Staff" },
    { to: "/reports", label: "Reports" },
    { to: "/audit-logs", label: "Audit Logs" },
  ],
  receptionist: [
    { to: "/dashboard", label: "Overview" },
    { to: "/patients", label: "Patients" },
    { to: "/doctors", label: "Doctors" },
    { to: "/appointments", label: "Appointments" },
    { to: "/admissions", label: "OPD / IPD" },
    { to: "/beds", label: "Rooms & Beds" },
    { to: "/billing", label: "Billing" },
    { to: "/reports", label: "Reports" },
  ],
  doctor: [
    { to: "/dashboard", label: "Overview" },
    { to: "/appointments", label: "My Appointments" },
    { to: "/patients", label: "Patients" },
    { to: "/admissions", label: "OPD / IPD" },
    { to: "/beds", label: "Rooms & Beds" },
  ],
  patient: [
    { to: "/dashboard", label: "Overview" },
    { to: "/doctors", label: "Find a Doctor" },
    { to: "/appointments", label: "My Appointments" },
    { to: "/billing", label: "My Bills" },
    { to: "/profile", label: "My Profile" },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const links = linksByRole[user?.role] || [];
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/login");
  };

  // Close the mobile menu automatically whenever the route changes
  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-topbar">
        <div className="sidebar-brand">
          <span className="sidebar-mark">+</span>
          <div>
            <div className="sidebar-title">Meridian</div>
            <div className="sidebar-subtitle eyebrow">Hospital System</div>
          </div>
        </div>
        <button
          className="sidebar-menu-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      <div className="sidebar-collapsible">
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="btn btn-outline btn-sm theme-toggle"
            onClick={toggleTheme}
            style={{ width: "100%" }}
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
          </button>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role eyebrow">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ width: "100%" }}>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
