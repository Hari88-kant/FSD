import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ marginTop: 0 }}>⚡ Smart EB Connect</h1>
        <p style={{ fontSize: '1.1rem', color: '#334155', maxWidth: '780px' }}>
          A location-based electricity fault reporting and technician assistance platform built with
          React.js, Node.js/Express.js, and MongoDB. Customers can report electrical issues, share
          consented GPS coordinates or manual addresses, discover nearby available technicians
          ranked by straight-line Haversine distance, and track resolution status in real time.
        </p>

        <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {user ? (
            <Link to={`/${user.role}`} className="btn">
              Go to {user.role.toUpperCase()} Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn">
                Sign In to Demo
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>👤 Customer Workflow</h3>
          <ul>
            <li>Submit electricity fault complaints with category and detailed description.</li>
            <li>Share browser GPS coordinates on user action or provide a manual fallback address.</li>
            <li>Discover available technicians ranked by straight-line Haversine distance.</li>
            <li>Track live complaint status history or cancel eligible pending requests.</li>
          </ul>
        </div>

        <div className="card">
          <h3>🛠️ Technician & Admin Workflows</h3>
          <ul>
            <li>Technicians toggle availability and update their active GPS coordinates.</li>
            <li>Accept or reject assigned requests with server-side double-acceptance protection.</li>
            <li>Step through validated workflow states: Accepted → On the way → In progress → Resolved.</li>
            <li>Administrators oversee system metrics, assign/reassign technicians, and manage user accounts.</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
        <h3 style={{ marginTop: 0, color: '#991b1b' }}>⚠️ Electrical Safety & Academic Scope Boundary</h3>
        <p style={{ marginBottom: 0 }}>
          Smart EB Connect is an academic software-only prototype and does not dispatch government
          electricity board personnel or use physical IoT sensors. Never touch downed power lines,
          sparking meters, or exposed conductors. For life-threatening or high-voltage emergencies,
          stay away and call your official electricity board helpline (1912) or emergency services (112).
        </p>
      </div>
    </div>
  );
}
