import React from 'react';
import { FlaskConical, Wifi, WifiOff, LogOut, Sun, Moon, Menu } from 'lucide-react';
import { api } from '../api/supabaseClient';

export default function Navbar({ session, onLogout, theme, onToggleTheme, onMenuToggle }) {
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
      height: 'var(--navbar-height)', display: 'flex', alignItems: 'center', padding: '0 1rem',
      gap: '10px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 60,
    }}>
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="mobile-menu-btn"
        aria-label="Toggle sidebar"
        style={{
          display: 'none',
          width: '36px', height: '36px', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: '1px solid var(--border-color)',
          borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <Menu size={18} />
      </button>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '4px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'var(--accent-gradient)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <FlaskConical size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '15px', whiteSpace: 'nowrap' }}>
          Pre-LIS <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '12px' }}>PCR Lab</span>
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Badges */}
      {session?.facility && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{
            padding: '3px 8px', borderRadius: '20px',
            background: 'var(--accent-glow)', border: '1px solid rgba(20,184,166,0.2)',
            color: 'var(--accent-teal)', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {session.facility.split(' ')[0]}
          </span>
          {session?.role && (
            <span className="role-badge" style={{
              padding: '3px 8px', borderRadius: '20px',
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              color: '#3b82f6', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              {session.role}
            </span>
          )}
        </div>
      )}

      {/* Online status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px',
        borderRadius: '20px', fontSize: '11px', fontWeight: 600,
        background: online ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
        color: online ? 'var(--accent-emerald)' : 'var(--sync-pending)',
        whiteSpace: 'nowrap',
      }}>
        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span className="online-label">{online ? 'Online' : 'Offline'}</span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        title="Toggle theme"
        style={{
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px',
          cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
        }}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
          background: 'transparent', border: '1px solid var(--border-color)',
          color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'inherit',
          flexShrink: 0, whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--priority-urgent)'; e.currentTarget.style.borderColor = 'var(--priority-urgent-border)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
      >
        <LogOut size={13} />
        <span className="signout-label">Sign Out</span>
      </button>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .role-badge { display: none; }
          .online-label { display: none; }
          .signout-label { display: none; }
        }
      `}</style>
    </header>
  );
}
