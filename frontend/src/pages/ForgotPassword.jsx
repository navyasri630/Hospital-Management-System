import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setDevLink("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
      if (data.devResetUrl) setDevLink(data.devResetUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-mark">+</span>
          <span className="auth-brand-name">Meridian</span>
        </div>
        <h2>Forgot your password?</h2>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

        {error && <div className="error-banner">{error}</div>}
        {message && (
          <div className="error-banner" style={{ borderColor: "var(--mint-500)", color: "var(--mint-500)", background: "#e2f1ee" }}>
            {message}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        {devLink && (
          <div className="auth-hint">
            No email service is configured in this project, so here's your reset link directly:
            <br />
            <Link to={devLink.replace(window.location.origin, "")}>{devLink}</Link>
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
