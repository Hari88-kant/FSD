import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    try {
      await apiRequest(`/complaints/${complaintId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ technicianId })
      });
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleUserActive(userId, currentActive) {
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentActive })
      });
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  const counts = summary?.counts || {};
  const technicians = summary?.technicians || [];
  const users = summary?.users || [];

  return (
    <div className="container">
      <h2>Administrator Control Center</h2>
      {error && <div className="hazard-alert">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{counts.totalUsers ?? '-'}</div>
          <div className="stat-label">Total Registered Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.availableTechnicians ?? '-'}</div>
          <div className="stat-label">Available Technicians</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.pendingComplaints ?? '-'}</div>
          <div className="stat-label">Pending Complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.activeComplaints ?? '-'}</div>
          <div className="stat-label">In-Progress / Assigned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.resolvedComplaints ?? '-'}</div>
          <div className="stat-label">Resolved Complaints</div>
        </div>
      </div>

      <div className="card">
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
          <h3 style={{ margin: 0 }}>All System Complaints ({complaints.length})</h3>
          <div>
            <label htmlFor="statusFilter" style={{ marginRight: '0.5rem', fontWeight: 600 }}>
              Filter by Status:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Problem</th>
                  <th>Status</th>
                  <th>Assigned Technician</th>
                  <th>Assign / Reassign</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.customerId?.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {c.customerId?.email}
                      </div>
                    </td>
                    <td>
                      <strong>{c.problemType.replace(/_/g, ' ')}</strong>
                      <div style={{ fontSize: '0.84rem' }}>{c.description}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${c.status}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{c.technicianId ? c.technicianId.name : 'Unassigned'}</td>
                    <td>
                      {['pending', 'assigned', 'rejected'].includes(c.status) ? (
                        <select
                          defaultValue=""
                          onChange={(e) => handleAssignTech(c._id, e.target.value)}
                        >
                          <option value="" disabled>
                            Select Technician...
                          </option>
                          {technicians.map((tp) =>
                            tp.userId ? (
                              <option key={tp.userId._id} value={tp.userId._id}>
                                {tp.userId.name} ({tp.isAvailable ? 'Available' : 'Busy'})
                              </option>
                            ) : null
                          )}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Locked</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/complaints/${c._id}`} className="btn btn-secondary">
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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>User & Technician Directory ({users.length})</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge badge-assigned">{u.role}</span>
                  </td>
                  <td>
                    <strong style={{ color: u.isActive ? '#15803d' : '#dc2626' }}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </strong>
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        type="button"
                        className={`btn ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleUserActive(u._id, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
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
