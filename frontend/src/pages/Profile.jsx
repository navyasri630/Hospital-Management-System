import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import DocumentManager from "../components/DocumentManager.jsx";
import "./Pages.css";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    address: user.address || "",
    gender: user.gender || "",
    emergencyContactName: user.emergencyContactName || "",
    emergencyContactPhone: user.emergencyContactPhone || "",
    allergies: user.allergies || "",
    vaccinationHistory: user.vaccinationHistory || "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      const { data } = await api.put(`/patients/${user.id}`, form);
      const merged = { ...user, ...data };
      setUser(merged);
      localStorage.setItem("hms_user", JSON.stringify(merged));
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update profile.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My profile</h1>
          <p>Keep your contact and medical details up to date.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 560, marginBottom: 24 }}>
        {error && <div className="error-banner">{error}</div>}
        {saved && (
          <div className="error-banner" style={{ borderColor: "var(--mint-500)", color: "var(--mint-500)", background: "#e2f1ee" }}>
            Profile updated.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="profile-grid">
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input id="name" value={form.name} onChange={update("name")} />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" value={form.phone} onChange={update("phone")} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input id="address" value={form.address} onChange={update("address")} />
          </div>
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={form.gender} onChange={update("gender")}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <h4 style={{ marginTop: 22 }}>Emergency contact</h4>
          <div className="profile-grid">
            <div className="form-group">
              <label htmlFor="ecName">Name</label>
              <input id="ecName" value={form.emergencyContactName} onChange={update("emergencyContactName")} />
            </div>
            <div className="form-group">
              <label htmlFor="ecPhone">Phone</label>
              <input id="ecPhone" value={form.emergencyContactPhone} onChange={update("emergencyContactPhone")} />
            </div>
          </div>

          <h4 style={{ marginTop: 22 }}>Medical history</h4>
          <div className="form-group">
            <label htmlFor="allergies">Known allergies</label>
            <textarea id="allergies" value={form.allergies} onChange={update("allergies")} placeholder="e.g. Penicillin, Peanuts" />
          </div>
          <div className="form-group">
            <label htmlFor="vaccinationHistory">Vaccination history</label>
            <textarea
              id="vaccinationHistory"
              value={form.vaccinationHistory}
              onChange={update("vaccinationHistory")}
              placeholder="e.g. COVID-19 booster - March 2025"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input value={user.email} disabled />
          </div>
          <button className="btn btn-primary" type="submit">
            Save changes
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 560 }}>
        <h3 style={{ marginBottom: 16 }}>My documents</h3>
        <DocumentManager patientId={user.id} />
      </div>
    </div>
  );
};

export default Profile;
