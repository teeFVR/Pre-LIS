import React, { useState, useEffect } from 'react';
import { Database, Download, Save, Check } from 'lucide-react';
import { api } from '../api/supabaseClient';

const SQL_SCHEMA = `-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS samples (
  id           BIGSERIAL PRIMARY KEY,
  sample_id    TEXT UNIQUE NOT NULL,
  facility     TEXT,
  ward         TEXT,
  patient_name TEXT NOT NULL,
  nrc          TEXT,
  age          INTEGER,
  age_unit     TEXT DEFAULT 'Years',
  sex          TEXT,
  test_requested TEXT,
  sample_type  TEXT,
  priority     TEXT DEFAULT 'routine',
  collection_date TEXT,
  collection_time TEXT,
  collector    TEXT,
  registered_by TEXT,
  notes        TEXT,
  synced       BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (recommended for production)
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Facility users can read own samples"
  ON samples FOR SELECT USING (TRUE);
CREATE POLICY "Facility users can insert samples"
  ON samples FOR INSERT WITH CHECK (TRUE);`;

export default function Settings() {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('pre_lis_config') || '{}');
      if (cfg.url) setUrl(cfg.url);
      if (cfg.key) setKey(cfg.key);
    } catch {}
  }, []);

  const saveConfig = () => {
    localStorage.setItem('pre_lis_config', JSON.stringify({ url, key }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const csv = await api.exportCSV();
    if (!csv) { alert('No samples to export.'); return; }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pre-lis-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const card = {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
    borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem',
  };

  const label = { fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Supabase configuration and Diza LIS export
          </p>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '13px' }}>
          <Database size={15} /> Supabase Cloud Sync
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.7' }}>
          Configure Supabase to enable cloud sync and multi-device access. Without this, all data is stored locally in IndexedDB on this device. When online, unsynced samples are automatically pushed to the cloud.
        </p>
        <div className="form-group">
          <label className="form-label">Supabase Project URL</label>
          <input className="form-input" type="url" placeholder="https://your-project.supabase.co"
            value={url} onChange={e => setUrl(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Supabase Anon Key</label>
          <input className="form-input" type="text" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={key} onChange={e => setKey(e.target.value)} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ ...label, marginBottom: '8px' }}>Required Database Schema (Supabase SQL Editor)</div>
          <pre style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
            borderRadius: '8px', padding: '14px', fontSize: '11px',
            color: 'var(--text-secondary)', overflowX: 'auto', lineHeight: '1.7',
          }}>
            {SQL_SCHEMA}
          </pre>
        </div>
        <button className="btn btn-primary" onClick={saveConfig} style={{ gap: '6px' }}>
          {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Configuration</>}
        </button>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '13px' }}>
          <Download size={15} /> Diza LIS Export
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.7' }}>
          The CSV export is structured to match standard LIS import columns. Exported columns:
          <strong style={{ color: 'var(--text-primary)' }}> Sample ID, Patient Name, NRC/Hospital No., Age, Age Unit, Sex, Facility, Ward, Test Requested, Sample Type, Priority, Collection Date, Collection Time, Collected By, Registered By, Clinical Notes, Sync Status, Created At.</strong>
        </p>
        <button className="btn btn-secondary" onClick={handleExport} style={{ gap: '6px' }}>
          <Download size={14} /> Export All Samples to CSV
        </button>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '13px' }}>
          🌐 Offline-First Architecture
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '8px' }}>This system is designed for low-resource clinical environments in Zambia:</p>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>IndexedDB storage</strong> — samples save instantly to browser, even with no internet</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Auto-sync</strong> — when connectivity returns, pending samples push to Supabase automatically</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>QR codes</strong> — generated entirely client-side, no external service required</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>CSV export</strong> — works offline for Diza LIS import at any time</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>PWA ready</strong> — add manifest + service worker to enable Add to Home Screen for clinic tablets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
