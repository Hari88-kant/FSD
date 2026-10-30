import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const NEXT_STATUS_BY_CURRENT = {
  accepted: [
    { status: 'on_the_way', label: '🚗 En Route (On The Way)' },
    { status: 'in_progress', label: '🔧 Start Repair (In Progress)' }
  ],
  on_the_way: [{ status: 'in_progress', label: '🔧 Start Repair (In Progress)' }],
  in_progress: [{ status: 'resolved', label: '✅ Mark Resolved' }]
};

const REJECTION_REASONS = [
  { id: 'busy_repair', label: '⚡ Currently engaged in another urgent power fault repair' },
  { id: 'workload_shift', label: '⏱️ Heavy field backlog / Active shift ending soon' },
  { id: 'out_of_area', label: '📍 Beyond immediate transit perimeter for quick ETA' },
  { id: 'equipment_needed', label: '🛠️ Requires specialized utility gear (bucket truck / 11kV gloves)' },
  { id: 'other', label: '📝 Other operational reason (specify below)' }
];

export default function TechnicianDashboard() {
  const { user, technicianProfile, setTechnicianProfile } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [latInput, setLatInput] = useState(
    technicianProfile?.location?.coordinates?.[1] ?? 12.8452
  );
  const [lngInput, setLngInput] = useState(
    technicianProfile?.location?.coordinates?.[0] ?? 77.6602
  );
  const [locMessage, setLocMessage] = useState('');

  // Rejection modal states
  const [rejectModalComplaint, setRejectModalComplaint] = useState(null);
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0].label);
  const [customNote, setCustomNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const technicianBadgeId =
    user?.technicianBadgeId ||
    technicianProfile?.technicianBadgeId ||
    `EB-TECH-${user?.id?.slice(-4).toUpperCase() || '1001'}`;

  async function loadComplaints() {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/complaints');
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function handleToggleAvailability() {
    try {
      const nextState = !(technicianProfile?.isAvailable ?? true);
      const data = await apiRequest('/technicians/me/availability', {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: nextState })
      });
      setTechnicianProfile(data.technicianProfile);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateLocation(e) {
    e.preventDefault();
    setLocMessage('');
    try {
      const data = await apiRequest('/technicians/me/location', {
        method: 'PATCH',
        body: JSON.stringify({
          lat: parseFloat(latInput),
          lng: parseFloat(lngInput)
        })
      });
      setTechnicianProfile(data.technicianProfile);
      setLocMessage('Location updated in MongoDB GeoJSON [lng, lat] format.');
    } catch (err) {
      setError(err.message);
    }
  }

  function handleBrowserGps() {
    if (!navigator.geolocation) {
      setLocMessage('Browser geolocation unavailable.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatInput(lat);
        setLngInput(lng);
        try {
          const data = await apiRequest('/technicians/me/location', {
            method: 'PATCH',
            body: JSON.stringify({ lat, lng })
          });
          setTechnicianProfile(data.technicianProfile);
          setLocMessage(`GPS location updated (${lat}, ${lng})`);
        } catch (err) {
          setError(err.message);
        }
      },
      (err) => {
        setLocMessage(`Browser GPS denied (${err.message}). Use manual coordinates.`);
      }
    );
  }

  async function handleAccept(id) {
    try {
      await apiRequest(`/complaints/${id}/accept`, { method: 'POST' });
      await loadComplaints();
    } catch (err) {
      setError(err.message);
    }
  }

  function openRejectModal(complaint) {
    setRejectModalComplaint(complaint);
    setSelectedReason(REJECTION_REASONS[0].label);
    setCustomNote('');
  }

  function closeRejectModal() {
    setRejectModalComplaint(null);
    setCustomNote('');
    setRejecting(false);
  }

  async function submitRejection(e) {
    e.preventDefault();
    if (!rejectModalComplaint) return;
    setRejecting(true);
    try {
      const finalReason =
        selectedReason.includes('Other') && customNote.trim()
          ? customNote.trim()
          : `${selectedReason}${customNote.trim() ? ` — Note: ${customNote.trim()}` : ''}`;

      await apiRequest(`/complaints/${rejectModalComplaint._id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: finalReason, note: finalReason })
      });
      closeRejectModal();
      await loadComplaints();
    } catch (err) {
      setError(err.message);
      setRejecting(false);
    }
  }

  async function handleTransition(id, nextStatus) {
    try {
      await apiRequest(`/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          note: `Technician transitioned status to ${nextStatus}`
        })
      });
      await loadComplaints();
    } catch (err) {
      setError(err.message);
    }
  }

  const isAvailable = technicianProfile?.isAvailable ?? true;

  return (
    <div className="container">
      {/* Header with Prominent Technician ID */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ margin: 0, letterSpacing: '-0.02em' }}>Technician Field Operations</h2>
            <span className="tech-id-badge tech-id-badge-lg" title="Official Field Technician ID">
              🪪 ID: {technicianBadgeId}
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Logged in as <strong>{user?.name}</strong> • Authorized for Smart EB Connect Field Dispatch
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: isAvailable ? '#dcfce7' : '#fee2e2',
              color: isAvailable ? '#15803d' : '#b91c1c',
              border: `1.5px solid ${isAvailable ? '#86efac' : '#fca5a5'}`
            }}
          >
            {isAvailable ? '🟢 AVAILABLE FOR DISPATCH' : '🔴 OFFLINE / BUSY'}
          </span>
        </div>
      </div>

      {error && <div className="hazard-alert">{error}</div>}

      {/* Workload Logic Explanation Card (Requirement 3) */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1.5px solid #bfdbfe' }}>
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>ℹ️</span> Workload & Response Protocol
        </h4>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          <strong>When you are free:</strong> Click <strong>Accept</strong> to confirm dispatch and take ownership of the complaint.
          <br />
          <strong>When you have active work / busy:</strong> Click <strong>Reject</strong> and choose your reason. This immediately releases the complaint back into the dispatch pool so another nearby technician or admin can respond without delay to the customer.
        </p>
      </div>

      <div className="grid-2">
        {/* Availability Toggle */}
        <div className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginTop: 0 }}>Dispatch Status Control</h3>
          <p style={{ fontSize: '0.92rem', color: '#475569' }}>
            Set your field availability so customers and dispatchers know whether you can accept incoming fault reports.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className={`btn ${isAvailable ? 'btn-danger' : 'btn-success'}`}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              onClick={handleToggleAvailability}
            >
              {isAvailable ? '⏹️ Set Status: Unavailable / In Active Repair' : '▶️ Set Status: Available for New Requests'}
            </button>
          </div>
        </div>

        {/* Location Coordinates */}
        <div className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginTop: 0 }}>Active Field Coordinates</h3>
          <p style={{ fontSize: '0.88rem', color: '#475569' }}>
            Your coordinates are used to calculate straight-line Haversine distance to customer outages.
          </p>
          <form onSubmit={handleUpdateLocation} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              type="number"
              step="any"
              style={{ flex: 1, minWidth: '120px' }}
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="Latitude"
              aria-label="Latitude"
            />
            <input
              type="number"
              step="any"
              style={{ flex: 1, minWidth: '120px' }}
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="Longitude"
              aria-label="Longitude"
            />
            <button type="submit" className="btn">
              Update
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleBrowserGps}>
              📍 GPS
            </button>
          </form>
          {locMessage && (
            <p style={{ fontSize: '0.82rem', color: '#16a34a', marginTop: '0.5rem', fontWeight: 600 }}>
              ✓ {locMessage}
            </p>
          )}
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🛠️</span> Assigned & Available Service Requests ({complaints.length})
            </h3>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Manage your queue: Accept when available, or Reject if occupied to auto-reassign
            </span>
          </div>
          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }} onClick={loadComplaints}>
            🔄 Refresh Queue
          </button>
        </div>

        {loading ? (
          <p>Loading assigned service requests...</p>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
            <span style={{ fontSize: '2.2rem' }}>🎉</span>
            <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>No pending or assigned requests in your queue right now.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Logged</th>
                  <th>Customer & Contact</th>
                  <th>Problem & Address</th>
                  <th>Status</th>
                  <th>Workflow Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const isMine = c.technicianId?._id === user.id || c.technicianId === user.id;
                  const nextActions = isMine ? NEXT_STATUS_BY_CURRENT[c.status] || [] : [];

                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong>{c.customerId?.name || 'Customer'}</strong>
                        {c.customerId?.phone && (
                          <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>📞 {c.customerId.phone}</div>
                        )}
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.customerId?.email}</div>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <strong style={{ textTransform: 'capitalize' }}>{c.problemType.replace(/_/g, ' ')}</strong>
                        <div style={{ fontSize: '0.88rem', color: '#334155' }}>{c.description}</div>
                        {c.address && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>📍 {c.address}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${c.status}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <Link to={`/complaints/${c._id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}>
                            View
                          </Link>

                          {/* Accept Button */}
                          {(c.status === 'pending' || (c.status === 'assigned' && isMine)) && (
                            <button
                              type="button"
                              className="btn btn-success"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                              onClick={() => handleAccept(c._id)}
                              title="Accept if you are free to dispatch immediately"
                            >
                              ✓ Accept Job
                            </button>
                          )}

                          {/* Reject Button with Workload Reason Dialog (Requirement 3) */}
                          {isMine && ['assigned', 'accepted'].includes(c.status) && (
                            <button
                              type="button"
                              className="btn btn-danger"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                              onClick={() => openRejectModal(c)}
                              title="Reject if you have work or are busy, so it reassigns to another technician"
                            >
                              ✕ Reject (Busy)
                            </button>
                          )}

                          {/* State Machine Transition Steps */}
                          {nextActions.map((act) => (
                            <button
                              key={act.status}
                              type="button"
                              className="btn"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                              onClick={() => handleTransition(c._id, act.status)}
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Reason Modal (Requirement 3) */}
      {rejectModalComplaint && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ marginTop: 0, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span> Decline / Release Service Request
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
              Technician <strong>{user?.name}</strong> (<code>{technicianBadgeId}</code>):
              <br />
              If you have other urgent work or cannot respond in time, select your reason below. This will immediately release the complaint back to the pending queue for re-dispatch.
            </p>

            <form onSubmit={submitRejection}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                  Select Reason for Declining:
                </label>
                {REJECTION_REASONS.map((reason) => (
                  <div
                    key={reason.id}
                    className={`rejection-reason-option ${selectedReason === reason.label ? 'selected' : ''}`}
                    onClick={() => setSelectedReason(reason.label)}
                  >
                    <input
                      type="radio"
                      id={reason.id}
                      name="rejection_reason"
                      checked={selectedReason === reason.label}
                      onChange={() => setSelectedReason(reason.label)}
                      style={{ width: 'auto', marginTop: '0.2rem' }}
                    />
                    <label htmlFor={reason.id} style={{ fontSize: '0.88rem', cursor: 'pointer', margin: 0, fontWeight: 550 }}>
                      {reason.label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label htmlFor="customNote">Additional Operational Note (Optional):</label>
                <textarea
                  id="customNote"
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Expected back on shift at 3 PM / Dispatched to feeder line 4"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeRejectModal} disabled={rejecting}>
                  Keep Request (Cancel)
                </button>
                <button type="submit" className="btn btn-danger" disabled={rejecting}>
                  {rejecting ? 'Releasing Job...' : 'Confirm Reject & Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
