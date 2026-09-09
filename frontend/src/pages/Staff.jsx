import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Pages.css";

const ROLE_FILTERS = ["all", "doctor", "receptionist", "admin"];

const Staff = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const load = async (q = "", role = "all") => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (q) params.search = q;
      if (role !== "all") params.role = role;
      const { data } = await api.get("/staff", { params });
      setStaff(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load staff.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => load(search, roleFilter), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const toggleActive = async (member) => {
    try {
      const { data } = await api.put(`/staff/${member.id}/toggle-active`);
      setStaff((prev) => prev.map((s) => (s.id === data.id ? data : s)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update staff member.");
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Remove ${member.name}'s account? This cannot be undone.`)) return;
    try {
      await api.delete(`/staff/${member.id}`);
      setStaff((prev) => prev.filter((s) => s.id !== member.id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove staff member.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Staff directory</h1>
          <p>{staff.length} staff account{staff.length === 1 ? "" : "s"} across doctors, reception, and admin.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 220, padding: "9px 12px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
          />
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              className={`btn btn-sm ${roleFilter === r ? "btn-primary" : "btn-outline"}`}
              onClick={() => setRoleFilter(r)}
              style={{ textTransform: "capitalize" }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="cell-muted">Loading…</p>}

      {!loading && staff.length === 0 && (
        <div className="empty-state card" style={{ padding: 48 }}>No staff match this search.</div>
      )}

      {!loading && staff.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Details</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="cell-name">{s.name}</td>
                  <td className="cell-muted" style={{ textTransform: "capitalize" }}>{s.role}</td>
                  <td className="cell-muted">{s.email}</td>
                  <td className="cell-muted">
                    {s.role === "doctor" ? `${s.specialization || "—"}${s.department ? ` · ${s.department}` : ""}` : "—"}
                  </td>
                  <td>
                    <span className={`badge ${s.isActive ? "badge-confirmed" : "badge-cancelled"}`}>
                      {s.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td>
                    {String(s.id) !== String(user.id) && (
                      <div className="row-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => toggleActive(s)}>
                          {s.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}>
                          Remove
                        </button>
                      </div>
                    )}
                    {String(s.id) === String(user.id) && <span className="cell-muted">You</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Staff;
