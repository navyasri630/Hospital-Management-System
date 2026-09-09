import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Pages.css";

const downloadCSV = (filename, rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const StatCard = ({ label, value }) => (
  <div className="card" style={{ padding: 18 }}>
    <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--teal-900)" }}>{value}</div>
  </div>
);

const Reports = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [doctors, setDoctors] = useState(null);
  const [beds, setBeds] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const calls = [api.get("/reports/patients"), api.get("/reports/appointments"), api.get("/reports/beds")];
        if (user.role === "admin") {
          calls.push(api.get("/reports/revenue"), api.get("/reports/doctor-performance"));
        }
        const results = await Promise.all(calls);
        setPatients(results[0].data);
        setAppointments(results[1].data);
        setBeds(results[2].data);
        if (user.role === "admin") {
          setRevenue(results[3].data);
          setDoctors(results[4].data);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load reports.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.role]);

  if (loading) return <p className="cell-muted">Loading reports…</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports &amp; analytics</h1>
          <p>Snapshot of patients, appointments, revenue, and bed occupancy.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {patients && (
        <>
          <h3 style={{ marginBottom: 12 }}>Patient statistics</h3>
          <div className="grid-cards" style={{ marginBottom: 24 }}>
            <StatCard label="Total patients" value={patients.total} />
            <StatCard label="Active" value={patients.active} />
            <StatCard label="Inactive" value={patients.inactive} />
          </div>
        </>
      )}

      {appointments && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Appointment report</h3>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => downloadCSV("appointment-report.csv", appointments.byStatus)}
            >
              Download CSV
            </button>
          </div>
          <div className="card table-card" style={{ marginBottom: 24 }}>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {appointments.byStatus.map((row) => (
                  <tr key={row.status}>
                    <td className="cell-name" style={{ textTransform: "capitalize" }}>{row.status}</td>
                    <td className="cell-muted">{row.count}</td>
                  </tr>
                ))}
                <tr>
                  <td className="cell-name">Total</td>
                  <td className="cell-name">{appointments.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {revenue && (
        <>
          <h3 style={{ marginBottom: 12 }}>Revenue report</h3>
          <div className="grid-cards" style={{ marginBottom: 24 }}>
            <StatCard label="Total billed" value={`$${revenue.totalBilled.toFixed(2)}`} />
            <StatCard label="Total collected" value={`$${revenue.totalPaid.toFixed(2)}`} />
            <StatCard label="Outstanding" value={`$${revenue.totalOutstanding.toFixed(2)}`} />
            <StatCard label="Refunded" value={`$${revenue.totalRefunded.toFixed(2)}`} />
          </div>
        </>
      )}

      {doctors && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Doctor performance</h3>
            <button className="btn btn-outline btn-sm" onClick={() => downloadCSV("doctor-performance.csv", doctors)}>
              Download CSV
            </button>
          </div>
          <div className="card table-card" style={{ marginBottom: 24 }}>
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Total</th>
                  <th>Completed</th>
                  <th>Cancelled</th>
                  <th>Completion rate</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.doctorId}>
                    <td className="cell-name">{d.name}</td>
                    <td className="cell-muted">{d.specialization || "—"}</td>
                    <td className="cell-muted">{d.totalAppointments}</td>
                    <td className="cell-muted">{d.completed}</td>
                    <td className="cell-muted">{d.cancelled}</td>
                    <td className="cell-muted">{d.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {beds && (
        <>
          <h3 style={{ marginBottom: 12 }}>Bed occupancy</h3>
          <div className="grid-cards">
            <StatCard label="Total beds" value={beds.total} />
            <StatCard label="Occupied" value={beds.occupied} />
            <StatCard label="Available" value={beds.available} />
            <StatCard label="Occupancy rate" value={`${beds.occupancyRate}%`} />
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
