import React, { useRef } from 'react';
import Barcode from './Barcode';
import { formatClinicalDate } from '../utils/formatDate';
import { Printer, Calendar, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';

export default function SampleCard({ sample, onDelete }) {
  const cardRef = useRef();

  const handlePrint = (e) => {
    e.stopPropagation();
    
    // Create an iframe to print only the barcode label
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) {
      alert("Please allow popups to print labels.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Print Label - ${sample.sampleId}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 10px;
              margin: 0;
              width: 80mm;
              height: 50mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: #fff;
              color: #000;
            }
            .label-header {
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              font-weight: bold;
              border-bottom: 1px dashed #000;
              padding-bottom: 2px;
            }
            .priority-tag {
              border: 1px solid #000;
              padding: 0 4px;
            }
            .barcode-section {
              text-align: center;
              margin: 5px 0;
            }
            .patient-details {
              font-size: 8px;
              line-height: 1.2;
            }
            .footer-info {
              display: flex;
              justify-content: space-between;
              font-size: 7px;
              border-top: 1px dashed #000;
              padding-top: 2px;
            }
          </style>
        </head>
        <body>
          <div class="label-header">
            <span>ZAMBIA PRE-LIS REQUEST</span>
            <span class="priority-tag">${sample.priority.toUpperCase()}</span>
          </div>
          <div class="barcode-section">
            ${cardRef.current.querySelector('.barcode-wrapper').outerHTML}
          </div>
          <div class="patient-details">
            <strong>NAME:</strong> ${sample.patientName.toUpperCase()}<br/>
            <strong>NRC/HOSP:</strong> ${sample.nrcHospital}<br/>
            <strong>AGE/SEX:</strong> ${sample.ageValue} ${sample.ageUnit} / ${sample.sex}<br/>
            <strong>TEST:</strong> ${sample.testRequested} (${sample.sampleType})
          </div>
          <div class="footer-info">
            <span>FAC: ${sample.facilityName.substring(0, 20)}</span>
            <span>COLL: ${formatClinicalDate(sample.collectionDate).split(' ')[0]}</span>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div 
      className="glass-card" 
      ref={cardRef}
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Priority Ribbon indicator */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60px',
        height: '60px',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          backgroundColor: sample.priority === 'Urgent' ? 'var(--priority-urgent)' : 'var(--priority-routine)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.6rem',
          textAlign: 'center',
          lineHeight: '20px',
          transform: 'rotate(45deg)',
          position: 'absolute',
          top: '12px',
          right: '-16px',
          width: '74px',
          textTransform: 'uppercase'
        }}>
          {sample.priority}
        </div>
      </div>

      <div>
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', paddingRight: '40px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {sample.wardClinic || 'General Ward'}
            </span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
              {sample.patientName}
            </h3>
          </div>
        </div>

        {/* Patient Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem 1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>NRC/Hosp:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sample.nrcHospital}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Age/Sex:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sample.ageValue} {sample.ageUnit} / {sample.sex}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>PCR Test:</span>
            <div style={{ fontWeight: 600, color: 'var(--accent-teal)' }}>{sample.testRequested}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Sample Type:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sample.sampleType}</div>
          </div>
        </div>

        {/* Barcode Render Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          border: '1px solid var(--border-color)'
        }}>
          {/* We force scale to 1.1 inside the card */}
          <Barcode value={sample.sampleId} height={35} scale={1.1} />
        </div>
      </div>

      {/* Card Footer with actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.75rem'
      }} className="card-footer-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {sample.syncStatus === 'synced' ? (
            <span className="badge badge-synced">
              <CheckCircle size={10} /> Synced
            </span>
          ) : (
            <span className="badge badge-pending">
              <Calendar size={10} /> Local Queue
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(sample.id); }}
              className="btn btn-secondary"
              style={{ padding: '0.375rem', borderRadius: 'var(--radius-sm)', color: 'var(--priority-urgent)' }}
              title="Delete Sample Entry"
            >
              <Trash2 size={12} />
            </button>
          )}
          <button 
            onClick={handlePrint}
            className="btn btn-outline"
            style={{ 
              padding: '0.375rem 0.625rem', 
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              gap: '0.25rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Printer size={12} /> Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
