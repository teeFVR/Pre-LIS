import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, Users, RefreshCw } from 'lucide-react';
import { api } from '../api/supabaseClient';

const STATUS_STYLES = {
  pending:  { badge: 'badge-pending',  label: 'Pending' },
  approved: { badge: 'badge-synced',   label: 'Approved' },
  rejected: { badge: 'badge-urgent',   label: 'Rejected' },
};

export default function UsersAdmin({ session }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.getPendingUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (userId, status) => {
    const action = status === 'approved' ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await api.updateUserStatus(userId, status);
      await load();
    } catch (err) {
      alert('Failed to update user: ' + err.message);
    }
  };

  const filtered = users.filter(u => filter === 'all' || u.status === filter);
  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Approve or reject clinic staff registration requests
          </p>
        </div>
        <div className="header-actions">
          {pendingCount > 0 && (
            <span style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
              background: 'rgba(245,158,11,0.15)', color: 'var(--sync-pending)',
              border: '1px solid rgba(245,158,11,0.3)',
            }}>
              {pendingCount} pending
            </span>
          )}
          <button className="btn btn-secondary" onClick={load} style={{ gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '5px 14px', fontSize: '12px', textTransform: 'capitalize' }}
          >
            {f} {f !== 'all' && `(${users.filter(u => u.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Facility</th>
              <th>Role</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No {filter === 'all' ? '' : filter} users found
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{u.email || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.facility || '—'}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: u.role === 'Lab User' ? 'rgba(59,130,246,0.1)' : 'rgba(20,184,166,0.1)',
                      color: u.role === 'Lab User' ? '#3b82f6' : 'var(--accent-teal)',
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_STYLES[u.status]?.badge || 'badge-pending'}`}>
                      {STATUS_STYLES[u.status]?.label || u.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {u.status !== 'approved' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                          onClick={() => handleStatus(u.id, 'approved')}
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                      )}
                      {u.status !== 'rejected' && u.role !== 'Lab User' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11px', gap: '4px', color: 'var(--priority-urgent)' }}
                          onClick={() => handleStatus(u.id, 'rejected')}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
