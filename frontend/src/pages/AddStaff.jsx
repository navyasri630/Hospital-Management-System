import React, { useState } from "react";
import api from "../api/axios.js";
import "./Pages.css";

const AddStaff = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor",
    specialization: "",
    department: "",
    workingHours: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const roleLabel = { doctor: "Doctor", admin: "Admin", receptionist: "Receptionist" };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/auth/create-staff", form);
      setSuccess(`${roleLabel[form.role]} account created for ${form.name}.`);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "doctor",
        specialization: "",
        department: "",
        workingHours: "",
        phone: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Add staff</h1>
          <p>Create doctor, receptionist, or admin accounts for the hospital.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 480 }}>
        {error && <div className="error-banner">{error}</div>}
        {success && (
          <div className="error-banner" style={{ borderColor: "var(--mint-500)", color: "var(--mint-500)", background: "#e2f1ee" }}>
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" value={form.role} onChange={update("role")}>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={form.name} onChange={update("name")} placeholder="Dr. Jane Smith" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={update("email")} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Temporary password</label>
            <input id="password" type="password" required minLength={6} value={form.password} onChange={update("password")} />
          </div>
          {form.role === "doctor" && (
            <>
              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <input
                  id="specialization"
                  value={form.specialization}
                  onChange={update("specialization")}
                  placeholder="e.g. Cardiology"
                />
              </div>
              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  value={form.department}
                  onChange={update("department")}
                  placeholder="e.g. Cardiology"
                />
              </div>
              <div className="form-group">
                <label htmlFor="workingHours">Working hours</label>
                <input
                  id="workingHours"
                  value={form.workingHours}
                  onChange={update("workingHours")}
                  placeholder="e.g. Mon-Fri 9:00 AM - 5:00 PM"
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input id="phone" value={form.phone} onChange={update("phone")} placeholder="Optional" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddStaff;
