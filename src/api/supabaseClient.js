/**
 * Pre-LIS Supabase Client + Offline-First API
 * Falls back to IndexedDB when Supabase is not configured or offline.
 */
import { createClient } from '@supabase/supabase-js';

const DB_NAME = 'PreLIS_DB';
const DB_VERSION = 2;
const STORE_NAME = 'samples';
const BATCH_STORE_NAME = 'batches';
const SESSION_KEY = 'pre_lis_session';
const CONFIG_KEY = 'pre_lis_config';

// ─── Supabase (optional, cloud sync) ────────────────────────────────────────
// Priority: Vite env vars (build-time) → localStorage config (runtime Settings page)
function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (envUrl && envKey) return { url: envUrl, key: envKey };
  try {
    const cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
    if (cfg.url && cfg.key) return cfg;
  } catch {}
  return null;
}

function createSupabaseClient() {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  return createClient(cfg.url, cfg.key);
}

let supabase = createSupabaseClient();

// ─── IndexedDB (always available, primary offline store) ─────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'sample_id' });
        store.createIndex('created_at', 'created_at');
        store.createIndex('facility', 'facility');
        store.createIndex('priority', 'priority');
        store.createIndex('synced', 'synced');
        store.createIndex('batch_id', 'batch_id');
      }
      if (!db.objectStoreNames.contains(BATCH_STORE_NAME)) {
        const batchStore = db.createObjectStore(BATCH_STORE_NAME, { keyPath: 'batch_id' });
        batchStore.createIndex('created_at', 'created_at');
        batchStore.createIndex('status', 'status');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).index('created_at').getAll();
    req.onsuccess = () => resolve([...(req.result || [])].reverse());
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(sample) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(sample);
    tx.oncomplete = () => resolve(sample);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(sample_id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(sample_id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(sample_id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(sample_id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetUnsynced() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const idx = tx.objectStore(STORE_NAME).index('synced');
    const req = idx.getAll(IDBKeyRange.only(false));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ─── Batches DB Helpers ──────────────────────────────────────────────────────
async function idbGetAllBatches() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BATCH_STORE_NAME, 'readonly');
    const req = tx.objectStore(BATCH_STORE_NAME).index('created_at').getAll();
    req.onsuccess = () => resolve([...(req.result || [])].reverse());
    req.onerror = () => reject(req.error);
  });
}

async function idbPutBatch(batch) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BATCH_STORE_NAME, 'readwrite');
    tx.objectStore(BATCH_STORE_NAME).put(batch);
    tx.oncomplete = () => resolve(batch);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetBatch(batch_id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BATCH_STORE_NAME, 'readonly');
    const req = tx.objectStore(BATCH_STORE_NAME).get(batch_id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetSamplesForBatch(batch_id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const idx = tx.objectStore(STORE_NAME).index('batch_id');
    const req = idx.getAll(IDBKeyRange.only(batch_id));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ─── Sample ID Generation ────────────────────────────────────────────────────
export function generateSampleID(facilityCode = 'FAC') {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  const fac = facilityCode.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  return `${fac}-${yy}${mm}${dd}-${seq}`;
}

export function generateBatchID() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `BATCH-${yy}${mm}${dd}-${seq}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────
export const api = {
  /** Reinitialise Supabase client after credentials saved in Settings */
  reinitSupabase() {
    supabase = createSupabaseClient();
    return !!supabase;
  },

  isSupabaseConfigured() {
    return !!supabase;
  },

  /** Fake session management (replace with Supabase Auth for production) */
  login({ facility, role, username }) {
    const session = { facility, role, username, loggedInAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },

  /** Register a new sample — always writes to IndexedDB first */
  async registerSample(data) {
    const sample = {
      ...data,
      status: 'Registered',
      synced: false,
      created_at: new Date().toISOString(),
    };

    // Save locally first (offline-first)
    await idbPut(sample);

    // Try to sync to Supabase if available and online
    if (supabase && navigator.onLine) {
      try {
        const { error } = await supabase.from('samples').insert([sample]);
        if (!error) {
          await idbPut({ ...sample, synced: true });
        }
      } catch (err) {
        console.warn('Supabase sync failed, will retry later:', err.message);
      }
    }

    return sample;
  },

  /** Fetch all samples from local IndexedDB */
  async getSamples() {
    return idbGetAll();
  },

  /** Delete a sample from local store (and Supabase if configured) */
  async deleteSample(sample_id) {
    await idbDelete(sample_id);
    if (supabase && navigator.onLine) {
      try {
        await supabase.from('samples').delete().eq('sample_id', sample_id);
      } catch {
        // Silently fail — already deleted locally
      }
    }
  },

  /** Mark sample as Received by Laboratory User and Auto-Batch */
  async markSampleReceived(sample_id, user) {
    const sample = await idbGet(sample_id);
    if (!sample) throw new Error('Sample not found');
    if (sample.status === 'Received') throw new Error('Sample already received');

    // 1. Find or create an active batch
    const batches = await idbGetAllBatches();
    let activeBatch = batches.find(b => b.status === 'Building');
    
    if (!activeBatch) {
      activeBatch = {
        batch_id: generateBatchID(),
        status: 'Building',
        sample_count: 0,
        created_at: new Date().toISOString(),
        synced: false
      };
      await idbPutBatch(activeBatch);
    }

    // 2. Assign sample to batch
    sample.status = 'Received';
    sample.received_by = user;
    sample.received_at = new Date().toISOString();
    sample.batch_id = activeBatch.batch_id;
    sample.synced = false; 
    
    await idbPut(sample);

    // 3. Update batch count
    activeBatch.sample_count += 1;
    if (activeBatch.sample_count >= 100) {
      activeBatch.status = 'Ready';
    }
    await idbPutBatch(activeBatch);
    
    // Cloud sync (optimistic)
    if (supabase && navigator.onLine) {
      try {
        await supabase.from('samples').update({
          status: sample.status,
          received_by: sample.received_by,
          received_at: sample.received_at,
          batch_id: sample.batch_id
        }).eq('sample_id', sample_id);
        
        // Sync batch to cloud
        await supabase.from('batches').upsert([{
          batch_id: activeBatch.batch_id,
          status: activeBatch.status,
          sample_count: activeBatch.sample_count,
          created_at: activeBatch.created_at
        }]);
        
        await idbPut({ ...sample, synced: true });
      } catch (err) {
        console.warn('Supabase sync failed for markReceived:', err.message);
      }
    }
    return sample;
  },

  /** Get all batches */
  async getBatches() {
    return idbGetAllBatches();
  },

  /** Close a building batch early */
  async closeBatch(batch_id) {
    const batch = await idbGetBatch(batch_id);
    if (!batch) throw new Error('Batch not found');
    if (batch.status === 'Building') {
      batch.status = 'Ready';
      await idbPutBatch(batch);
      
      if (supabase && navigator.onLine) {
        try {
          await supabase.from('batches').update({ status: 'Ready' }).eq('batch_id', batch_id);
        } catch (err) {
          console.warn('Supabase sync failed for closeBatch:', err.message);
        }
      }
    }
    return batch;
  },

  /** Sync all unsynced local samples to Supabase when back online */
  async syncPending() {
    if (!supabase || !navigator.onLine) return { synced: 0, failed: 0 };
    const pending = await idbGetUnsynced();
    let synced = 0;
    let failed = 0;
    for (const sample of pending) {
      try {
        const { error } = await supabase
          .from('samples')
          .upsert([sample], { onConflict: 'sample_id' });
        if (!error) {
          await idbPut({ ...sample, synced: true });
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    return { synced, failed };
  },

  /** Generate demo data for testing batching */
  async generateDemoData(count = 120, user = 'Demo Clinic User', facility = 'Test Clinic') {
    const promises = [];
    for (let i = 0; i < count; i++) {
      const sample = {
        sample_id: generateSampleID('TST'),
        test_type: i % 2 === 0 ? 'Viral Load' : 'EID',
        facility_name: facility,
        facility_code: 'TST',
        ward: 'OPD',
        clinician: 'Dr. Demo',
        hmis_scare: '12345',
        nid: `123456/78/${i}`,
        surname: 'Doe',
        first_name: `Patient${i}`,
        art_no: `ART-${Math.floor(1000 + Math.random() * 9000)}`,
        dob: '1990-01-01',
        age: '36',
        age_unit: 'Years',
        age_cat: 'Adult',
        sex: i % 2 === 0 ? 'M' : 'F',
        pregnant: 'No',
        breastfeeding: 'No',
        art_line: '1st Line',
        vl_reason: 'Routine',
        art_initiation_date: '2020-01-01',
        current_regimen: 'TDF/3TC/DTG',
        specimen_code: 'EDTA',
        specimen_condition: 'Good',
        collection_date: new Date().toISOString().split('T')[0],
        collection_time: '08:00',
        collector: user,
        priority: i % 10 === 0 ? 'Urgent' : 'Routine',
        repeat: 'No',
        lab_notes: 'Demo data',
        registered_by: user,
        status: 'Registered',
        created_at: new Date().toISOString(),
        synced: false
      };
      
      promises.push(idbPut(sample));
      
      // Also optimistic cloud sync if online
      if (supabase && navigator.onLine) {
         // Fire and forget
         supabase.from('samples').upsert([sample]).then(({ error }) => {
           if (!error) idbPut({ ...sample, synced: true });
         });
      }
    }
    await Promise.all(promises);
    return count;
  },

  /** Export specific batch to WXDISA-compatible CSV */
  async exportBatchCSV(batch_id) {
    const samples = await idbGetSamplesForBatch(batch_id);
    if (!samples.length) return null;

    const csvData = this._generateCSV(samples);
    
    // Update batch status to Exported
    const batch = await idbGetBatch(batch_id);
    if (batch) {
      batch.status = 'Exported';
      batch.exported_at = new Date().toISOString();
      await idbPutBatch(batch);
      
      if (supabase && navigator.onLine) {
        try {
          await supabase.from('batches').update({ 
            status: 'Exported', 
            exported_at: batch.exported_at 
          }).eq('batch_id', batch_id);
        } catch (err) {
          console.warn('Supabase sync failed for exportBatchCSV:', err.message);
        }
      }
    }
    return csvData;
  },

  /** Export all samples to WXDISA-compatible CSV */
  async exportCSV() {
    const samples = await idbGetAll();
    if (!samples.length) return null;
    return this._generateCSV(samples);
  },

  _generateCSV(samples) {
    // WXDISA Batch Registration CSV column order
    const headers = [
      'BarCode',          // sample_id — our reference ID
      'TestType',         // test_type — VL or EID (determines WXDISA tab)
      'FacilityCode',     // facility_code — e.g. CBT12
      'Facility',         // facility_name
      'Ward',             // ward
      'Clinician',        // clinician
      'HMIS_SCare',       // hmis_scare
      'NID',              // nid (NRC)
      'Surname',          // surname
      'FirstName',        // first_name
      'ARTNo',            // art_no — critical for VL/EID
      'DOB',              // dob (DD/MM/YYYY)
      'Age',              // age
      'AgeUnit',          // age_unit
      'AgeCat',           // age_cat (Adult/Child/Infant)
      'Sex',              // sex
      'Pregnant',         // pregnant
      'Breastfeeding',    // breastfeeding
      'ARTLine',          // art_line
      'VLReason',         // vl_reason
      'ARTInitiation',    // art_initiation_date
      'CurrentRegimen',   // current_regimen
      'Specimen',         // specimen_code — e.g. B, DBS, P
      'Condition',        // specimen_condition — e.g. ACC
      'CollectionDate',   // collection_date
      'CollectionTime',   // collection_time
      'CollectedBy',      // collector
      'Priority',         // priority — Routine/Urgent
      'Repeat',           // repeat
      'LabNotes',         // lab_notes
      'RegisteredBy',     // registered_by
      'SyncStatus',       // synced
      'CreatedAt',        // created_at
    ];

    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    // Format DOB as DD/MM/YYYY (WXDISA format)
    const formatDate = (iso) => {
      if (!iso) return '';
      const parts = iso.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return iso;
    };

    const rows = samples.map(s => [
      s.sample_id,
      s.test_type || '',
      s.facility_code || '',
      s.facility_name || s.facility || '',
      s.ward || '',
      s.clinician || '',
      s.hmis_scare || '',
      s.nid || s.nrc || '',
      s.surname || (s.patient_name ? s.patient_name.split(',')[0].trim() : ''),
      s.first_name || (s.patient_name ? s.patient_name.split(',')[1]?.trim() : ''),
      s.art_no || '',
      s.dob ? formatDate(s.dob) : '',
      s.age || '',
      s.age_unit || 'Years',
      s.age_cat || '',
      s.sex || '',
      s.pregnant || '',
      s.breastfeeding || '',
      s.art_line || '',
      s.vl_reason || '',
      s.art_initiation_date ? formatDate(s.art_initiation_date) : '',
      s.current_regimen || '',
      s.specimen_code || s.sample_type || '',
      s.specimen_condition || 'ACC',
      s.collection_date ? formatDate(s.collection_date) : '',
      s.collection_time || '',
      s.collector || '',
      s.priority || 'Routine',
      s.repeat || 'No',
      s.lab_notes || s.notes || '',
      s.registered_by || '',
      s.synced ? 'Synced' : 'Pending',
      s.created_at || '',
    ].map(escape).join(','));

    return [headers.join(','), ...rows].join('\n');
  },

  /** Get dashboard stats */
  async getStats() {
    const all = await idbGetAll();
    const today = new Date().toISOString().split('T')[0];
    return {
      total: all.length,
      today: all.filter(s => s.collection_date === today).length,
      urgent: all.filter(s => s.priority?.toLowerCase() === 'urgent').length,
      pending: all.filter(s => !s.synced).length,
    };
  },
};

export default api;
