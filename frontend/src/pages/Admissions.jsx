import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Pages.css";

const Admissions = () => {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [dischargeFor, setDischargeFor] = useState(null);
  const [dischargeForm, setDischargeForm] = useState({ dischargeDate: "", dischargeSummary: "" });

  const emptyForm = {
    patientId: "",
    doctorId: "",
    visitType: "opd",
    reason: "",
    bedId: "",
    admissionDate: new Date().toISOString().split("T")[0],
  };
  const [form, setForm] = useState(emptyForm);

  const canManage = ["admin", "receptionist", "doctor"].includes(user.role);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admissions");
      setAdmissions(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (canManage) {
      api.get("/patients").then((r) => setPatients(r.data)).catch(() => {});
      api.get("/doctors").then((r) => setDoctors(r.data)).catch(() => {});
      api.get("/beds", { params: { status: "available" } }).then((r) => setAvailableBeds(r.data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, doctorId: form.doctorId || undefined, bedId: form.bedId || undefined };
      const { data } = await api.post("/admissions", payload);
      setAdmissions((prev) => [data, ...prev]);
      setShowForm(false);
      setForm(emptyForm);
      if (data.bedId) {
        setAvailableBeds((prev) => prev.filter((b) => b.id !== data.bedId));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create record.");
    }
  };

  const openDischarge = (record) => {
    setDischargeFor(record);
    setDischargeForm({ dischargeDate: new Date().toISOString().split("T")[0], dischargeSummary: "" });
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/admissions/${dischargeFor.id}`, {
        ...dischargeForm,
        status: "discharged",
      });
      setAdmissions((prev) => prev.map((a) => (a.id === data.id ? data : a)));
      setDischargeFor(null);
      if (data.bedId) {
        api.get("/beds", { params: { status: "available" } }).then((r) => setAvailableBeds(r.data)).catch(() => {});
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to discharge.");
    }
  };

  const visible = admissions.filter((a) => filter === "all" || a.visitType === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>OPD / IPD Management</h1>
          <p>Outpatient visits and inpatient admissions, ward &amp; bed tracking, and discharge summaries.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("all")}>All</button>
          <button className={`btn btn-sm ${filter === "opd" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("opd")}>OPD</button>
          <button className={`btn btn-sm ${filter === "ipd" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter("ipd")}>IPD</button>
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              + New record
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="cell-muted">Loading…</p>}

      {!loading && visible.length === 0 && (
        <div className="empty-state card" style={{ padding: 48 }}>No records to show.</div>
      )}

      {!loading && visible.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Type</th>
                <th>Doctor</th>
                <th>Ward / Bed</th>
                <th>Admitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id}>
                  <td className="cell-name">{a.patient?.name}</td>
                  <td>
                    <span className="badge badge-confirmed" style={{ textTransform: "uppercase" }}>{a.visitType}</span>
                  </td>
                  <td className="cell-muted">{a.doctor?.name || "—"}</td>
                  <td className="cell-muted">{a.visitType === "ipd" ? `${a.ward || "—"} / ${a.bedNumber || "—"}` : "—"}</td>
                  <td className="cell-muted">{new Date(a.admissionDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${a.status === "active" ? "badge-pending" : "badge-completed"}`}>{a.status}</span>
                  </td>
                  <td>
                    {canManage && a.status === "active" && (
                      <button className="btn btn-outline btn-sm" onClick={() => openDischarge(a)}>
                        Discharge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>New OPD / IPD record</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="visitType">Visit type</label>
                <select id="visitType" value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })}>
                  <option value="opd">Outpatient (OPD)</option>
                  <option value="ipd">Inpatient (IPD)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="patientId">Patient</label>
                <select id="patientId" required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="doctorId">Attending doctor (optional)</label>
                <select id="doctorId" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}>
                  <option value="">None assigned</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {form.visitType === "ipd" && (
                <div className="form-group">
                  <label htmlFor="bedId">Bed</label>
                  <select id="bedId" required value={form.bedId} onChange={(e) => setForm({ ...form, bedId: e.target.value })}>
                    <option value="">Select an available bed</option>
                    {availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>{b.ward} / {b.bedNumber} ({b.roomType})</option>
                    ))}
                  </select>
                  {availableBeds.length === 0 && (
                    <p className="cell-muted" style={{ marginTop: 6 }}>No beds are currently available. Manage beds from the Rooms &amp; Beds page.</p>
                  )}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="admissionDate">Date</label>
                <input id="admissionDate" type="date" required value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <textarea id="reason" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dischargeFor && (
        <div className="modal-backdrop" onClick={() => setDischargeFor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Discharge {dischargeFor.patient?.name}</h3>
            <form onSubmit={handleDischarge}>
              <div className="form-group">
                <label htmlFor="dDate">Discharge date</label>
                <input
                  id="dDate"
                  type="date"
                  required
                  value={dischargeForm.dischargeDate}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="dSummary">Discharge summary</label>
                <textarea
                  id="dSummary"
                  required
                  value={dischargeForm.dischargeSummary}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeSummary: e.target.value })}
                  placeholder="Condition on discharge, follow-up instructions..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setDischargeFor(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm discharge</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admissions;
