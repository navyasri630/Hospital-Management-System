import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Pages.css";

const STATUS_FILTERS = ["all", "unpaid", "paid", "refunded"];
const emptyItem = { description: "", amount: "" };

const Billing = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: "", paymentMethod: "", insuranceProvider: "", notes: "" });
  const [items, setItems] = useState([{ ...emptyItem }]);

  const canManage = ["admin", "receptionist"].includes(user.role);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/bills");
      setBills(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load bills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (canManage) {
      api.get("/patients").then((r) => setPatients(r.data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const total = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/bills", { ...form, items });
      setBills((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ patientId: "", paymentMethod: "", insuranceProvider: "", notes: "" });
      setItems([{ ...emptyItem }]);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create bill.");
    }
  };

  const markPaid = async (bill) => {
    const method = window.prompt("Payment method (cash, card, insurance)?", bill.paymentMethod || "cash");
    if (method === null) return;
    try {
      const { data } = await api.put(`/bills/${bill.id}/pay`, { paymentMethod: method });
      setBills((prev) => prev.map((b) => (b.id === data.id ? data : b)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to record payment.");
    }
  };

  const markRefunded = async (bill) => {
    if (!window.confirm("Mark this bill as refunded?")) return;
    try {
      const { data } = await api.put(`/bills/${bill.id}/refund`);
      setBills((prev) => prev.map((b) => (b.id === data.id ? data : b)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refund bill.");
    }
  };

  const downloadInvoice = (bill) => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text("Meridian Hospital — Invoice", 14, y);
    y += 14;
    doc.setFontSize(11);
    doc.text(`Invoice #${bill.id}`, 14, y);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 120, y);
    y += 8;
    doc.text(`Patient: ${bill.patient?.name || ""}`, 14, y);
    y += 8;
    doc.text(`Status: ${bill.status.toUpperCase()}`, 14, y);
    y += 14;
    doc.setFontSize(12);
    doc.text("Items", 14, y);
    y += 8;
    doc.setFontSize(10);
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(bill.items || "[]");
    } catch {
      parsedItems = [];
    }
    parsedItems.forEach((it) => {
      doc.text(it.description, 14, y);
      doc.text(`$${Number(it.amount).toFixed(2)}`, 170, y);
      y += 7;
    });
    y += 4;
    doc.setFontSize(12);
    doc.text(`Total: $${bill.totalAmount.toFixed(2)}`, 14, y);
    if (bill.insuranceProvider) {
      y += 10;
      doc.setFontSize(10);
      doc.text(`Insurance: ${bill.insuranceProvider}`, 14, y);
    }
    doc.save(`invoice-${bill.id}.pdf`);
  };

  const visible = bills.filter((b) => filter === "all" || b.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p>{user.role === "patient" ? "Your bills and payment history." : "Generate bills and track payments."}</p>
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
          {canManage && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              + Generate bill
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="cell-muted">Loading…</p>}

      {!loading && visible.length === 0 && (
        <div className="empty-state card" style={{ padding: 48 }}>No bills in this view.</div>
      )}

      {!loading && visible.length > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                {user.role !== "patient" && <th>Patient</th>}
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => (
                <tr key={b.id}>
                  {user.role !== "patient" && <td className="cell-name">{b.patient?.name}</td>}
                  <td className="cell-muted">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="cell-name">${b.totalAmount.toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        b.status === "paid" ? "badge-confirmed" : b.status === "unpaid" ? "badge-pending" : "badge-cancelled"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => downloadInvoice(b)}>
                        Invoice PDF
                      </button>
                      {canManage && b.status === "unpaid" && (
                        <button className="btn btn-outline btn-sm" onClick={() => markPaid(b)}>
                          Record payment
                        </button>
                      )}
                      {user.role === "admin" && b.status === "paid" && (
                        <button className="btn btn-danger btn-sm" onClick={() => markRefunded(b)}>
                          Refund
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

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3>Generate bill</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="patientId">Patient</label>
                <select id="patientId" required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--teal-900)" }}>Line items</label>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <input
                    placeholder="Description (e.g. Consultation fee)"
                    value={it.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount"
                    value={it.amount}
                    onChange={(e) => updateItem(idx, "amount", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {items.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-outline btn-sm" onClick={addItem} style={{ marginTop: 10 }}>
                + Add line item
              </button>

              <p style={{ marginTop: 16, fontWeight: 600 }}>Total: ${total.toFixed(2)}</p>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label htmlFor="insuranceProvider">Insurance provider (optional)</label>
                <input id="insuranceProvider" value={form.insuranceProvider} onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate bill</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
