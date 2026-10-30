import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, soundEnabled, toggleSound } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const roleColors = {
    customer: { bg: 'rgba(52, 211, 153, 0.2)', text: '#34d399', border: 'rgba(52, 211, 153, 0.4)', label: '👤 CUSTOMER' },
    technician: { bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)', label: '🛠️ TECHNICIAN' },
    admin: { bg: 'rgba(192, 132, 252, 0.2)', text: '#c084fc', border: 'rgba(192, 132, 252, 0.4)', label: '🛡️ ADMIN' }
  };

  const currentRoleStyle = user?.role ? roleColors[user.role] : null;

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon-glow">⚡</span>
        <span>Smart EB Connect</span>
      </Link>

      <nav className="navbar-links">
        {/* Live Theme Toggle */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? '☀️ Solar Light' : '🌙 Cyber Dark'}
        </button>

        {/* Audio Haptic Toggle */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleSound}
          title={soundEnabled ? 'Mute Interface Sounds' : 'Enable Audio Feedback'}
          style={{ padding: '0.4rem 0.6rem' }}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

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
            <Link to={`/${user.role}`} className="nav-link" style={{ fontWeight: 700 }}>
              Dashboard
            </Link>

            {currentRoleStyle && (
              <span
                style={{
                  background: currentRoleStyle.bg,
                  color: currentRoleStyle.text,
                  border: `1px solid ${currentRoleStyle.border}`,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.03em'
                }}
              >
                {currentRoleStyle.label}
              </span>
            )}

            {user.role === 'technician' && user.technicianBadgeId && (
              <span className="tech-id-badge" title="Your Field Technician ID">
                🪪 {user.technicianBadgeId}
              </span>
            )}

            <span style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 600 }}>
              {user.name}
            </span>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
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
