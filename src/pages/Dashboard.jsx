import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, AlertTriangle, CheckCircle2, Clock,
  Plus, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import { api } from '../api/supabaseClient';

function StatCard({ label, value, sub, color, icon: Icon }) {
  const colors = {
    teal: { border: 'rgba(20,184,166,0.3)', text: 'var(--accent-teal)' },
    red: { border: 'rgba(239,68,68,0.3)', text: 'var(--priority-urgent)' },
    green: { border: 'rgba(16,185,129,0.3)', text: 'var(--accent-emerald)' },
    default: { border: 'var(--border-color)', text: 'var(--text-primary)' },
  };
  const c = colors[color] || colors.default;
  return (
    <div style={{
      background: 'var(--card-bg)', border: `1px solid ${c.border}`,
      borderRadius: '14px', padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            {label}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: c.text, lineHeight: 1 }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `${c.text}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={c.text} />
          </div>
        )}
      </div>
    </div>
  );
}

function priorityBadge(priority) {
  const isUrgent = priority === 'urgent';
  return (
    <span className={`badge badge-${isUrgent ? 'urgent' : 'routine'}`}>
      {priority.toUpperCase()}
    </span>
  );
}

function syncBadge(synced) {
  return (
    <span className={`badge ${synced ? 'badge-synced' : 'badge-pending'}`}>
      {synced ? 'Synced' : 'Local'}
    </span>
  );
}

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, today: 0, urgent: 0, pending: 0 });
  const [recent, setRecent] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);

  const refresh = useCallback(async () => {
    const [s, all] = await Promise.all([api.getStats(), api.getSamples()]);
    setStats(s);
    setRecent(all.slice(0, 10));
  }, []);

  useEffect(() => {
    refresh();
    const handleOnline = () => { setOnline(true); api.syncPending(); };
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh]);

  const today = new Date().toLocaleDateString('en-ZM', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            {today} · {session?.facility}
          </p>
        </div>
        <div className="header-actions">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
            borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            background: online ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            color: online ? 'var(--accent-emerald)' : 'var(--sync-pending)',
            border: `1px solid ${online ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
          }}>
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online ? 'Online' : 'Offline — data saved locally'}
          </div>
          <button className="btn btn-secondary" onClick={refresh} style={{ gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ gap: '6px' }}>
            <Plus size={14} /> New Sample
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Today's Samples" value={stats.today} sub="registered today" color="teal" icon={FlaskConical} />
        <StatCard label="Urgent Samples" value={stats.urgent} sub="require priority processing" color="red" icon={AlertTriangle} />
        <StatCard label="Total Registered" value={stats.total} sub="in local registry" color="green" icon={CheckCircle2} />
        <StatCard label="Pending Sync" value={stats.pending} sub="awaiting Supabase upload" color="default" icon={Clock} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Recent Registrations</h3>
        <button className="btn btn-secondary" onClick={() => navigate('/samples')} style={{ fontSize: '12px', padding: '5px 10px' }}>
          View All →
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sample ID</th>
              <th>Patient</th>
              <th>Test Requested</th>
              <th>Priority</th>
              <th>Collected</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No samples registered yet — click <strong>New Sample</strong> to begin.
                </td>
              </tr>
            ) : (
              recent.map(s => (
                <tr key={s.sample_id} style={{ cursor: 'pointer' }} onClick={() => navigate('/samples')}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-teal)', fontWeight: 700 }}>
                    {s.sample_id}
                  </td>
                  <td>{s.patient_name}</td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.test_requested}
                  </td>
                  <td>{priorityBadge(s.priority)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {s.collection_date} {s.collection_time}
                  </td>
                  <td>{syncBadge(s.synced)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
