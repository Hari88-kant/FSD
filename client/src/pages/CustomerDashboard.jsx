import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import MapPicker from '../components/MapPicker.jsx';

const PROBLEM_OPTIONS = [
  { value: 'power_outage', label: 'Power Outage / Phase Failure' },
  { value: 'voltage_fluctuation', label: 'Voltage Fluctuation / Dimming' },
  { value: 'meter_fault', label: 'Smart/Digital Meter Fault' },
  { value: 'fuse_blown', label: 'Pole or Service Fuse Blown' },
  { value: 'billing_or_connection', label: 'Service Line / Connection Issue' },
  { value: 'sparking_or_exposed_wire', label: '⚠️ Sparking / Exposed Wire / Burning Smell' },
  { value: 'other', label: 'Other Electrical Issue' }
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
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(12.8452);
  const [lng, setLng] = useState(77.6602);
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
      setGpsStatus('Geolocation API is not supported by your browser. Please enter address or click the map.');
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
        setGpsStatus(`Location acquired (${nextLat}, ${nextLng})`);
      },
      (err) => {
        setGpsStatus(
          `Location permission denied or unavailable (${err.message}). You can still submit using a manual address or by clicking the map.`
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
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
      setAddress('');
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
      <h2>Customer Dashboard</h2>
      {error && <div className="hazard-alert">{error}</div>}
      {safetyAlert && <div className="hazard-alert">{safetyAlert}</div>}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Report an Electricity Issue</h3>
          {problemType === 'sparking_or_exposed_wire' && (
            <div className="hazard-alert">
              ⚠️ <strong>DANGER:</strong> For live sparking, exposed conductors, or fire risk, stay
              at a safe distance and contact your official electricity utility emergency line (1912)
              or 112 immediately.
            </div>
          )}

          <form onSubmit={handleCreateComplaint}>
            <div className="form-group">
              <label htmlFor="problemType">Problem Category</label>
              <select
                id="problemType"
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
              >
                {PROBLEM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Detailed Description (min 10 chars)</label>
              <textarea
                id="description"
                rows={3}
                required
                minLength={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the electricity fault, affected phase/meter, and since when..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address / Landmark (Manual Fallback Supported)</label>
              <input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Flat No, Street, Area, Landmark"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-secondary" onClick={handleRequestBrowserGps}>
                  📍 Share Browser GPS Location
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={useCoordinates}
                    onChange={(e) => setUseCoordinates(e.target.checked)}
                  />
                  Include GPS coordinates ({lat}, {lng})
                </label>
              </div>
              {gpsStatus && (
                <p style={{ fontSize: '0.84rem', color: '#334155', margin: '0.4rem 0 0 0' }}>
                  {gpsStatus}
                </p>
              )}
            </div>

            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Submitting Complaint...' : 'Submit Complaint'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Location Map & Nearby Available Technicians</h3>
          <MapPicker
            lat={lat}
            lng={lng}
            onSelectLocation={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
              setUseCoordinates(true);
            }}
            technicians={nearbyTechs}
          />

          <h4 style={{ marginBottom: '0.5rem' }}>
            Available Technicians Ranked by Straight-Line Distance ({nearbyTechs.length})
          </h4>
          {nearbyTechs.length === 0 ? (
            <p style={{ color: '#64748b' }}>No available technicians found within radius.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th>Skills</th>
                    <th>Straight-Line Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {nearbyTechs.map((t) => (
                    <tr key={t.technicianId}>
                      <td>
                        <strong>{t.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.phone}</div>
                      </td>
                      <td>{(t.skills || []).join(', ')}</td>
                      <td>
                        {t.distanceKm !== null ? (
                          <strong>{t.distanceKm} km</strong>
                        ) : (
                          'No GPS coords'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>My Complaints ({complaints.length})</h3>
        {loading ? (
          <p>Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <p style={{ color: '#64748b' }}>You have not submitted any complaints yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Category</th>
                  <th>Description & Address</th>
                  <th>Status</th>
                  <th>Assigned Technician</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td>{new Date(c.createdAt).toLocaleString()}</td>
                    <td>
                      <strong>{c.problemType.replace(/_/g, ' ')}</strong>
                    </td>
                    <td>
                      <div>{c.description}</div>
                      {c.address && (
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>📍 {c.address}</div>
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
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {c.technicianId.phone}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <Link to={`/complaints/${c._id}`} className="btn btn-secondary">
                          Details
                        </Link>
                        {c.status === 'pending' && nearbyTechs.length > 0 && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleAssignNearest(c._id, nearbyTechs[0].technicianId)}
                          >
                            Request Nearest Tech
                          </button>
                        )}
                        {['pending', 'assigned'].includes(c.status) && (
                          <button
                            type="button"
                            className="btn btn-danger"
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
