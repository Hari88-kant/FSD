import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [serviceArea, setServiceArea] = useState('Electronic City, Anekal, Jigani');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        phone,
        password,
        role,
        ...(role === 'technician'
          ? {
              serviceAreas: serviceArea
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            }
          : {})
      };
      const user = await register(payload);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: '520px', marginTop: '1.5rem' }}>
      <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="brand-icon-glow" style={{ fontSize: '1.8rem', display: 'inline-block', marginBottom: '0.75rem' }}>⚡</span>
          <h2 style={{ margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>Create an Account</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Register as a Customer or Field Technician
          </p>
        </div>

        {error && (
          <div className="hazard-alert" style={{ fontSize: '0.9rem', padding: '0.75rem 1rem' }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (optional)</label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-9845000000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Account Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">👤 Customer (Report Faults & Track Resolution)</option>
              <option value="technician">🛠️ Field Technician (Accept/Reject & Fix Faults)</option>
            </select>
          </div>

          {role === 'technician' && (
            <div className="form-group" style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <label htmlFor="serviceArea" style={{ color: '#1e40af' }}>
                Service Areas (Comma-separated)
              </label>
              <input
                id="serviceArea"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="Anekal, Electronic City, Chandapura, Jigani"
              />
              <span style={{ fontSize: '0.78rem', color: '#3b82f6', display: 'block', marginTop: '0.35rem' }}>
                ℹ️ A unique Employee ID (e.g. <code>EB-TECH-XXXX</code>) will be generated for monitoring.
              </span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reg-password">Password (minimum 6 characters)</label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn" disabled={submitting} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
            {submitting ? 'Registering Account...' : 'Complete Registration →'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', marginBottom: 0, fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
