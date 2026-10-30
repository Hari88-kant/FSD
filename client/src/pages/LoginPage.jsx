import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword('Password123!');
  }

  return (
    <div className="container" style={{ maxWidth: '480px', marginTop: '1.5rem' }}>
      <div className="card" style={{ padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="brand-icon-glow" style={{ fontSize: '1.8rem', display: 'inline-block', marginBottom: '0.75rem' }}>⚡</span>
          <h2 style={{ margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>Welcome Back</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Sign in to access your Smart EB Connect dashboard
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
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ananya@smarteb.local"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn" disabled={submitting} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
            {submitting ? 'Authenticating...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ One-Click Demo Credentials:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.55rem 0.85rem' }}
              onClick={() => fillDemo('ananya@smarteb.local')}
            >
              <span>👤 <strong>Customer:</strong> Ananya Sharma</span>
              <span className="badge badge-accepted" style={{ fontSize: '0.72rem' }}>Fill</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.55rem 0.85rem' }}
              onClick={() => fillDemo('karthik.tech@smarteb.local')}
            >
              <span>🛠️ <strong>Technician:</strong> Karthik Murthy <code style={{ color: '#1e40af' }}>[EB-TECH-1001]</code></span>
              <span className="badge badge-accepted" style={{ fontSize: '0.72rem' }}>Fill</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.55rem 0.85rem' }}
              onClick={() => fillDemo('admin@smarteb.local')}
            >
              <span>🛡️ <strong>Admin:</strong> System Administrator</span>
              <span className="badge badge-accepted" style={{ fontSize: '0.72rem' }}>Fill</span>
            </button>
          </div>
        </div>

        <p style={{ marginTop: '1.5rem', marginBottom: 0, fontSize: '0.9rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Need a new account? <Link to="/register" style={{ fontWeight: 600 }}>Create account here</Link>
        </p>
      </div>
    </div>
  );
}
