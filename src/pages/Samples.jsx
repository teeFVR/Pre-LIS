import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Trash2, Eye } from 'lucide-react';
import { api } from '../api/supabaseClient';

function SampleDetailModal({ sample, onClose, onDelete, onReceive, session }) {
  if (!sample) return null;
  const fields = [
    ['Sample ID', sample.sample_id],
    ['Patient Name', sample.patient_name],
    ['NRC / Hospital No.', sample.nrc || '—'],
    ['Age', `${sample.age} ${sample.age_unit}`],
    ['Sex', sample.sex],
    ['Facility', sample.facility],
    ['Ward / Clinic', sample.ward || '—'],
    ['Test Requested', sample.test_requested],
    ['Sample Type', sample.sample_type],
    ['Priority', sample.priority.toUpperCase()],
    ['Collection Date', sample.collection_date],
    ['Collection Time', sample.collection_time],
    ['Collected By', sample.collector || '—'],
    ['Registered By', sample.registered_by],
    ['Status', sample.status || 'Registered'],
    ...(sample.received_by ? [['Received By', `${sample.received_by} at ${new Date(sample.received_at).toLocaleString()}`]] : []),
    ['Sync Status', sample.synced ? 'Synced to cloud' : 'Local only (pending sync)'],
    ['Clinical Notes', sample.notes || '—'],
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: '4px' }}>Sample Details</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '1.25rem' }}>
          Full registration record
        </p>
        {fields.map(([label, val]) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '8px 0', borderBottom: '1px solid var(--border-color)',
            fontSize: '13px', gap: '1rem',
          }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
            <span style={{
              fontWeight: 500, textAlign: 'right',
              color: label === 'Sample ID' ? 'var(--accent-teal)' : 'var(--text-primary)',
              fontFamily: label === 'Sample ID' ? 'monospace' : 'inherit',
            }}>
              {val}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: 'space-between' }}>
          <div>
            <button className="btn btn-danger" onClick={() => onDelete(sample.sample_id)}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {session?.role === 'Laboratory User' && (!sample.status || sample.status === 'Registered') && (
              <button className="btn btn-primary" onClick={() => onReceive(sample.sample_id)}>
                Receive Sample
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Samples({ session }) {
  const [samples, setSamples] = useState([]);
  const [query, setQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTest, setFilterTest] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setSamples(await api.getSamples());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = samples.filter(s => {
    const q = query.toLowerCase();
    const matchQ = !q || s.sample_id.toLowerCase().includes(q) ||
      s.patient_name.toLowerCase().includes(q) ||
      (s.nrc || '').toLowerCase().includes(q) ||
      (s.facility || '').toLowerCase().includes(q);
    const matchP = !filterPriority || s.priority === filterPriority;
    const matchT = !filterTest || s.test_requested === filterTest;
    return matchQ && matchP && matchT;
  });

  const handleDelete = async (sid) => {
    if (!confirm(`Delete sample ${sid}? This cannot be undone.`)) return;
    await api.deleteSample(sid);
    setSelected(null);
    load();
  };

  const handleReceive = async (sid) => {
    try {
      await api.markSampleReceived(sid, session?.username || 'Laboratory User');
      load();
      // Update selected sample to reflect new status
      setSelected(prev => ({ ...prev, status: 'Received', received_by: session?.username, received_at: new Date().toISOString() }));
    } catch (err) {
      alert('Failed to receive sample: ' + err.message);
    }
  };

  const handleExport = async () => {
    const csv = await api.exportCSV();
    if (!csv) { alert('No samples to export'); return; }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre-lis-samples-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueTests = [...new Set(samples.map(s => s.test_requested))];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2>All Samples</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            {filtered.length} of {samples.length} samples
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleExport} style={{ gap: '6px' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '34px' }}
            placeholder="Search by Sample ID, patient name, NRC..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: '130px' }}
          value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: '180px' }}
          value={filterTest} onChange={e => setFilterTest(e.target.value)}>
          <option value="">All Tests</option>
          {uniqueTests.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sample ID</th>
              <th>Patient</th>
              <th>NRC / Hosp. No.</th>
              <th>Age / Sex</th>
              <th>Test Requested</th>
              <th>Sample Type</th>
              <th>Priority</th>
              <th>Collected</th>
              <th>Status</th>
              <th>Sync</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  {samples.length === 0
                    ? 'No samples registered yet'
                    : 'No samples match the current filters'}
                </td>
              </tr>
            ) : (
              filtered.map(s => (
                <tr key={s.sample_id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '12px' }}>
                    {s.sample_id}
                  </td>
                  <td style={{ fontWeight: 500 }}>{s.patient_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.nrc || '—'}</td>
                  <td>{s.age} {s.age_unit} / {s.sex}</td>
                  <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                    {s.test_requested}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.sample_type}</td>
                  <td>
                    <span className={`badge badge-${s.priority === 'urgent' ? 'urgent' : 'routine'}`}>
                      {s.priority.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {s.collection_date}<br />
                    <span style={{ fontSize: '11px' }}>{s.collection_time}</span>
                  </td>
                  <td>
                    <span className={`badge ${s.status === 'Received' ? 'badge-synced' : 'badge-pending'}`}>
                      {s.status || 'Registered'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.synced ? 'badge-synced' : 'badge-pending'}`}>
                      {s.synced ? 'Synced' : 'Local'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => setSelected(s)}>
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SampleDetailModal
        sample={selected}
        session={session}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        onReceive={handleReceive}
      />
    </div>
  );
}
