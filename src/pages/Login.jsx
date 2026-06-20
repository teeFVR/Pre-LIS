import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, AlertCircle, Mail, Lock, UserPlus } from 'lucide-react';
import { api } from '../api/supabaseClient';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Login fields
  const [nameOrEmail, setNameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [facility, setFacility] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const FACILITIES = [
    'UTH - University Teaching Hospital',
    'Kitwe Central Hospital',
    'Ndola Teaching Hospital',
    'Choma General Hospital',
    'Livingstone General Hospital',
    'Chipata General Hospital',
    'Kabwe General Hospital',
    'Mansa General Hospital',
    'Solwezi General Hospital',
    'St. Francis Mission Hospital',
    'Kasama General Hospital',
    'Lewanika General Hospital',
    'Other',
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!nameOrEmail.trim()) { setError('Name or email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      const session = await api.login(nameOrEmail.trim(), password);
      onLoginSuccess(session);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!facility) { setError('Please select your facility.'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.registerUser({
        fullName: fullName.trim(),
        facility,
        password: regPassword,
      });
      setSuccess('Registration submitted! Your account is pending approval by the lab administrator.');
      setFullName(''); setFacility(''); setRegPassword(''); setRegConfirm('');
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '420px',
      }}>
        {/* Header */}
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
              Kitwe Teaching Hospital PCR Lab
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: '4px', background: 'var(--bg-primary)',
          borderRadius: '10px', padding: '4px', marginBottom: '1.5rem',
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '8px', borderRadius: '7px', border: 'none',
                fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                background: mode === m ? 'var(--bg-secondary)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px',
            background: 'var(--priority-urgent-bg)', border: '1px solid var(--priority-urgent-border)',
            borderRadius: '8px', marginBottom: '1rem', color: 'var(--priority-urgent)', fontSize: '13px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            padding: '10px 12px', background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px',
            marginBottom: '1rem', color: 'var(--accent-emerald)', fontSize: '13px', lineHeight: '1.6',
          }}>
            {success}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Your Name <span style={{color:'var(--text-muted)', fontWeight:400}}>(Lab User: use email)</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Mwansa Bwalya"
                  value={nameOrEmail}
                  onChange={e => setNameOrEmail(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: '34px' }}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontSize: '15px', marginTop: '0.5rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '1rem' }}>
              New clinic staff?{' '}
              <span
                onClick={() => { setMode('register'); setError(''); }}
                style={{ color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }}
              >
                Request access
              </span>
            </p>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && !success && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Mwansa Bwalya"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Facility / Collection Point</label>
              <select className="form-select" value={facility} onChange={e => setFacility(e.target.value)}>
                <option value="">— Select your facility —</option>
                {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Min. 6 characters"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Repeat password"
                value={regConfirm}
                onChange={e => setRegConfirm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontSize: '15px', marginTop: '0.5rem', gap: '6px' }}
            >
              <UserPlus size={16} />
              {loading ? 'Submitting...' : 'Request Access'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '1rem' }}>
              Your request will be reviewed by the lab administrator before you can log in.
            </p>
          </form>
        )}

        {success && mode === 'register' && (
          <button
            className="btn btn-secondary"
            onClick={() => { setMode('login'); setSuccess(''); }}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
}