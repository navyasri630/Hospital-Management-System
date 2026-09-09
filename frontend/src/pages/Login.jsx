import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Cross, Activity, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
// Scoped stylesheet (see file for why this is scoped rather than global)
import '../styles/hms-auth-scope.css';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell hms-auth-scope">
      <div className="auth-visual">
        <div className="brand">
          <div className="logo-mark"><Cross size={22} /></div>
          City Care Hospital
        </div>
        <div className="pitch">
          <h1>One system for every ward, ledger, and life you look after.</h1>
          <p>Patients, appointments, admissions, billing, and records — all connected, all real-time, all in one place.</p>
        </div>
        <div className="stat-row">
          <div><strong>24/7</strong><span>Emergency care</span></div>
          <div><strong>15+</strong><span>Departments</span></div>
          <div><strong>99.9%</strong><span>Uptime</span></div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          <h2>Welcome back</h2>
          <p className="sub">Sign in to access your dashboard.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" className={`input ${errors.email ? 'error' : ''}`}
                placeholder="you@hospital.com"
                {...register('email', { required: 'Email is required' })} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className={`input ${errors.password ? 'error' : ''}`}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })} />
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="spin-icon" /> : <Activity size={16} />}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
