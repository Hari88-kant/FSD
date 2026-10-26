import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import MapPicker from '../components/MapPicker.jsx';

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
        <div className="card">Loading complaint details...</div>
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

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <Link to={`/${user.role}`} className="btn btn-secondary">
          ← Back to {user.role.toUpperCase()} Dashboard
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>
            Complaint #{complaint._id.slice(-6).toUpperCase()} —{' '}
            {complaint.problemType.replace(/_/g, ' ')}
          </h2>
          <span className={`badge badge-${complaint.status}`}>
            {complaint.status.replace(/_/g, ' ')}
          </span>
        </div>

        {complaint.isHazardous && (
          <div className="hazard-alert" style={{ marginTop: '1rem' }}>
            ⚠️ <strong>Hazardous Condition Flagged:</strong> Do not touch exposed conductors or meters.
            Contact official utility emergency dispatch (1912 / 112) if immediate danger exists.
          </div>
        )}

        <div className="grid-2" style={{ marginTop: '1rem' }}>
          <div>
            <p>
              <strong>Description:</strong> {complaint.description}
            </p>
            <p>
              <strong>Address:</strong> {complaint.address || 'Not provided'}
            </p>
            <p>
              <strong>Customer:</strong> {complaint.customerId?.name} ({complaint.customerId?.email}{' '}
              {complaint.customerId?.phone ? `• ${complaint.customerId.phone}` : ''})
            </p>
            <p>
              <strong>Assigned Technician:</strong>{' '}
              {complaint.technicianId
                ? `${complaint.technicianId.name} (${complaint.technicianId.phone || complaint.technicianId.email})`
                : 'Unassigned'}
            </p>
            <p>
              <strong>Created At:</strong> {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            {hasCoords ? (
              <MapPicker
                lat={coords[1]}
                lng={coords[0]}
                interactive={false}
              />
            ) : (
              <div className="card" style={{ background: '#f8fafc' }}>
                No GPS coordinates attached to this complaint (manual address fallback used).
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Status Audit Trail</h3>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Updated By</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {(complaint.statusHistory || []).map((entry, idx) => (
              <tr key={idx}>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${entry.status}`}>
                    {entry.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  {entry.changedBy?.name
                    ? `${entry.changedBy.name} (${entry.changedBy.role})`
                    : 'User'}
                </td>
                <td>{entry.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
