import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import VitalsStrip from "../components/VitalsStrip.jsx";
import "./Pages.css";

const STATUS_COLORS = {
  pending: "#c98a1f",
  confirmed: "#2e8b74",
  completed: "#3a5a78",
  cancelled: "#c74f43",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [bedAdmissions, setBedAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const showsBeds = ["patient", "doctor"].includes(user.role);

  useEffect(() => {
    const load = async () => {
      try {
        const calls = [api.get("/appointments"), api.get("/dashboard/stats")];
        if (showsBeds) {
          calls.push(api.get("/admissions", { params: { visitType: "ipd", status: "active" } }));
        }
        const [apptRes, statsRes, admissionRes] = await Promise.all(calls);
        setAppointments(apptRes.data);
        setStats(statsRes.data);
        if (admissionRes) setBedAdmissions(admissionRes.data);
      } catch (err) {
        // individual sections handle their own errors elsewhere
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));
  const pending = appointments.filter((a) => a.status === "pending");

  const readings = [
    { label: user.role === "patient" ? "Upcoming visits" : "Active appointments", value: upcoming.length },
    { label: "Awaiting confirmation", value: pending.length },
  ];
  if (stats?.totalDoctors !== undefined) readings.push({ label: "Doctors on staff", value: stats.totalDoctors });
  if (stats?.totalPatients !== undefined) readings.push({ label: "Registered patients", value: stats.totalPatients });
  if (stats?.activeAdmissions !== undefined) readings.push({ label: "Active OPD/IPD", value: stats.activeAdmissions });

  const showCharts = ["admin", "receptionist"].includes(user.role) && stats;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Good to see you, {user.name.split(" ")[0]}</h1>
          <p>Here's what's happening across your account today.</p>
        </div>
      </div>

      <VitalsStrip readings={readings} />

      {showsBeds && bedAdmissions.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24, borderLeft: "4px solid var(--mint-500)" }}>
          <h3 style={{ margin: "0 0 16px" }}>
            {user.role === "patient" ? "Your current bed" : "Your admitted patients"}
          </h3>
          {bedAdmissions.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div>
                {user.role === "doctor" && <div className="cell-name">{a.patient?.name}</div>}
                <div className="cell-name" style={{ color: "var(--teal-900)" }}>
                  {a.ward || a.bed?.ward || "Ward TBD"} · Bed {a.bedNumber || a.bed?.bedNumber || "TBD"}
                </div>
                <div className="cell-muted">
                  {a.bed?.roomType ? `${a.bed.roomType} room · ` : ""}
                  Admitted {new Date(a.admissionDate).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {user.role === "patient" && (
                  <div className="cell-muted">Attending: {a.doctor?.name || "Not yet assigned"}</div>
                )}
                <span className="badge badge-pending" style={{ textTransform: "uppercase" }}>
                  {a.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCharts && (
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Appointments — last 7 days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.appointmentsLast7Days || []}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1f7a6c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Appointments by status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.appointmentsByStatus || []}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={80}
                  label={(entry) => entry.status}
                >
                  {(stats.appointmentsByStatus || []).map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#999"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>
            {user.role === "patient" ? "Your upcoming appointments" : "Upcoming appointments"}
          </h3>
          <Link to="/appointments" className="btn btn-outline btn-sm">
            View all
          </Link>
        </div>

        {loading && <p className="cell-muted">Loading…</p>}

        {!loading && upcoming.length === 0 && (
          <div className="empty-state">
            <p>No upcoming appointments yet.</p>
            {user.role === "patient" && (
              <Link to="/doctors" className="btn btn-primary btn-sm">
                Find a doctor
              </Link>
            )}
          </div>
        )}

        {!loading &&
          upcoming.slice(0, 5).map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div>
                <div className="cell-name">
                  {user.role === "patient" ? a.doctor?.name : a.patient?.name}
                </div>
                <div className="cell-muted">{a.reason}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="cell-name">{new Date(a.date).toLocaleDateString()}</div>
                <div className="cell-muted">{a.timeSlot}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;
