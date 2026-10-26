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
  const [serviceArea, setServiceArea] = useState('Electronic City, Anekal');
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
    <div className="container" style={{ maxWidth: '540px' }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create an Account</h2>
        <p style={{ fontSize: '0.88rem', color: '#475569' }}>
          Register as a Customer or Technician. Administrator accounts are provisioned exclusively via
          controlled server seeding.
        </p>
        {error && <div className="hazard-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
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
              <option value="customer">Customer (Report Faults & Track Status)</option>
              <option value="technician">Technician (Accept & Resolve Requests)</option>
            </select>
          </div>

          {role === 'technician' && (
            <div className="form-group">
              <label htmlFor="serviceArea">Service Areas (comma-separated)</label>
              <input
                id="serviceArea"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="Electronic City, Chandapura, Anekal"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reg-password">Password (min 6 characters)</label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
