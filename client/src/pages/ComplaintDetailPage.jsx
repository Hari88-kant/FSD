import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import MapPicker from '../components/MapPicker.jsx';

const STATUS_STEPS = [
  { key: 'pending', label: '1. Logged' },
  { key: 'assigned', label: '2. Assigned' },
  { key: 'accepted', label: '3. Accepted' },
  { key: 'on_the_way', label: '4. En Route' },
  { key: 'in_progress', label: '5. Repairing' },
  { key: 'resolved', label: '6. Resolved' }
];

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest(`/complaints/${id}`);
        setComplaint(data.complaint);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="spinner-mini"></span> Loading complaint audit details...
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="container">
        <div className="hazard-alert">{error || 'Complaint not found'}</div>
        <Link to={user ? `/${user.role}` : '/'} className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const coords = complaint.location?.coordinates; // [lng, lat]
  const hasCoords = Array.isArray(coords) && coords.length === 2;

  // Determine active step index
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === complaint.status);
  const isCancelled = complaint.status === 'cancelled';
  const isRejected = complaint.status === 'rejected';

  const techBadgeId =
    complaint.technicianId?.technicianBadgeId ||
    (complaint.technicianId?._id ? `EB-TECH-${complaint.technicianId._id.slice(-4).toUpperCase()}` : null);

  return (
    <div className="container">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to={`/${user.role}`} className="btn btn-secondary" style={{ fontSize: '0.88rem' }}>
          ← Back to {user.role.toUpperCase()} Dashboard
        </Link>
      </div>

      <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>
              Complaint #{complaint._id.slice(-6).toUpperCase()} —{' '}
              <span style={{ textTransform: 'capitalize' }}>{complaint.problemType.replace(/_/g, ' ')}</span>
            </h2>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Logged on {new Date(complaint.createdAt).toLocaleString()}
            </div>
          </div>
          <span className={`badge badge-${complaint.status}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
            {complaint.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Visual Progress Stepper */}
        {!isCancelled && !isRejected && (
          <div style={{ margin: '2rem 0 1.5rem 0', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="workflow-stepper">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = currentStepIdx >= idx;
                const isActive = complaint.status === step.key;

                return (
                  <div key={step.key} className="step-item">
                    <div className={`step-circle ${isActive ? 'active' : ''} ${isCompleted && !isActive ? 'completed' : ''}`}>
                      {isCompleted && !isActive ? '✓' : idx + 1}
                    </div>
                    <span className={`step-title ${isActive ? 'active' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="hazard-alert" style={{ marginTop: '1rem', background: '#f1f5f9', borderColor: '#cbd5e1', color: '#475569' }}>
            <span>ℹ️</span> This complaint was cancelled / archived and is no longer active in the dispatch queue.
          </div>
        )}

        {complaint.isHazardous && (
          <div className="hazard-alert" style={{ marginTop: '1rem' }}>
            <span>🔥</span>
            <div>
              <strong>Hazardous Condition Flagged:</strong> Report indicates sparking wires or potential fire danger. Stay clear of electrical infrastructure and call <strong>1912</strong> or <strong>112</strong> immediately.
            </div>
          </div>
        )}

        <div className="grid-2" style={{ marginTop: '1.25rem' }}>
          <div>
            <div className="form-group">
              <label>Description of Issue</label>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.95rem' }}>
                {complaint.description}
              </div>
            </div>

            <div className="form-group">
              <label>Location / Address</label>
              <div style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                📍 {complaint.address || 'Manual location not provided'}
              </div>
            </div>

            <div className="form-group">
              <label>Customer Details</label>
              <div style={{ fontSize: '0.92rem' }}>
                <strong>{complaint.customerId?.name}</strong> • {complaint.customerId?.email}
                {complaint.customerId?.phone && <div>📞 {complaint.customerId?.phone}</div>}
              </div>
            </div>

            <div className="form-group">
              <label>Assigned Field Technician</label>
              {complaint.technicianId ? (
                <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '8px', border: '1.5px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '1rem' }}>{complaint.technicianId.name}</strong>
                    {techBadgeId && (
                      <span className="tech-id-badge" style={{ fontSize: '0.8rem' }}>
                        🪪 ID: {techBadgeId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#1e40af' }}>
                    {complaint.technicianId.phone ? `📞 Contact: ${complaint.technicianId.phone}` : ''} • {complaint.technicianId.email}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  Not yet assigned to a technician (Waiting in pending dispatch queue)
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '0.92rem', display: 'block', marginBottom: '0.4rem' }}>
              Geographic Pin & Radius
            </label>
            {hasCoords ? (
              <MapPicker
                lat={coords[1]}
                lng={coords[0]}
                interactive={false}
              />
            ) : (
              <div className="card" style={{ background: '#f8fafc', textAlign: 'center', padding: '2rem' }}>
                No GPS coordinates were attached (Manual address fallback used).
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Audit Trail */}
      <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📜</span> Verifiable Status Audit Trail ({complaint.statusHistory?.length || 0})
        </h3>
        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Permanent record of all assignments, technician acceptance/rejections, and state transitions for monitoring and compliance.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Updated By</th>
                <th>Action Note & Workload Context</th>
              </tr>
            </thead>
            <tbody>
              {(complaint.statusHistory || []).map((entry, idx) => (
                <tr key={idx}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${entry.status}`}>
                      {entry.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <strong>{entry.changedBy?.name || 'System / User'}</strong>
                    {entry.changedBy?.role && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'capitalize' }}>
                        {entry.changedBy.role}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem', color: entry.status === 'rejected' ? '#b91c1c' : '#334155' }}>
                      {entry.note}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
