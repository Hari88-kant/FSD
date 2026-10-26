import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const NEXT_STATUS_BY_CURRENT = {
  accepted: [
    { status: 'on_the_way', label: 'Mark On The Way 🚗' },
    { status: 'in_progress', label: 'Start Repair (In Progress) 🔧' }
  ],
  on_the_way: [{ status: 'in_progress', label: 'Start Repair (In Progress) 🔧' }],
  in_progress: [{ status: 'resolved', label: 'Mark Resolved ✅' }]
};

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
        setLocMessage(`Browser GPS denied (${err.message}). Use manual coordinates above.`);
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

  async function handleReject(id) {
    try {
      await apiRequest(`/complaints/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: 'Technician unavailable for immediate dispatch' })
      });
      await loadComplaints();
    } catch (err) {
      setError(err.message);
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
      <h2>Technician Dashboard</h2>
      {error && <div className="hazard-alert">{error}</div>}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Availability Status</h3>
          <p>
            Current Status:{' '}
            <strong style={{ color: isAvailable ? '#15803d' : '#dc2626' }}>
              {isAvailable ? 'AVAILABLE FOR DISPATCH' : 'OFFLINE / BUSY'}
            </strong>
          </p>
          <button
            type="button"
            className={`btn ${isAvailable ? 'btn-danger' : 'btn-success'}`}
            onClick={handleToggleAvailability}
          >
            {isAvailable ? 'Set Status: Unavailable' : 'Set Status: Available'}
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Update My Field Location</h3>
          <form onSubmit={handleUpdateLocation} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              type="number"
              step="any"
              style={{ width: '140px', padding: '0.45rem' }}
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="Latitude"
              aria-label="Latitude"
            />
            <input
              type="number"
              step="any"
              style={{ width: '140px', padding: '0.45rem' }}
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="Longitude"
              aria-label="Longitude"
            />
            <button type="submit" className="btn">
              Save Coords
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleBrowserGps}>
              📍 Use Browser GPS
            </button>
          </form>
          {locMessage && (
            <p style={{ fontSize: '0.84rem', color: '#15803d', marginTop: '0.5rem' }}>
              {locMessage}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Assigned & Eligible Service Requests ({complaints.length})</h3>
        {loading ? (
          <p>Loading requests...</p>
        ) : complaints.length === 0 ? (
          <p style={{ color: '#64748b' }}>No assigned or pending requests right now.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Customer</th>
                  <th>Issue & Location</th>
                  <th>Status</th>
                  <th>Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const isMine = c.technicianId?._id === user.id || c.technicianId === user.id;
                  const nextActions = isMine ? NEXT_STATUS_BY_CURRENT[c.status] || [] : [];

                  return (
                    <tr key={c._id}>
                      <td>{new Date(c.createdAt).toLocaleString()}</td>
                      <td>
                        <strong>{c.customerId?.name || 'Customer'}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {c.customerId?.phone}
                        </div>
                      </td>
                      <td>
                        <strong>{c.problemType.replace(/_/g, ' ')}</strong>
                        <div>{c.description}</div>
                        {c.address && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 {c.address}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${c.status}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <Link to={`/complaints/${c._id}`} className="btn btn-secondary">
                            View
                          </Link>

                          {(c.status === 'pending' || (c.status === 'assigned' && isMine)) && (
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => handleAccept(c._id)}
                            >
                              Accept
                            </button>
                          )}

                          {isMine && ['assigned', 'accepted'].includes(c.status) && (
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => handleReject(c._id)}
                            >
                              Reject
                            </button>
                          )}

                          {nextActions.map((act) => (
                            <button
                              key={act.status}
                              type="button"
                              className="btn"
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
    </div>
  );
}
