import React, { useState, useEffect } from 'react';
import { Database, Download, Save, Check, FlaskConical, Loader2 } from 'lucide-react';
import { api } from '../api/supabaseClient';

const SQL_SCHEMA = `-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS samples (
  id                  BIGSERIAL PRIMARY KEY,
  sample_id           TEXT UNIQUE NOT NULL,
  facility_code       TEXT,
  facility_name       TEXT,
  ward                TEXT,
  clinician           TEXT,
  hmis_scare          TEXT,
  nid                 TEXT,
  surname             TEXT,
  first_name          TEXT,
  patient_name        TEXT,
  art_no              TEXT,
  dob                 TEXT,
  age                 INTEGER,
  age_unit            TEXT DEFAULT 'Years',
  age_cat             TEXT,
  sex                 TEXT,
  pregnant            TEXT,
  breastfeeding       TEXT,
  art_line            TEXT,
  vl_reason           TEXT,
  art_initiation_date TEXT,
  current_regimen     TEXT,
  specimen_code       TEXT,
  specimen_condition  TEXT DEFAULT 'ACC',
  collection_date     TEXT,
  collection_time     TEXT,
  collector           TEXT,
  priority            TEXT DEFAULT 'Routine',
  repeat              TEXT DEFAULT 'No',
  lab_notes           TEXT,
  test_type           TEXT,
  registered_by       TEXT,
  status              TEXT DEFAULT 'Registered',
  received_by         TEXT,
  received_at         TIMESTAMPTZ,
  batch_id            TEXT,
  synced              BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_samples_facility_code ON samples(facility_code);
CREATE INDEX IF NOT EXISTS idx_samples_test_type ON samples(test_type);
CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_samples_sample_id ON samples(sample_id);

ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_insert" ON samples FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_select" ON samples FOR SELECT TO anon USING (true);
CREATE POLICY "allow_update" ON samples FOR UPDATE TO anon USING (true);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  batch_id    TEXT PRIMARY KEY,
  status      TEXT DEFAULT 'Building',
  sample_count INTEGER DEFAULT 0,
  exported_at TIMESTAMPTZ,
  synced      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_batches" ON batches FOR ALL TO anon USING (true) WITH CHECK (true);`;

export default function Settings() {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem('pre_lis_config') || '{}');
      if (cfg.url) setUrl(cfg.url);
      if (cfg.key) setKey(cfg.key);
    } catch {}
  }, []);

  const [supabaseStatus, setSupabaseStatus] = React.useState(api.isSupabaseConfigured() ? 'connected' : 'not-configured');

  const saveConfig = () => {
    localStorage.setItem('pre_lis_config', JSON.stringify({ url, key }));
    const connected = api.reinitSupabase();
    setSupabaseStatus(connected ? 'connected' : 'invalid');
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

  const handleGenerateDemo = async () => {
    if (!confirm('This will create 120 dummy samples. Continue?')) return;
    setGenerating(true);
    try {
      await api.generateDemoData(120, 'Demo Tester', 'Test Clinic');
      alert('120 demo samples created successfully! You can now test batching on the Samples page.');
    } catch (err) {
      alert('Failed to generate demo data: ' + err.message);
    }
    setGenerating(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={saveConfig} style={{ gap: '6px' }}>
            {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Configuration</>}
          </button>
          <span style={{
            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
            background: supabaseStatus === 'connected' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            color: supabaseStatus === 'connected' ? 'var(--accent-emerald)' : 'var(--sync-pending)',
            border: supabaseStatus === 'connected' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.25)',
          }}>
            {supabaseStatus === 'connected' ? '✓ Supabase Connected' : supabaseStatus === 'invalid' ? '✗ Invalid credentials' : '○ Not configured'}
          </span>
        </div>
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

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '13px' }}>
          <FlaskConical size={15} /> Developer Tools
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.7' }}>
          Use this tool to instantly populate the database with dummy samples to test the Laboratory Auto-Batching functionality.
        </p>
        <button 
          className="btn btn-outline" 
          onClick={handleGenerateDemo} 
          disabled={generating}
          style={{ gap: '6px' }}
        >
          {generating ? <Loader2 size={14} className="animate-spin-slow" /> : <Database size={14} />} 
          {generating ? 'Generating 120 Samples...' : 'Generate 120 Demo Samples'}
        </button>
      </div>
    </div>
  );
}
