import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  async function handleQuickDemo(email) {
    try {
      const loggedIn = await login(email, 'Password123!');
      navigate(`/${loggedIn.role}`);
    } catch {
      navigate('/login');
    }
  }

  return (
    <div className="container">
      {/* Hero Card */}
      <div className="hero-card">
        <div className="hero-pill">
          <span>⚡ Next-Generation Utility Prototype</span>
          <span>•</span>
          <span>Karnataka Grid Coverage</span>
        </div>
        <h1 className="hero-title">Location-Based Electricity Fault Reporting & Field Assistance</h1>
        <p className="hero-subtitle">
          Instantly report power outages, voltage dips, and meter failures. Select locations with live
          search, match available technicians by straight-line proximity, and track complaint
          progress in real time with verified field technician IDs.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {user ? (
            <Link to={`/${user.role}`} className="btn" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
              Open My {user.role.toUpperCase()} Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                🚀 Launch Interactive Demo
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
                Create Free Account
              </Link>
            </>
          )}
        </div>
      </div>

      {/* One-Click Demo Role Launcher */}
      <div className="card" style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>⚡ Quick Experience Launchers</h3>
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Jump straight into any role with pre-configured accounts (Password: <code>Password123!</code>):
            </p>
          </div>
          <span className="badge badge-assigned">One-Click Sign In</span>
        </div>

        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="feature-box" style={{ background: '#ffffff', cursor: 'pointer' }} onClick={() => handleQuickDemo('ananya@smarteb.local')}>
            <div className="feature-icon-badge" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>👤</div>
            <h4 style={{ margin: '0 0 0.35rem 0' }}>Customer Portal</h4>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
              Search locations, pick places on the map, report outages, and request nearby technicians.
            </p>
            <button type="button" className="btn btn-outline" style={{ width: '100%', fontSize: '0.85rem' }}>
              Explore as Customer (Ananya) →
            </button>
          </div>

          <div className="feature-box" style={{ background: '#ffffff', cursor: 'pointer' }} onClick={() => handleQuickDemo('karthik.tech@smarteb.local')}>
            <div className="feature-icon-badge" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>🛠️</div>
            <h4 style={{ margin: '0 0 0.35rem 0' }}>Technician Portal</h4>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
              View ID <code>EB-TECH-1001</code>, toggle availability, accept free jobs or reject busy ones.
            </p>
            <button type="button" className="btn btn-outline" style={{ width: '100%', fontSize: '0.85rem' }}>
              Explore as Tech (Karthik) →
            </button>
          </div>

          <div className="feature-box" style={{ background: '#ffffff', cursor: 'pointer' }} onClick={() => handleQuickDemo('admin@smarteb.local')}>
            <div className="feature-icon-badge" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>🛡️</div>
            <h4 style={{ margin: '0 0 0.35rem 0' }}>Admin Control Center</h4>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
              Monitor system metrics, technician badge IDs, and reassign pending service requests.
            </p>
            <button type="button" className="btn btn-outline" style={{ width: '100%', fontSize: '0.85rem' }}>
              Explore as Administrator →
            </button>
          </div>
        </div>
      </div>

      {/* 4 Feature Pillars */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="feature-box">
          <div className="feature-icon-badge">📍</div>
          <h4 style={{ margin: '0 0 0.35rem 0' }}>Interactive Location Picker</h4>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Live location search suggestions, quick Karnataka landmark pills (Anekal, Electronic City, Jigani), and click-to-pin Leaflet maps.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon-badge">⚡</div>
          <h4 style={{ margin: '0 0 0.35rem 0' }}>Proximity Dispatch</h4>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Haversine straight-line distance ranking connects customers to the nearest active field technician in seconds.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon-badge">🤝</div>
          <h4 style={{ margin: '0 0 0.35rem 0' }}>Workload Accept / Reject</h4>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Technicians accept when free, or reject with a documented reason if busy so complaints are immediately reassigned without customer delay.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon-badge">🪪</div>
          <h4 style={{ margin: '0 0 0.35rem 0' }}>Technician ID & Audit Trail</h4>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Every field technician has a unique ID (e.g. <code>EB-TECH-1001</code>) displayed across customer tickets and administrative audit logs.
          </p>
        </div>
      </div>

      {/* Electrical Safety Notice */}
      <div className="card" style={{ borderLeft: '5px solid #dc2626', background: '#fff5f5' }}>
        <h4 style={{ margin: '0 0 0.4rem 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠️</span> Electrical Safety & Scope Notice
        </h4>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f1d1d', lineHeight: 1.5 }}>
          Smart EB Connect is an academic software prototype. It is not an automated fault detector and does not directly dispatch government electricity board personnel. If you observe sparking wires, burning transformers, or fallen live lines, stay back at a safe distance and dial your official utility helpline (<strong>1912</strong>) or emergency services (<strong>112</strong>) immediately.
        </p>
      </div>
    </div>
  );
}
