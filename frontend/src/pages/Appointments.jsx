import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Pages.css";

const STATUS_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [noteForm, setNoteForm] = useState({ diagnosis: "", notes: "", prescription: "" });
  const [rescheduling, setRescheduling] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", timeSlot: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/appointments");
      setAppointments(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/appointments/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? data : a)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update appointment.");
    }
  };

  const openNotes = (appt) => {
    setEditing(appt);
    setNoteForm({ diagnosis: appt.diagnosis || "", notes: appt.notes || "", prescription: appt.prescription || "" });
  };

  const saveNotes = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/appointments/${editing.id}/status`, {
        status: "completed",
        diagnosis: noteForm.diagnosis,
        notes: noteForm.notes,
        prescription: noteForm.prescription,
      });
      setAppointments((prev) => prev.map((a) => (a.id === data.id ? data : a)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save notes.");
    }
  };

  const openReschedule = (appt) => {
    setRescheduling(appt);
    setRescheduleForm({ date: appt.date, timeSlot: appt.timeSlot });
  };

  const saveReschedule = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/appointments/${rescheduling.id}/reschedule`, rescheduleForm);
      setAppointments((prev) => prev.map((a) => (a.id === data.id ? data : a)));
      setRescheduling(null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reschedule.");
    }
  };

  const downloadPrescription = (appt) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Meridian Hospital — Prescription", 14, 20);
    doc.setFontSize(11);
    doc.text(`Patient: ${appt.patient?.name || ""}`, 14, 34);
    doc.text(`Doctor: ${appt.doctor?.name || ""} (${appt.doctor?.specialization || ""})`, 14, 42);
    doc.text(`Date: ${new Date(appt.date).toLocaleDateString()}   Time: ${appt.timeSlot}`, 14, 50);
    doc.text("Diagnosis:", 14, 64);
    doc.text(doc.splitTextToSize(appt.diagnosis || "-", 180), 14, 71);
    doc.text("Prescription:", 14, 92);
    doc.text(doc.splitTextToSize(appt.prescription || "-", 180), 14, 99);
    doc.text("Notes:", 14, 120);
    doc.text(doc.splitTextToSize(appt.notes || "-", 180), 14, 127);
    doc.save(`prescription-${appt.id}.pdf`);
  };

  const visible = appointments.filter((a) => filter === "all" || a.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{user.role === "patient" ? "My appointments" : "Appointments"}</h1>
          <p>Track status from request through to completed visit.</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="cell-muted">Loading…</p>}

      {!loading && visible.length === 0 && (
        <div className="empty-state card" style={{ padding: 48 }}>
          No appointments in this view.
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>{user.role === "patient" ? "Doctor" : "Patient"}</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id}>
                  <td className="cell-name">{user.role === "patient" ? a.doctor?.name : a.patient?.name}</td>
                  <td className="cell-muted">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="cell-muted">{a.timeSlot}</td>
                  <td className="cell-muted" style={{ maxWidth: 220 }}>{a.reason}</td>
                  <td>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </td>
                  <td>
                    <div className="status-actions">
                      {user.role === "doctor" && a.status === "pending" && (
                        <button className="btn btn-outline btn-sm" onClick={() => updateStatus(a.id, "confirmed")}>
                          Confirm
                        </button>
                      )}
                      {user.role === "doctor" && a.status === "confirmed" && (
                        <button className="btn btn-outline btn-sm" onClick={() => openNotes(a)}>
                          Complete
                        </button>
                      )}
                      {(user.role === "doctor" || user.role === "admin") && a.status === "completed" && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => openNotes(a)}>
                            View notes
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => downloadPrescription(a)}>
                            PDF
                          </button>
                        </>
                      )}
                      {user.role === "patient" && a.status === "completed" && a.prescription && (
                        <button className="btn btn-outline btn-sm" onClick={() => downloadPrescription(a)}>
                          Download prescription
                        </button>
                      )}
                      {["pending", "confirmed"].includes(a.status) && user.role !== "doctor" && (
                        <button className="btn btn-outline btn-sm" onClick={() => openReschedule(a)}>
                          Reschedule
                        </button>
                      )}
                      {["pending", "confirmed"].includes(a.status) && (
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(a.id, "cancelled")}>
                          Cancel
                        </button>
                      )}
                      {user.role === "admin" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            if (!window.confirm("Delete this appointment permanently?")) return;
                            try {
                              await api.delete(`/appointments/${a.id}`);
                              setAppointments((prev) => prev.filter((x) => x.id !== a.id));
                            } catch (err) {
                              setError(err.response?.data?.message || "Unable to delete.");
                            }
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Visit notes — {editing.patient?.name}</h3>
            <form onSubmit={saveNotes}>
              <div className="form-group">
                <label htmlFor="diagnosis">Diagnosis</label>
                <textarea
                  id="diagnosis"
                  value={noteForm.diagnosis}
                  onChange={(e) => setNoteForm({ ...noteForm, diagnosis: e.target.value })}
                  readOnly={editing.status === "completed" && user.role !== "doctor"}
                  placeholder="Diagnosis"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Clinical notes</label>
                <textarea
                  id="notes"
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                  readOnly={editing.status === "completed" && user.role !== "doctor"}
                  placeholder="Observations, follow-up..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="prescription">Prescription</label>
                <textarea
                  id="prescription"
                  value={noteForm.prescription}
                  onChange={(e) => setNoteForm({ ...noteForm, prescription: e.target.value })}
                  readOnly={editing.status === "completed" && user.role !== "doctor"}
                  placeholder="Medication and dosage"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>
                  Close
                </button>
                {user.role === "doctor" && (
                  <button type="submit" className="btn btn-primary">
                    Mark completed &amp; save
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {rescheduling && (
        <div className="modal-backdrop" onClick={() => setRescheduling(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Reschedule appointment</h3>
            <form onSubmit={saveReschedule}>
              <div className="form-group">
                <label htmlFor="rDate">New date</label>
                <input
                  id="rDate"
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="rSlot">New time slot</label>
                <input
                  id="rSlot"
                  required
                  value={rescheduleForm.timeSlot}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, timeSlot: e.target.value })}
                />
              </div>
              <p className="cell-muted">Rescheduling resets the status back to "pending" for re-confirmation.</p>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setRescheduling(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save new time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
