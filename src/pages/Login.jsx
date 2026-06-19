import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, AlertCircle } from 'lucide-react';
import { api } from '../api/supabaseClient';

const FACILITIES = [
  'UTH - Outpatient Dept.',
  'Kitwe Central Hospital',
  'Ndola Teaching Hospital',
  'Choma General Hospital',
  'Livingstone General Hospital',
  'Chipata General Hospital',
  'Kabwe General Hospital',
  'Mansa General Hospital',
  'Solwezi General Hospital',
  'St. Francis Mission Hospital',
  'Demo Clinic (Training)',
];

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [facility, setFacility] = useState('');
  const [role, setRole] = useState('Clinic Staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!facility) { setError('Please select your facility.'); return; }
    if (!username.trim()) { setError('Username is required.'); return; }
    if (!password) { setError('Password is required.'); return; }

    setLoading(true);
    // Demo auth — replace with Supabase Auth for production
    await new Promise(r => setTimeout(r, 500));
    const session = api.login({ facility, role, username: username.trim() });
    onLoginSuccess(session);
    navigate('/');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '400px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'var(--accent-gradient)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <FlaskConical size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Pre-LIS Portal</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
              PCR Sample Registration System
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Sign In</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1.5rem' }}>
          Access your facility's sample registry
        </p>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
            background: 'var(--priority-urgent-bg)', border: '1px solid var(--priority-urgent-border)',
            borderRadius: '8px', marginBottom: '1rem', color: 'var(--priority-urgent)', fontSize: '13px',
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Facility / Collection Point</label>
            <select className="form-select" value={facility} onChange={e => setFacility(e.target.value)}>
              <option value="">— Select your facility —</option>
              {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="Clinic Staff">Sample Collection Point User (Clinic Staff)</option>
              <option value="Laboratory User">Laboratory User</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. lab.officer01"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', fontSize: '15px' }}
          >
            {loading ? 'Signing in...' : 'Sign In to System'}
          </button>
        </form>

        <div style={{
          marginTop: '1.25rem', padding: '10px 14px',
          background: 'var(--accent-glow)', border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: '8px', fontSize: '12px', color: 'var(--accent-teal)',
        }}>
          <strong style={{ display: 'block', marginBottom: '2px' }}>Demo Access</strong>
          Any facility · any username/password
        </div>
      </div>
    </div>
  );
}
