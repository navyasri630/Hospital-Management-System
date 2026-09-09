import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Cross, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
// Scoped stylesheet (see file for why this is scoped rather than global)
import '../styles/hms-auth-scope.css';

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Patient' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'admin_clerk', label: 'Administrative Clerk' },
  { value: 'housekeeping', label: 'Housekeeping Staff' },
  { value: 'admin', label: 'Administrator' },
];

const STAFF_ROLES = ['nurse', 'receptionist', 'pharmacist', 'lab_technician', 'admin_clerk', 'housekeeping'];

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ defaultValues: { role: 'patient' } });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const selectedRole = watch('role');

  useEffect(() => {
    // Public endpoint - no auth needed, since this page is reached before login
    api.get('/public/departments').then((res) => setDepartments(res.data.data)).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await registerUser(data);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell hms-auth-scope">
      <div className="auth-visual">
        <div className="brand"><div className="logo-mark"><Cross size={22} /></div>City Care Hospital</div>
        <div className="pitch">
          <h1>Create your account.</h1>
          <p>Whether you're a patient, a doctor, or part of the care team — everyone signs in from
          the same place. Choose your role to get started.</p>
        </div>
        <div />
      </div>
      <div className="auth-form-side">
        <div className="auth-form-card" style={{ maxWidth: 420 }}>
          <h2>Create account</h2>
          <p className="sub">Pick the role that matches what you'll be doing in the system.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label>I am a…</label>
              <select className="input" {...register('role')}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Full name</label>
              <input className={`input ${errors.name ? 'error' : ''}`} placeholder="Jane Doe" {...register('name', { required: 'Name is required' })} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" className={`input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" {...register('email', { required: 'Email is required' })} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="input" placeholder="+1-555-0100" {...register('phone')} />
            </div>

            {selectedRole === 'doctor' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Specialization *</label>
                    <input className={`input ${errors.specialization ? 'error' : ''}`} placeholder="Cardiology" {...register('specialization', { required: 'Required for doctors' })} />
                    {errors.specialization && <span className="field-error">{errors.specialization.message}</span>}
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select className="input" {...register('departmentId')}>
                      <option value="">Select…</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Qualification</label><input className="input" placeholder="MD" {...register('qualification')} /></div>
                  <div className="form-group"><label>Experience (years)</label><input type="number" min="0" className="input" {...register('experienceYears')} /></div>
                </div>
                <div className="form-group"><label>Consultation fee</label><input type="number" min="0" step="0.01" className="input" {...register('consultationFee')} /></div>
              </>
            )}

            {STAFF_ROLES.includes(selectedRole) && (
              <div className="form-row">
                <div className="form-group">
                  <label>Designation</label>
                  <input className="input" placeholder={ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label} {...register('designation')} />
                </div>
                <div className="form-group">
                  <label>Preferred shift</label>
                  <select className="input" {...register('shift')}>
                    <option value="morning">Morning</option><option value="evening">Evening</option><option value="night">Night</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input type="password" className={`input ${errors.password ? 'error' : ''}`} placeholder="At least 8 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} />
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>
            <div className="form-group">
              <label>Confirm password</label>
              <input type="password" className={`input ${errors.confirmPassword ? 'error' : ''}`} placeholder="Re-enter password"
                {...register('confirmPassword', { validate: (v) => v === watch('password') || 'Passwords do not match' })} />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} disabled={submitting}>
              <UserPlus size={16} /> {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="auth-links" style={{ justifyContent: 'center', marginTop: 16 }}>
            <span>Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
}
