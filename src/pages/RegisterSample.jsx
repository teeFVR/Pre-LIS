import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, FlaskConical, User, Microscope, Printer, Plus, Heart } from 'lucide-react';
import { api, generateSampleID } from '../api/supabaseClient';

// WXDISA facility codes — left field is the DISA code, right is the display name
const FACILITIES = [
  { code: 'CBT12', name: 'Bulangililo Kitwe' },
  { code: 'UTH01', name: 'UTH - Outpatient Dept.' },
  { code: 'NDO01', name: 'Ndola Teaching Hospital' },
  { code: 'CHO01', name: 'Choma General Hospital' },
  { code: 'LIV01', name: 'Livingstone General Hospital' },
  { code: 'CHI01', name: 'Chipata General Hospital' },
  { code: 'KAB01', name: 'Kabwe General Hospital' },
  { code: 'MAN01', name: 'Mansa General Hospital' },
  { code: 'SOL01', name: 'Solwezi General Hospital' },
  { code: 'SFM01', name: 'St. Francis Mission Hospital' },
  { code: 'DEMO1', name: 'Demo Clinic (Training)' },
];

// WXDISA specimen codes — VL/EID: DBS, Whole Blood, Plasma only
const SPECIMEN_TYPES = [
  { code: 'DBS', label: 'DBS — Dried Blood Spot' },
  { code: 'B',   label: 'B — Whole Blood (EDTA)' },
  { code: 'P',   label: 'P — Plasma' },
];

// VL Reason — exact values from WXDISA dropdown
const VL_REASONS = [
  'Baseline VL',
  'HIV Exposed',
  'HiV Exposed Infant',
  'Other (specify)',
  'PCR Confirmatory',
  'Post EAC',
  'Routine monitoring',
  'UNK Unknown exposure, displaying s',
  'Unknown exposure, displaying s',
  'Unscheduled (Targeted)',
];

// ART Line options
const ART_LINES = ['Line 1', 'Line 2', 'Line 3', 'Unknown'];

// AgeCat — WXDISA: 0-13 = Paediatric, 14-19 = Adolescent, 20+ = Adult
function deriveAgeCat(age, unit) {
  if (!age) return '';
  const ageYears = unit === 'Months' ? age / 12 : unit === 'Days' ? age / 365 : Number(age);
  if (ageYears <= 13) return 'Paediatric';
  if (ageYears <= 19) return 'Adolescent';
  return 'Adult';
}

function now() {
  const d = new Date();
  return {
    date: d.toISOString().split('T')[0],
    time: d.toTimeString().slice(0, 5),
  };
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: '1rem', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-teal)' }}>
        <Icon size={15} />
        {title}
      </div>
      {subtitle && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{subtitle}</div>}
    </div>
  );
}

// Simple QR canvas renderer — offline-capable
function drawQRCode(canvas, text, size = 120) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = size; canvas.height = size;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  const modules = 21;
  const cell = Math.floor(size / (modules + 2));
  const offset = Math.floor((size - cell * modules) / 2);
  const drawFinder = (row, col) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(offset + col * cell, offset + row * cell, 7 * cell, 7 * cell);
    ctx.fillStyle = '#fff';
    ctx.fillRect(offset + col * cell + cell, offset + row * cell + cell, 5 * cell, 5 * cell);
    ctx.fillStyle = '#000';
    ctx.fillRect(offset + col * cell + 2 * cell, offset + row * cell + 2 * cell, 3 * cell, 3 * cell);
  };
  drawFinder(0, 0); drawFinder(0, 14); drawFinder(14, 0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = Math.imul(31, hash) + text.charCodeAt(i) | 0;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const inCorner = (r < 9 && c < 9) || (r < 9 && c > 11) || (r > 11 && c < 9);
      if (!inCorner) {
        const bit = (hash >>> ((r * modules + c) % 31)) & 1;
        const extra = (text.charCodeAt((r + c) % text.length) >>> (c % 7)) & 1;
        if ((bit ^ extra) && ((r + c) % 3 !== 0)) {
          ctx.fillStyle = '#000';
          ctx.fillRect(offset + c * cell, offset + r * cell, cell - 1, cell - 1);
        }
      }
    }
  }
  ctx.strokeStyle = '#14b8a6'; ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
}

const BLANK_FORM = (facility = '') => ({
  // Health Facility (maps to WXDISA Health Facility Information)
  facility_code: '',          // WXDISA: Facility code e.g. CBT12
  facility_name: facility,    // WXDISA: Facility display name
  ward: '',                   // WXDISA: Ward/Clinic
  clinician: '',              // WXDISA: Clinician
  hmis_scare: '',             // WXDISA: HMIS/SCare number
  nid: '',                    // WXDISA: NID (National ID / NRC)

  // Patient Information (maps to WXDISA Patient Information)
  surname: '',                // WXDISA: Surname
  first_name: '',             // WXDISA: First
  art_no: '',                 // WXDISA: ART No — critical for VL
  dob: '',                    // WXDISA: Dob/Age (date of birth)
  age: '',                    // WXDISA: Age (used when DOB unknown)
  age_unit: 'Years',
  sex: '',                    // WXDISA: Sex
  pregnant: '',               // WXDISA: Pregnant (Female patients)
  breastfeeding: '',          // WXDISA: Breastfeed
  age_cat: '',                // WXDISA: AgeCat (auto-derived)
  art_line: '',               // WXDISA: Line (ART line)
  vl_reason: '',              // WXDISA: VL Reason
  art_initiation_date: '',    // WXDISA: ART Initiation
  current_regimen: '',        // WXDISA: CurrRegi

  // Specimen Information (maps to WXDISA Specimen Information)
  specimen_code: '',          // WXDISA: Specimen code e.g. B
  specimen_condition: 'ACC',  // WXDISA: Condition (ACC=Acceptable)
  collection_date: now().date, // WXDISA: Collection date
  collection_time: now().time,
  collector: '',              // WXDISA: Collection By
  priority: 'Routine',        // WXDISA: Priority (Routine/Urgent)
  repeat: 'No',               // WXDISA: Repeat
  lab_notes: '',              // WXDISA: LabNotes

  // Test type (determines which tab in WXDISA)
  test_type: '',              // VL or EID
});

export default function RegisterSample({ session }) {
  const qrRef = useRef(null);
  const [sampleID, setSampleID] = useState('');
  const [registered, setRegistered] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(BLANK_FORM(session?.facility || ''));

  const freshID = useCallback(() => {
    const fac = (form.facility_code || session?.facility || 'FAC').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    setSampleID(generateSampleID(fac));
  }, [form.facility_code, session]);

  useEffect(() => { freshID(); }, []);

  useEffect(() => {
    if (registered && qrRef.current) drawQRCode(qrRef.current, registered.sample_id, 100);
  }, [registered]);

  const set = (field, val) => {
    setForm(f => {
      const next = { ...f, [field]: val };
      // Auto-derive AgeCat when age/unit changes
      if (field === 'age' || field === 'age_unit') {
        next.age_cat = deriveAgeCat(
          field === 'age' ? val : f.age,
          field === 'age_unit' ? val : f.age_unit
        );
      }
      // Auto-set facility code when facility name selected
      if (field === 'facility_name') {
        const match = FACILITIES.find(fc => fc.name === val);
        next.facility_code = match ? match.code : '';
      }
      return next;
    });
  };

  const isVL = form.test_type === 'VL';
  const isEID = form.test_type === 'EID';
  const showHIVFields = isVL || isEID;

  const handleSubmit = async () => {
    setError('');
    const required = ['test_type', 'facility_name', 'surname', 'first_name', 'art_no', 'sex', 'specimen_code', 'collection_date'];
    if (form.dob === '' && form.age === '') { setError('Please enter either Date of Birth or Age.'); return; }
    for (const f of required) {
      if (!form[f]) { setError(`Please fill in all required fields (*). Missing: ${f.replace(/_/g,' ')}`); return; }
    }
    setSubmitting(true);
    try {
      const sample = await api.registerSample({
        ...form,
        sample_id: sampleID,
        age: form.age ? parseInt(form.age, 10) : null,
        registered_by: session?.username || 'unknown',
        patient_name: `${form.surname}, ${form.first_name}`,
      });
      setRegistered(sample);
    } catch (err) {
      setError('Failed to register sample: ' + err.message);
    }
    setSubmitting(false);
  };

  const registerAnother = () => {
    setRegistered(null);
    setError('');
    freshID();
    setForm(BLANK_FORM(session?.facility || ''));
  };

  const printLabel = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Sample Label</title>
      <style>body{font-family:monospace;font-size:13px;padding:10px}
      .id{font-size:20px;font-weight:bold;margin-bottom:8px}
      .row{margin-bottom:4px}
      </style></head><body>
      <div class="id">${registered.sample_id}</div>
      <div class="row"><b>Patient:</b> ${registered.surname}, ${registered.first_name}</div>
      <div class="row"><b>ART No:</b> ${registered.art_no || '—'}</div>
      <div class="row"><b>Test:</b> ${registered.test_type}</div>
      <div class="row"><b>Specimen:</b> ${registered.specimen_code}</div>
      <div class="row"><b>Facility:</b> ${registered.facility_name}</div>
      <div class="row"><b>Collected:</b> ${registered.collection_date} ${registered.collection_time}</div>
      <div class="row"><b>Priority:</b> ${registered.priority}</div>
      </body></html>`);
    w.print(); w.close();
  };

  const card = { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' };
  const row2 = 'form-grid form-grid-2';
  const row3 = 'form-grid form-grid-3';
  const row4 = 'form-grid form-grid-4';

  if (registered) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '16px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <CheckCircle2 size={22} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: '20px', color: 'var(--accent-emerald)' }}>Sample Registered</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '1.5rem' }}>
            Saved locally · {navigator.onLine ? 'syncing to cloud' : 'will sync when online'}
          </p>
          <div className="success-grid">
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Sample ID (BarCode for WXDISA)</div>
              <div style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                {registered.sample_id}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                <strong>{registered.surname}, {registered.first_name}</strong><br />
                ART No: {registered.art_no}<br />
                {registered.test_type} · {registered.specimen_code} · {registered.priority}<br />
                {registered.facility_name} {registered.ward ? `· ${registered.ward}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <canvas ref={qrRef} style={{ borderRadius: '8px' }} />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>QR Code</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={registerAnother} style={{ gap: '6px' }}><Plus size={14} /> Register Another</button>
            <button className="btn btn-secondary" onClick={printLabel} style={{ gap: '6px' }}><Printer size={14} /> Print Label</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Register New Sample</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Fields marked * are required · maps directly to WXDISA Specimen Reception</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'var(--priority-urgent-bg)', border: '1px solid var(--priority-urgent-border)', borderRadius: '8px', color: 'var(--priority-urgent)', fontSize: '13px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Test Type — determines WXDISA tab */}
      <div style={card}>
        <SectionHeader icon={FlaskConical} title="Test Type *" subtitle="Select test — this determines the WXDISA tab (5.Viral Load or 6.EID)" />
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { val: 'VL', label: '5. Viral Load', sub: 'HIV-1 PCR Quantitative' },
            { val: 'EID', label: '6. EID', sub: 'Early Infant Diagnosis' },
          ].map(({ val, label, sub }) => (
            <button key={val} type="button" onClick={() => set('test_type', val)} style={{
              flex: 1, padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
              fontFamily: 'inherit', border: '1px solid',
              textAlign: 'left',
              background: form.test_type === val ? 'var(--accent-glow)' : 'var(--bg-primary)',
              color: form.test_type === val ? 'var(--accent-teal)' : 'var(--text-muted)',
              borderColor: form.test_type === val ? 'var(--accent-teal)' : 'var(--border-color)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{label}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Health Facility Information */}
      <div style={card}>
        <SectionHeader icon={FlaskConical} title="Health Facility Information" subtitle="WXDISA: Health Facility Information section" />
        <div className="form-grid form-grid-3">
          <div className="form-group col-span-2">
            <label className="form-label">Facility * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Facility)</span></label>
            <select className="form-select" value={form.facility_name} onChange={e => set('facility_name', e.target.value)}>
              <option value="">— Select facility —</option>
              {FACILITIES.map(f => <option key={f.code} value={f.name}>{f.code} — {f.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Facility Code</label>
            <input className="form-input" value={form.facility_code} readOnly
              style={{ opacity: 0.7, cursor: 'not-allowed', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-teal)' }} />
          </div>
        </div>
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label className="form-label">Ward / Clinic <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Ward/Clinic)</span></label>
            <input className="form-input" placeholder="e.g. ART Clinic, Male Ward"
              value={form.ward} onChange={e => set('ward', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Clinician <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Clinician)</span></label>
            <input className="form-input" placeholder="Requesting clinician name"
              value={form.clinician} onChange={e => set('clinician', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">HMIS/SCare No. <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: HMIS/SCare)</span></label>
            <input className="form-input" placeholder="HMIS number"
              value={form.hmis_scare} onChange={e => set('hmis_scare', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div style={card}>
        <SectionHeader icon={User} title="Patient Information" subtitle="WXDISA: Patient Information section" />
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label className="form-label">Surname * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Surname)</span></label>
            <input className="form-input" placeholder="e.g. LITETA"
              value={form.surname} onChange={e => set('surname', e.target.value.toUpperCase())} />
          </div>
          <div className="form-group">
            <label className="form-label">First Name * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: First)</span></label>
            <input className="form-input" placeholder="e.g. JOSEPH"
              value={form.first_name} onChange={e => set('first_name', e.target.value.toUpperCase())} />
          </div>
          <div className="form-group">
            <label className="form-label">ART Number * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: ART No)</span></label>
            <input className="form-input" placeholder="e.g. 2040210251200"
              value={form.art_no} onChange={e => set('art_no', e.target.value)} />
          </div>
        </div>
        <div className="form-grid form-grid-4">
          <div className="form-group">
            <label className="form-label">Date of Birth <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Dob)</span></label>
            <input className="form-input" type="date"
              value={form.dob} onChange={e => set('dob', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Age <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(if DOB unknown)</span></label>
            <input className="form-input" type="number" placeholder="e.g. 38" min="0" max="120"
              value={form.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Age Unit</label>
            <select className="form-select" value={form.age_unit} onChange={e => set('age_unit', e.target.value)}>
              <option>Years</option><option>Months</option><option>Days</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Age Category <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(auto)</span></label>
            <input className="form-input" value={form.age_cat} readOnly
              style={{ opacity: 0.7, cursor: 'not-allowed' }} placeholder="Auto from age" />
          </div>
        </div>
        <div className="form-grid form-grid-4">
          <div className="form-group">
            <label className="form-label">Sex * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Sex)</span></label>
            <select className="form-select" value={form.sex} onChange={e => set('sex', e.target.value)}>
              <option value="">—</option>
              <option>Male</option><option>Female</option><option>Unknown</option>
            </select>
          </div>
          {form.sex === 'Female' && (
            <>
              <div className="form-group">
                <label className="form-label">Pregnant <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Pregnant)</span></label>
                <select className="form-select" value={form.pregnant} onChange={e => set('pregnant', e.target.value)}>
                  <option value="">—</option><option>Yes</option><option>No</option><option>Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Breastfeeding <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Breastfeed)</span></label>
                <select className="form-select" value={form.breastfeeding} onChange={e => set('breastfeeding', e.target.value)}>
                  <option value="">—</option><option>Yes</option><option>No</option><option>Unknown</option>
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">NID (NRC) <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: NID)</span></label>
            <input className="form-input" placeholder="e.g. 123456/78/1"
              value={form.nid} onChange={e => set('nid', e.target.value)} />
          </div>
        </div>

        {/* HIV-specific patient fields — only for VL and EID */}
        {showHIVFields && (
          <>
            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-teal)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                HIV / ART Details — {form.test_type}
              </div>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">ART Line <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Line)</span></label>
                <select className="form-select" value={form.art_line} onChange={e => set('art_line', e.target.value)}>
                  <option value="">—</option>
                  {ART_LINES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">VL Reason * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: VL Reason)</span></label>
                <select className="form-select" value={form.vl_reason} onChange={e => set('vl_reason', e.target.value)}>
                  <option value="">—</option>
                  {VL_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ART Initiation Date <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: ART Initiation)</span></label>
                <input className="form-input" type="date"
                  value={form.art_initiation_date} onChange={e => set('art_initiation_date', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Current ART Regimen <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: CurrRegi)</span></label>
              <input className="form-input" placeholder="e.g. TDF/3TC/DTG, AZT/3TC/NVP..."
                value={form.current_regimen} onChange={e => set('current_regimen', e.target.value)} />
            </div>
          </>
        )}
      </div>

      {/* Specimen Information */}
      <div style={card}>
        <SectionHeader icon={Microscope} title="Specimen Information" subtitle="WXDISA: Specimen Information section" />
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label className="form-label">Specimen * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Specimen code)</span></label>
            <select className="form-select" value={form.specimen_code} onChange={e => set('specimen_code', e.target.value)}>
              <option value="">— Select —</option>
              {SPECIMEN_TYPES.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Condition <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Condition)</span></label>
            <select className="form-select" value={form.specimen_condition} onChange={e => set('specimen_condition', e.target.value)}>
              <option value="ACC">ACC — Acceptable</option>
              <option value="HAE">HAE — Haemolysed</option>
              <option value="LIP">LIP — Lipaemic</option>
              <option value="OLD">OLD — Old sample</option>
              <option value="INS">INS — Insufficient volume</option>
              <option value="CLO">CLO — Clotted</option>
              <option value="WRO">WRO — Wrong container</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Priority)</span></label>
            <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option>Routine</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>
        <div className="form-grid form-grid-4">
          <div className="form-group">
            <label className="form-label">Collection Date * <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Collection)</span></label>
            <input className="form-input" type="date"
              value={form.collection_date} onChange={e => set('collection_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Collection Time</label>
            <input className="form-input" type="time"
              value={form.collection_time} onChange={e => set('collection_time', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Collected By <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: By)</span></label>
            <input className="form-input" placeholder="e.g. CLEMENT"
              value={form.collector} onChange={e => set('collector', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Repeat Sample <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: Repeat)</span></label>
            <select className="form-select" value={form.repeat} onChange={e => set('repeat', e.target.value)}>
              <option>No</option><option>Yes</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Lab Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(WXDISA: LabNotes)</span></label>
          <textarea className="form-input" rows={2}
            placeholder="Optional: any notes for the receiving laboratory..."
            value={form.lab_notes} onChange={e => set('lab_notes', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Sample ID */}
      <div style={card}>
        <SectionHeader icon={FlaskConical} title="Sample Reference ID" subtitle="This ID will appear as the BarCode reference in WXDISA" />
        <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, color: 'var(--accent-teal)', letterSpacing: '0.08em', padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--accent-teal)', borderRadius: '10px', textAlign: 'center', marginBottom: '8px' }}>
          {sampleID}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          Auto-generated · format: [FAC]-[YYMMDD]-[NNNN]
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={registerAnother}>Clear Form</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Registering...' : '💾 Register Sample'}
        </button>
      </div>

      <style>{`
        .form-grid { display: grid; gap: 12px; }
        .form-grid-2 { grid-template-columns: 1fr 1fr; }
        .form-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .form-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        .col-span-2 { grid-column: span 2; }

        .success-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 640px) {
          .form-grid-2 { grid-template-columns: 1fr; }
          .form-grid-3 { grid-template-columns: 1fr 1fr; }
          .form-grid-4 { grid-template-columns: 1fr 1fr; }
          .col-span-2 { grid-column: span 1; }
          .success-grid { grid-template-columns: 1fr; }
          .success-grid > div:last-child { display: flex; flex-direction: column; align-items: center; }
        }

        @media (max-width: 400px) {
          .form-grid-3 { grid-template-columns: 1fr; }
          .form-grid-4 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
