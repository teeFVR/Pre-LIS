import React, { useState, useEffect, useCallback } from 'react';
import { Package, Download, CheckCircle2 } from 'lucide-react';
import { api } from '../api/supabaseClient';

export default function Batches({ session }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBatches = useCallback(async () => {
    const data = await api.getBatches();
    setBatches(data);
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleClose = async (batchId) => {
    if (!confirm(`Are you sure you want to close batch ${batchId} early?`)) return;
    setLoading(true);
    try {
      await api.closeBatch(batchId);
      await loadBatches();
    } catch (err) {
      alert('Failed to close batch: ' + err.message);
    }
    setLoading(false);
  };

  const handleExport = async (batchId) => {
    setLoading(true);
    try {
      const csv = await api.exportBatchCSV(batchId);
      if (!csv) {
        alert('No samples in this batch.');
      } else {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wxdisa-${batchId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        await loadBatches();
      }
    } catch (err) {
      alert('Failed to export batch: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Batch Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Laboratory auto-batching · 100 samples per batch
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Status</th>
              <th>Fill Level</th>
              <th>Created At</th>
              <th>Exported At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No batches have been created yet. Receive samples to start building a batch.
                </td>
              </tr>
            ) : (
              batches.map(b => (
                <tr key={b.batch_id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-teal)', fontWeight: 700, fontSize: '12px' }}>
                    {b.batch_id}
                  </td>
                  <td>
                    <span className={`badge ${
                      b.status === 'Building' ? 'badge-pending' : 
                      b.status === 'Exported' ? 'badge-synced' : 'badge-routine'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(b.sample_count / 100) * 100}%`, background: 'var(--accent-teal)' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, width: '45px', textAlign: 'right' }}>
                        {b.sample_count}/100
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {b.exported_at ? new Date(b.exported_at).toLocaleString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {b.status === 'Building' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                          onClick={() => handleClose(b.batch_id)}
                          disabled={loading}
                        >
                          <CheckCircle2 size={12} /> Close Early
                        </button>
                      )}
                      {(b.status === 'Ready' || b.status === 'Exported') && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                          onClick={() => handleExport(b.batch_id)}
                          disabled={loading}
                        >
                          <Download size={12} /> {b.status === 'Exported' ? 'Re-export DIZA' : 'Export DIZA'}
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
