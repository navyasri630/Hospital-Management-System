import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Pages.css";

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/patients", { params: q ? { search: q } : {} });
      setPatients(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => load(search), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this patient record? This cannot be undone.")) return;
    try {
      await api.delete(`/patients/${id}`);
      setPatients((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove patient.");
    }
  };

  const toggleActive = async (patient) => {
    try {
      const { data } = await api.put(`/patients/${patient.id}`, { isActive: !patient.isActive });
      setPatients((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update patient.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Patients</h1>
          <p>{patients.length} registered patient{patients.length === 1 ? "" : "s"}.</p>
        </div>
        <input
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280, padding: "9px 12px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="cell-muted">Loading…</p>}

      {!loading && patients.length === 0 && (
        <div className="empty-state card" style={{ padding: 48 }}>
          No patients match your search.
        </div>
      )}

      {!loading && patients.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td className="cell-name">{p.name}</td>
                  <td className="cell-muted">{p.email}</td>
                  <td className="cell-muted">{p.phone || "—"}</td>
                  <td className="cell-muted" style={{ textTransform: "capitalize" }}>{p.gender || "—"}</td>
                  <td>
                    <span className={`badge ${p.isActive ? "badge-confirmed" : "badge-cancelled"}`}>
                      {p.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/patients/${p.id}`} className="btn btn-outline btn-sm">
                        View
                      </Link>
                      {user.role === "admin" && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => toggleActive(p)}>
                            {p.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                            Remove
                          </button>
                        </>
                      )}
                    </div>
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

export default Patients;
