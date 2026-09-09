import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Pages.css";

const Doctors = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookingFor, setBookingFor] = useState(null);
  const [form, setForm] = useState({ date: "", timeSlot: "", reason: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async (q = "") => {
    setLoading(true);
    try {
      const { data } = await api.get("/doctors", { params: q ? { search: q } : {} });
      setDoctors(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load doctors.");
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

  const openBooking = (doctor) => {
    setBookingFor(doctor);
    setForm({ date: "", timeSlot: "", reason: "" });
    setError("");
    setSuccess("");
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/appointments", {
        doctorId: bookingFor.id,
        date: form.date,
        timeSlot: form.timeSlot,
        reason: form.reason,
      });
      setSuccess("Appointment requested! You can track its status under 'My Appointments'.");
      setTimeout(() => setBookingFor(null), 1600);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to book this appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Find a doctor</h1>
          <p>Browse our specialists and request an appointment.</p>
        </div>
        <input
          placeholder="Search by name or specialization…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280, padding: "9px 12px", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)" }}
        />
      </div>

      {error && !bookingFor && <div className="error-banner">{error}</div>}
      {loading && <p className="cell-muted">Loading doctors…</p>}

      {!loading && doctors.length === 0 && (
        <div className="empty-state card" style={{ padding: 48 }}>
          No doctors match your search.
        </div>
      )}

      <div className="grid-cards">
        {doctors.map((doc) => (
          <div key={doc.id} className="card doctor-card">
            <div className="doctor-avatar">{doc.name.charAt(0)}</div>
            <h3>{doc.name}</h3>
            <div className="spec">{doc.specialization || "General Practice"}</div>
            {doc.department && <div className="cell-muted" style={{ marginBottom: 4 }}>{doc.department} department</div>}
            {doc.workingHours && <div className="cell-muted" style={{ marginBottom: 8 }}>{doc.workingHours}</div>}
            <div style={{ marginBottom: 10 }}>
              <span className={`badge ${doc.availabilityStatus ? "badge-confirmed" : "badge-cancelled"}`}>
                {doc.availabilityStatus ? "available" : "unavailable"}
              </span>
            </div>
            <div className="contact">{doc.email}</div>
            {user.role === "patient" && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => openBooking(doc)}
                disabled={!doc.availabilityStatus}
              >
                Request appointment
              </button>
            )}
          </div>
        ))}
      </div>

      {bookingFor && (
        <div className="modal-backdrop" onClick={() => setBookingFor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Book with {bookingFor.name}</h3>
            {error && <div className="error-banner">{error}</div>}
            {success && (
              <div className="error-banner" style={{ borderColor: "var(--mint-500)", color: "var(--mint-500)", background: "#e2f1ee" }}>
                {success}
              </div>
            )}
            {!success && (
              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label htmlFor="date">Preferred date</label>
                  <input
                    id="date"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="timeSlot">Preferred time slot</label>
                  <input
                    id="timeSlot"
                    required
                    placeholder="e.g. 10:00 AM - 10:30 AM"
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reason">Reason for visit</label>
                  <textarea
                    id="reason"
                    required
                    placeholder="Briefly describe your symptoms or reason for the visit"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setBookingFor(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Booking…" : "Request appointment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
