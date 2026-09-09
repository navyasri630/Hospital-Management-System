import React, { useEffect, useState } from "react";
import api from "../api/axios.js";

const CATEGORY_LABELS = {
  medical_document: "Medical document",
  lab_report: "Lab report",
  prescription: "Prescription",
  profile_photo: "Profile photo",
  other: "Other",
};

const DocumentManager = ({ patientId, canUpload = true, canDelete = true }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("medical_document");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/patients/${patientId}/documents`);
      setDocs(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    try {
      await api.post(`/patients/${patientId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Only JPG, PNG, WEBP, and PDF up to 10MB are allowed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Remove this document?")) return;
    try {
      await api.delete(`/patients/${patientId}/documents/${docId}`);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove document.");
    }
  };

  const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {canUpload && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "auto", padding: "8px 10px" }}>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
            {uploading ? "Uploading…" : "Upload file"}
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
          </label>
        </div>
      )}

      {loading && <p className="cell-muted">Loading documents…</p>}
      {!loading && docs.length === 0 && <p className="cell-muted">No documents uploaded yet.</p>}

      {!loading && docs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div>
                <a href={`${apiOrigin}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="cell-name">
                  {doc.originalName}
                </a>
                <div className="cell-muted">{CATEGORY_LABELS[doc.category] || doc.category}</div>
              </div>
              {canDelete && (
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
