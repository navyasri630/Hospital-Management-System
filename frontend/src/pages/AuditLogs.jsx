import React, { useEffect, useState } from "react";
import api from "../api/axios.js";
import "./Pages.css";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/audit-logs");
        setLogs(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load audit logs.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit logs</h1>
          <p>A trail of sensitive actions taken across the system (most recent 300).</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="cell-muted">Loading…</p>}

      {!loading && logs.length === 0 && (
        <div className="empty-state card" style={{ padding: 48 }}>
          No activity recorded yet.
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="cell-muted">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="cell-name">{log.actorName}</td>
                  <td className="cell-muted" style={{ textTransform: "capitalize" }}>{log.actorRole}</td>
                  <td className="cell-muted">{log.action}</td>
                  <td className="cell-muted">
                    {log.targetType}
                    {log.targetId ? ` #${log.targetId}` : ""}
                  </td>
                  <td className="cell-muted">{log.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
