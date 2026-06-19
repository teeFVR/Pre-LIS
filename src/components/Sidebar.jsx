import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plus, FlaskConical, Download, Settings, Package } from 'lucide-react';
import { api } from '../api/supabaseClient';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/register', icon: Plus, label: 'Register Sample', roles: ['Clinic Staff'] },
  { to: '/samples', icon: FlaskConical, label: 'All Samples' },
  { to: '/batches', icon: Package, label: 'Batches', roles: ['Laboratory User'] },
];

export default function Sidebar({ session }) {
  const handleExport = async () => {
    const csv = await api.exportCSV();
    if (!csv) { alert('No samples to export'); return; }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre-lis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '9px',
    padding: '9px 12px', margin: '1px 6px',
    borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
    textDecoration: 'none', transition: 'all 0.15s',
    background: isActive ? 'var(--accent-glow)' : 'transparent',
    color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)',
    border: isActive ? '1px solid rgba(20,184,166,0.2)' : '1px solid transparent',
    fontWeight: isActive ? 600 : 400,
  });

  return (
    <aside style={{
      width: '200px', flexShrink: 0, background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)', padding: '10px 0',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '8px 18px 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Navigation
      </div>
      {NAV.filter(item => !item.roles || item.roles.includes(session?.role)).map(({ to, icon: Icon, label, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          style={({ isActive }) => navStyle(isActive)}
        >
          <Icon size={15} />
          {label}
        </NavLink>
      ))}

      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '16px 18px 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Tools
      </div>
      <button
        onClick={handleExport}
        style={{
          ...navStyle(false), background: 'transparent', border: '1px solid transparent',
          fontFamily: 'inherit', width: 'calc(100% - 12px)', textAlign: 'left',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <Download size={15} /> Export CSV
      </button>
      <NavLink to="/settings" style={({ isActive }) => navStyle(isActive)}>
        <Settings size={15} /> Settings
      </NavLink>
    </aside>
  );
}
