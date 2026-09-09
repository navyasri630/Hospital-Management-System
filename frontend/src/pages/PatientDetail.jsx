import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import DocumentManager from "../components/DocumentManager.jsx";
import "./Pages.css";

const PatientDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/patients/${id}`);
        setPatient(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load patient record.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <p className="cell-muted">Loading…</p>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!patient) return null;

  const canUpload = user.role !== "doctor"; // doctors view-only for uploads, admin/receptionist/self manage

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{patient.name}</h1>
          <p>{patient.email} · {patient.phone || "no phone on file"}</p>
        </div>
        <Link to="/patients" className="btn btn-outline btn-sm">
          Back to patients
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ marginBottom: 12 }}>Details</h3>
          <p className="cell-muted">Gender: <span className="cell-name" style={{ textTransform: "capitalize" }}>{patient.gender || "—"}</span></p>
          <p className="cell-muted">Date of birth: <span className="cell-name">{patient.dateOfBirth || "—"}</span></p>
          <p className="cell-muted">Address: <span className="cell-name">{patient.address || "—"}</span></p>
          <p className="cell-muted">Emergency contact: <span className="cell-name">{patient.emergencyContactName || "—"} {patient.emergencyContactPhone ? `(${patient.emergencyContactPhone})` : ""}</span></p>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ marginBottom: 12 }}>Medical history</h3>
          <p className="cell-muted">Allergies</p>
          <p className="cell-name" style={{ marginBottom: 12, whiteSpace: "pre-wrap" }}>{patient.allergies || "None recorded"}</p>
          <p className="cell-muted">Vaccination history</p>
          <p className="cell-name" style={{ whiteSpace: "pre-wrap" }}>{patient.vaccinationHistory || "None recorded"}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16 }}>Documents</h3>
        <DocumentManager patientId={patient.id} canUpload={canUpload} canDelete={user.role !== "doctor"} />
      </div>
    </div>
  );
};

export default PatientDetail;
