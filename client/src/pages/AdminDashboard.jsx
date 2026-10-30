import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useTheme } from '../context/ThemeContext.jsx';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const { playHapticSound } = useTheme();

  async function loadAdminData() {
    setLoading(true);
    setError('');
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const [sumData, compData] = await Promise.all([
        apiRequest('/admin/summary'),
        apiRequest(`/complaints${query}`)
      ]);
      setSummary(sumData);
      setComplaints(compData.complaints || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [statusFilter]);

  async function handleAssignTech(complaintId, technicianId) {
    if (!technicianId) return;
    playHapticSound('click');
    try {
      await apiRequest(`/complaints/${complaintId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ technicianId })
      });
      playHapticSound('success');
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleUserActive(userId, currentActive) {
    playHapticSound('toggle');
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentActive })
      });
      playHapticSound('success');
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    playHapticSound('click');
    setTimeout(() => setCopiedId(''), 2000);
  }

  const counts = summary?.counts || {};
  const technicians = summary?.technicians || [];
  const users = summary?.users || [];

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.problemType.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.status && c.status.toLowerCase().includes(q)) ||
      (c.customerId?.name && c.customerId.name.toLowerCase().includes(q)) ||
      (c.technicianId?.name && c.technicianId.name.toLowerCase().includes(q)) ||
      (c.technicianId?.technicianBadgeId && c.technicianId.technicianBadgeId.toLowerCase().includes(q)) ||
      c._id.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!userQuery.trim()) return true;
    const q = userQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.technicianBadgeId && u.technicianBadgeId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>Administrator Command & Monitoring</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            System-wide grid telemetry, technician badge tracking, and active dispatch management.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-accepted" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
            🛡️ Master Access
          </span>
        </div>
      </div>

      {copiedId && (
        <div style={{ padding: '0.4rem 0.8rem', background: 'var(--badge-tech-bg)', color: 'var(--primary)', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 600 }}>
          ✓ Copied {copiedId} to clipboard!
        </div>
      )}

      {error && <div className="hazard-alert">{error}</div>}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{counts.totalUsers ?? '-'}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-value">{counts.availableTechnicians ?? '-'}</div>
          <div className="stat-label">Active Technicians</div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-value">{counts.pendingComplaints ?? '-'}</div>
          <div className="stat-label">Pending Queued</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.activeComplaints ?? '-'}</div>
          <div className="stat-label">In-Flight / En Route</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-value">{counts.resolvedComplaints ?? '-'}</div>
          <div className="stat-label">Resolved Outages</div>
        </div>
      </div>

      {/* Complaints Management Card */}
      <div className="card" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> All Grid Complaints ({filteredComplaints.length} of {complaints.length})
            </h3>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Dispatch, assign, and monitor service progress across customer reports
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Filter complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: '180px' }}
            />
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                playHapticSound('click');
              }}
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="on_the_way">On The Way</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading complaints...</p>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No complaints found matching current filters.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Fault & Location</th>
                  <th>Status</th>
                  <th>Assigned Tech & Badge ID</th>
                  <th>Assign / Reassign</th>
                  <th>Audit</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.customerId?.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {c.customerId?.email}
                      </div>
                    </td>
                    <td>
                      <strong style={{ textTransform: 'capitalize' }}>{c.problemType.replace(/_/g, ' ')}</strong>
                      <div style={{ fontSize: '0.84rem' }}>{c.description}</div>
                      {c.address && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📍 {c.address}</div>
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
                            <span
                              className="tech-id-badge"
                              style={{ fontSize: '0.74rem', padding: '0.15rem 0.45rem', marginTop: '0.2rem', cursor: 'pointer' }}
                              onClick={() => copyToClipboard(c.technicianId.technicianBadgeId)}
                              title="Click to copy ID"
                            >
                              🪪 {c.technicianId.technicianBadgeId || 'EB-TECH'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      {['pending', 'assigned', 'rejected'].includes(c.status) ? (
                        <select
                          defaultValue=""
                          onChange={(e) => handleAssignTech(c._id, e.target.value)}
                          style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
                        >
                          <option value="" disabled>
                            Select Technician...
                          </option>
                          {technicians.map((tp) => {
                            const u = tp.userId;
                            if (!u) return null;
                            const badge = tp.technicianBadgeId || u.technicianBadgeId || `EB-TECH-${u._id.slice(-4)}`;
                            return (
                              <option key={u._id} value={u._id}>
                                {u.name} [{badge}] ({tp.isAvailable ? 'Free' : 'Busy'})
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locked ({c.status})</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/complaints/${c._id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}>
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User & Technician Monitoring Directory */}
      <div className="card" style={{ boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>👥</span> User & Technician Directory ({filteredUsers.length} of {users.length})
            </h3>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Technician Badge IDs for Field Monitoring, Logging, and Audit compliance
            </span>
          </div>

          <div>
            <input
              type="text"
              placeholder="🔍 Search users..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: '180px' }}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User / Name</th>
                <th>Email & Phone</th>
                <th>Role</th>
                <th>Monitoring & Badge ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const badge =
                  u.technicianBadgeId ||
                  (u.role === 'technician' ? `EB-TECH-${u._id.toString().slice(-4).toUpperCase()}` : null);

                return (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>
                      <div>{u.email}</div>
                      {u.phone && <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{u.phone}</div>}
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-assigned' : u.role === 'technician' ? 'badge-on_the_way' : 'badge-resolved'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {badge ? (
                        <span
                          className="tech-id-badge"
                          style={{ cursor: 'pointer' }}
                          onClick={() => copyToClipboard(badge)}
                          title="Click to copy ID"
                        >
                          🪪 {badge}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: u.isActive ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem' }}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </strong>
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          className={`btn ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                          onClick={() => handleToggleUserActive(u._id, u.isActive)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
