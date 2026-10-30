import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const roleColors = {
    customer: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', label: '👤 CUSTOMER' },
    technician: { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', label: '🛠️ TECHNICIAN' },
    admin: { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff', label: '🛡️ ADMINISTRATOR' }
  };

  const currentRoleStyle = user?.role ? roleColors[user.role] : null;

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon-glow">⚡</span>
        <span>Smart EB Connect</span>
      </Link>

      <nav className="navbar-links">
        {!user ? (
          <>
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.45rem 0.95rem' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn" style={{ padding: '0.45rem 0.95rem' }}>
              Get Started
            </Link>
          </>
        ) : (
          <>
            <Link to={`/${user.role}`} className="nav-link" style={{ fontWeight: 600 }}>
              Dashboard
            </Link>

            {/* Role & User Badge */}
            {currentRoleStyle && (
              <span
                style={{
                  background: currentRoleStyle.bg,
                  color: currentRoleStyle.text,
                  border: `1px solid ${currentRoleStyle.border}`,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.03em'
                }}
              >
                {currentRoleStyle.label}
              </span>
            )}

            {/* Prominent Technician ID Badge for field logging */}
            {user.role === 'technician' && user.technicianBadgeId && (
              <span className="tech-id-badge" title="Your Field Technician ID">
                🪪 {user.technicianBadgeId}
              </span>
            )}

            <div className="user-tag">
              <span>{user.name}</span>
            </div>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
