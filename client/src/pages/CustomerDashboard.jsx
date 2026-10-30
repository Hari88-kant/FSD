import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import MapPicker from '../components/MapPicker.jsx';
import LocationSearchInput from '../components/LocationSearchInput.jsx';

const PROBLEM_CATEGORIES = [
  { value: 'power_outage', label: 'Power Outage', icon: '⚡', desc: 'Phase failure or complete blackout' },
  { value: 'voltage_fluctuation', label: 'Voltage Issue', icon: '💡', desc: 'Lights dimming or voltage surge' },
  { value: 'meter_fault', label: 'Meter Fault', icon: '📟', desc: 'LCD blank or red warning led' },
  { value: 'fuse_blown', label: 'Blown Fuse', icon: '🔌', desc: 'Service pole or transformer fuse' },
  { value: 'billing_or_connection', label: 'Service Line', icon: '🏗️', desc: 'Sagging or disconnected cable' },
  { value: 'sparking_or_exposed_wire', label: '⚠️ Sparking / Live Wire', icon: '🔥', desc: 'Critical electrical hazard', isHazard: true },
  { value: 'other', label: 'Other Issue', icon: '📝', desc: 'General electricity fault' }
];

export default function CustomerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [nearbyTechs, setNearbyTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [safetyAlert, setSafetyAlert] = useState('');

  // Form states
  const [problemType, setProblemType] = useState('power_outage');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Anekal Town, Bengaluru Urban, Karnataka');
  const [lat, setLat] = useState(12.7109);
  const [lng, setLng] = useState(77.6953);
  const [useCoordinates, setUseCoordinates] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [compData, techData] = await Promise.all([
        apiRequest('/complaints'),
        apiRequest(`/technicians/nearby?lat=${lat}&lng=${lng}&radiusKm=60`)
      ]);
      setComplaints(compData.complaints || []);
      setNearbyTechs(techData.technicians || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [lat, lng]);

  function handleRequestBrowserGps() {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation API is not supported by your browser. Please search location above or click map.');
      return;
    }
    setGpsStatus('Requesting browser location permission...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(6));
        const nextLng = Number(pos.coords.longitude.toFixed(6));
        setLat(nextLat);
        setLng(nextLng);
        setUseCoordinates(true);
        setGpsStatus(`GPS acquired (${nextLat}, ${nextLng})`);
      },
      (err) => {
        setGpsStatus(
          `Location permission denied (${err.message}). You can pick any location using the search dropdown above or click the map.`
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleLocationChosen(chosenLat, chosenLng, chosenAddress) {
    setLat(chosenLat);
    setLng(chosenLng);
    setAddress(chosenAddress);
    setUseCoordinates(true);
    setGpsStatus(`Selected: ${chosenAddress} (${chosenLat}, ${chosenLng})`);
  }

  async function handleCreateComplaint(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSafetyAlert('');
    try {
      const payload = {
        problemType,
        description,
        address,
        ...(useCoordinates && typeof lat === 'number' && typeof lng === 'number'
          ? { lat, lng }
          : { lat: null, lng: null })
      };
      const res = await apiRequest('/complaints', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.safetyWarning) {
        setSafetyAlert(res.safetyWarning);
      }
      setDescription('');
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelComplaint(id) {
    try {
      await apiRequest(`/complaints/${id}`, { method: 'DELETE' });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAssignNearest(complaintId, technicianId) {
    try {
      await apiRequest(`/complaints/${complaintId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ technicianId })
      });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>Customer Service Portal</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Report electrical faults with live location selection and real-time technician dispatch tracking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="user-tag" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: 600 }}>
            🟢 Grid Connected
          </span>
        </div>
      </div>

      {error && <div className="hazard-alert">{error}</div>}
      {safetyAlert && <div className="hazard-alert">{safetyAlert}</div>}

      <div className="grid-2">
        {/* Complaint Submission Card */}
        <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span> Report an Electricity Issue
          </h3>

          <form onSubmit={handleCreateComplaint}>
            {/* Category Cards Picker */}
            <div className="form-group">
              <label>Select Fault Category</label>
              <div className="category-picker-grid">
                {PROBLEM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`category-card-btn ${problemType === cat.value ? 'active' : ''} ${cat.isHazard ? 'is-hazard' : ''}`}
                    onClick={() => setProblemType(cat.value)}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {problemType === 'sparking_or_exposed_wire' && (
              <div className="hazard-alert" style={{ fontSize: '0.88rem' }}>
                <span>🔥</span>
                <div>
                  <strong>IMMEDIATE HAZARD:</strong> Stay at least 10 meters away from sparking equipment or downed lines. Call the official utility emergency helpline (<strong>1912</strong>) or <strong>112</strong> now.
                </div>
              </div>
            )}

            {/* Location Autocomplete & Search Input (Requirement 1) */}
            <div className="form-group">
              <label htmlFor="address-search">Location & Landmark (Search or Fast Select)</label>
              <LocationSearchInput
                value={address}
                onChange={(newAddr) => setAddress(newAddr)}
                onSelectLocation={handleLocationChosen}
                placeholder="Type street, area, or landmark (e.g. Anekal, Electronic City)..."
              />
            </div>

            {/* GPS & Map Sync */}
            <div className="form-group" style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.84rem', padding: '0.45rem 0.85rem' }} onClick={handleRequestBrowserGps}>
                  📍 Use Current Browser GPS
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={useCoordinates}
                    onChange={(e) => setUseCoordinates(e.target.checked)}
                  />
                  <span>Coordinates: <code>{lat}, {lng}</code></span>
                </label>
              </div>
              {gpsStatus && (
                <p style={{ fontSize: '0.82rem', color: '#2563eb', margin: '0.5rem 0 0 0', fontWeight: 550 }}>
                  ✓ {gpsStatus}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Detailed Description of Fault</label>
              <textarea
                id="description"
                rows={3}
                required
                minLength={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, affected phase, sparking, meter error code, etc."
              />
            </div>

            <button type="submit" className="btn" disabled={submitting} style={{ width: '100%', padding: '0.75rem' }}>
              {submitting ? 'Submitting Report...' : '⚡ Submit Electricity Complaint'}
            </button>
          </form>
        </div>

        {/* Map & Available Nearby Technicians */}
        <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📍</span> Live Dispatch Map & Radar
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click map to adjust pin</span>
          </div>

          <MapPicker
            lat={lat}
            lng={lng}
            onSelectLocation={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
              setUseCoordinates(true);
              setGpsStatus(`Pinned on map (${newLat}, ${newLng})`);
            }}
            technicians={nearbyTechs}
          />

          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
                Available Technicians Ranked by Proximity ({nearbyTechs.length})
              </h4>
              <span className="badge badge-accepted" style={{ fontSize: '0.72rem' }}>Straight-Line Distance</span>
            </div>

            {nearbyTechs.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No technicians available within current search radius.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Technician & ID</th>
                      <th>Skills</th>
                      <th>Proximity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearbyTechs.map((t) => (
                      <tr key={t.technicianId}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{t.name}</div>
                          <span className="tech-id-badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', marginTop: '0.2rem' }}>
                            🪪 {t.technicianBadgeId || 'EB-TECH'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                            {(t.skills || []).slice(0, 2).map(s => s.replace(/_/g, ' ')).join(', ')}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#2563eb' }}>
                            {t.distanceKm !== null ? `${t.distanceKm} km` : 'No GPS'}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaints Tracking Table */}
      <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📋</span> My Reported Complaints ({complaints.length})
          </h3>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Live Status Tracking</span>
        </div>

        {loading ? (
          <p>Loading your complaints...</p>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <span style={{ fontSize: '2rem' }}>💡</span>
            <p style={{ margin: '0.5rem 0 0 0' }}>You have not submitted any complaints yet. Use the form above to log an issue.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Logged</th>
                  <th>Category</th>
                  <th>Address & Details</th>
                  <th>Status</th>
                  <th>Assigned Technician</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td>
                      <strong style={{ textTransform: 'capitalize' }}>{c.problemType.replace(/_/g, ' ')}</strong>
                      {c.isHazardous && (
                        <div style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>⚠️ Hazard Flagged</div>
                      )}
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '0.9rem' }}>{c.description}</div>
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
                      {c.technicianId ? (
                        <div>
                          <strong>{c.technicianId.name}</strong>
                          <div>
                            <span className="tech-id-badge" style={{ fontSize: '0.74rem', padding: '0.15rem 0.45rem', marginTop: '0.2rem' }}>
                              🪪 {c.technicianId.technicianBadgeId || 'EB-TECH'}
                            </span>
                          </div>
                          {c.technicianId.phone && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>📞 {c.technicianId.phone}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>Unassigned (Pending)</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Link to={`/complaints/${c._id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
                          Audit Trail
                        </Link>
                        {c.status === 'pending' && nearbyTechs.length > 0 && (
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                            onClick={() => handleAssignNearest(c._id, nearbyTechs[0].technicianId)}
                          >
                            Dispatch Nearest
                          </button>
                        )}
                        {['pending', 'assigned'].includes(c.status) && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                            onClick={() => handleCancelComplaint(c._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
