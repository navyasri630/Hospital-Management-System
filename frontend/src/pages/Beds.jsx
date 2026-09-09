import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Pages.css";

const STATUS_FILTERS = ["all", "available", "occupied", "maintenance"];
const canManageInventory = (role) => role === "admin";
const canAllocate = (role) => ["admin", "receptionist"].includes(role);

const Beds = () => {
  const { user } = useAuth();
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bedNumber: "", ward: "", roomType: "general" });
  const [assignFor, setAssignFor] = useState(null); // bed being assigned to a patient
  const [assignForm, setAssignForm] = useState({
    patientId: "",
    doctorId: "",
    reason: "",
    admissionDate: new Date().toISOString().split("T")[0],
  });
  const [assignError, setAssignError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/beds");
      setBeds(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load beds.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (canAllocate(user.role)) {
      api.get("/patients").then((r) => setPatients(r.data)).catch(() => {});
      api.get("/doctors").then((r) => setDoctors(r.data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/beds", form);
      setBeds((prev) => [...prev, data]);
      setShowForm(false);
      setForm({ bedNumber: "", ward: "", roomType: "general" });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add bed.");
    }
  };

  const toggleMaintenance = async (bed) => {
    const nextStatus = bed.status === "maintenance" ? "available" : "maintenance";
    try {
      const { data } = await api.put(`/beds/${bed.id}`, { status: nextStatus });
      setBeds((prev) => prev.map((b) => (b.id === data.id ? data : b)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update bed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this bed from the inventory?")) return;
    try {
      await api.delete(`/beds/${id}`);
      setBeds((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove bed.");
    }
  };

  const openAssign = (bed) => {
    setAssignFor(bed);
    setAssignError("");
    setAssignForm({ patientId: "", doctorId: "", reason: "", admissionDate: new Date().toISOString().split("T")[0] });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignError("");
    try {
      await api.post("/admissions", {
        patientId: assignForm.patientId,
        doctorId: assignForm.doctorId || undefined,
        visitType: "ipd",
        reason: assignForm.reason,
        admissionDate: assignForm.admissionDate,
        bedId: assignFor.id,
      });
      setBeds((prev) => prev.map((b) => (b.id === assignFor.id ? { ...b, status: "occupied" } : b)));
      setAssignFor(null);
    } catch (err) {
      setAssignError(err.response?.data?.message || "Unable to assign this bed.");
    }
  };

  // Release a bed directly: finds and discharges its active admission
  const handleRelease = async (bed) => {
    if (!window.confirm(`Release ${bed.ward} / ${bed.bedNumber}? This discharges the current patient.`)) return;
    try {
      const { data: admissions } = await api.get("/admissions", { params: { status: "active" } });
      const active = admissions.find((a) => a.bedId === bed.id || a.bed?.id === bed.id);
      if (!active) {
        setError("Couldn't find the active admission for this bed. Discharge it from the OPD/IPD page instead.");
        return;
      }
      await api.put(`/admissions/${active.id}`, {
        status: "discharged",
        dischargeDate: new Date().toISOString().split("T")[0],
      });
      setBeds((prev) => prev.map((b) => (b.id === bed.id ? { ...b, status: "available" } : b)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to release this bed.");
    }
  };

  const visible = beds.filter((b) => filter === "all" || b.status === filter);
  const occupied = beds.filter((b) => b.status === "occupied").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Rooms &amp; beds</h1>
          <p>{beds.length} total · {occupied} occupied · {beds.length ? Math.round((occupied / beds.length) * 100) : 0}% occupancy</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter(s)}
              style={{ textTransform: "capitalize" }}
            >
              {s}
            </button>
          ))}
          {canManageInventory(user.role) && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              + Add bed
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="cell-muted">Loading…</p>}

      {!loading && visible.length === 0 && (
        <div className="empty-state card" style={{ padding: 48 }}>No beds match this filter.</div>
      )}

      {!loading && visible.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Bed</th>
                <th>Ward</th>
                <th>Type</th>
                <th>Status</th>
                {canAllocate(user.role) && <th></th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b.id}>
                  <td className="cell-name">{b.bedNumber}</td>
                  <td className="cell-muted">{b.ward}</td>
                  <td className="cell-muted" style={{ textTransform: "capitalize" }}>{b.roomType}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.status === "available" ? "badge-confirmed" : b.status === "occupied" ? "badge-pending" : "badge-cancelled"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  {canAllocate(user.role) && (
                    <td>
                      <div className="row-actions">
                        {b.status === "available" && (
                          <button className="btn btn-primary btn-sm" onClick={() => openAssign(b)}>
                            Assign to patient
                          </button>
                        )}
                        {b.status === "occupied" && (
                          <button className="btn btn-outline btn-sm" onClick={() => handleRelease(b)}>
                            Release / discharge
                          </button>
                        )}
                        {canManageInventory(user.role) && b.status !== "occupied" && (
                          <button className="btn btn-outline btn-sm" onClick={() => toggleMaintenance(b)}>
                            {b.status === "maintenance" ? "Mark available" : "Mark maintenance"}
                          </button>
                        )}
                        {canManageInventory(user.role) && b.status !== "occupied" && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add a bed</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="bedNumber">Bed number</label>
                <input id="bedNumber" required value={form.bedNumber} onChange={(e) => setForm({ ...form, bedNumber: e.target.value })} placeholder="e.g. C-303" />
              </div>
              <div className="form-group">
                <label htmlFor="ward">Ward</label>
                <input id="ward" required value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} placeholder="e.g. General Ward C" />
              </div>
              <div className="form-group">
                <label htmlFor="roomType">Room type</label>
                <select id="roomType" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
                  <option value="general">General</option>
                  <option value="semi-private">Semi-private</option>
                  <option value="private">Private</option>
                  <option value="icu">ICU</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add bed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignFor && (
        <div className="modal-backdrop" onClick={() => setAssignFor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Assign {assignFor.ward} / {assignFor.bedNumber}</h3>
            {assignError && <div className="error-banner">{assignError}</div>}
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label htmlFor="patientId">Patient</label>
                <select
                  id="patientId"
                  required
                  value={assignForm.patientId}
                  onChange={(e) => setAssignForm({ ...assignForm, patientId: e.target.value })}
                >
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="doctorId">Attending doctor (optional)</label>
                <select
                  id="doctorId"
                  value={assignForm.doctorId}
                  onChange={(e) => setAssignForm({ ...assignForm, doctorId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="admissionDate">Admission date</label>
                <input
                  id="admissionDate"
                  type="date"
                  required
                  value={assignForm.admissionDate}
                  onChange={(e) => setAssignForm({ ...assignForm, admissionDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="reason">Reason for admission</label>
                <textarea
                  id="reason"
                  required
                  placeholder="Brief reason for the inpatient stay"
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setAssignFor(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign bed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beds;
