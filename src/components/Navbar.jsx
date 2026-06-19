import React from 'react';
import { FlaskConical, Wifi, WifiOff, LogOut, Sun, Moon } from 'lucide-react';
import { api } from '../api/supabaseClient';

export default function Navbar({ session, onLogout, theme, onToggleTheme }) {
  const [online, setOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const handleLogout = () => {
    api.logout();
    onLogout();
  };

  return (
    <header style={{
      height: '56px', display: 'flex', alignItems: 'center', padding: '0 1.25rem',
      gap: '12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '8px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FlaskConical size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '15px' }}>
          Pre-LIS <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '13px' }}>PCR Lab</span>
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {session?.facility && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            padding: '4px 10px', borderRadius: '20px',
            background: 'var(--accent-glow)', border: '1px solid rgba(20,184,166,0.2)',
            color: 'var(--accent-teal)', fontSize: '11px', fontWeight: 600,
          }}>
            {session.facility.split(' ')[0]}
          </span>
          {session?.role && (
            <span style={{
              padding: '4px 10px', borderRadius: '20px',
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              color: '#3b82f6', fontSize: '11px', fontWeight: 600,
            }}>
              {session.role}
            </span>
          )}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px',
        borderRadius: '20px', fontSize: '11px', fontWeight: 600,
        background: online ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
        color: online ? 'var(--accent-emerald)' : 'var(--sync-pending)',
      }}>
        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        {online ? 'Online' : 'Offline'}
      </div>

      <button
        onClick={onToggleTheme}
        title="Toggle theme"
        style={{
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer',
          color: 'var(--text-muted)',
        }}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      <button
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
          background: 'transparent', border: '1px solid var(--border-color)',
          color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'inherit',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--priority-urgent)'; e.currentTarget.style.borderColor = 'var(--priority-urgent-border)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
      >
        <LogOut size={13} /> Sign Out
      </button>
    </header>
  );
}
