# Pre-LIS — PCR Sample Registration System

A lightweight, offline-first web application for PCR laboratory sample registration in Zambia. Designed to digitise the point-of-collection workflow and reduce manual re-entry into LIS systems like Diza.

---

## Problem Solved

Clinics and sample collection points send paper-based request forms without barcodes or proper IDs, forcing laboratory staff to manually re-enter all patient and sample information into Diza. This system lets collection points enter data directly — structured at source.

---

## Features

| Feature | Details |
|---|---|
| **Multi-facility login** | Select your collection point at login; data is tagged by facility |
| **Sample registration form** | Matches fields on existing Zambian hospital paper forms |
| **Auto-generated Sample ID** | Format: `FAC-YYMMDD-NNNN` (e.g. `UTH-250618-4823`) |
| **QR code per sample** | Generated offline, no external service required |
| **Offline-first storage** | IndexedDB — works with no internet |
| **Background sync** | Pushes to Supabase when connectivity returns |
| **Search & filter** | By name, ID, NRC, priority, test type |
| **CSV export** | Diza-compatible columns, one click |
| **Dark / Light theme** | Persists across sessions |
| **Dashboard stats** | Today's count, urgent samples, pending sync |

---

## Quick Start

```bash
# 1. Clone / copy files
cd pre-lis

# 2. Install dependencies
npm install

# 3. (Optional) Configure Supabase for cloud sync
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

# 4. Run development server
npm run dev
# → http://localhost:3000

# 5. Build for production
npm run build
```

---

## Supabase Setup (Optional — for cloud sync)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `Settings → Supabase SQL Editor` inside the app, or paste:

```sql
CREATE TABLE IF NOT EXISTS samples (
  id            BIGSERIAL PRIMARY KEY,
  sample_id     TEXT UNIQUE NOT NULL,
  facility      TEXT,
  ward          TEXT,
  patient_name  TEXT NOT NULL,
  nrc           TEXT,
  age           INTEGER,
  age_unit      TEXT DEFAULT 'Years',
  sex           TEXT,
  test_requested TEXT,
  sample_type   TEXT,
  priority      TEXT DEFAULT 'routine',
  collection_date TEXT,
  collection_time TEXT,
  collector     TEXT,
  registered_by TEXT,
  notes         TEXT,
  synced        BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

3. Copy your **Project URL** and **anon key** into `.env.local`
4. Restart the dev server

Without Supabase configured, the app still works — all data saves to IndexedDB in the browser.

---

## Diza LIS Export

The **Export CSV** button produces a file with these columns:

```
Sample ID | Patient Name | NRC/Hospital No | Age | Age Unit | Sex |
Facility | Ward/Clinic | Test Requested | Sample Type | Priority |
Collection Date | Collection Time | Collected By | Registered By |
Clinical Notes | Sync Status | Created At
```

Import this file into Diza using the standard CSV import function.

---

## Offline Operation

The app is designed for Zambia's variable connectivity:

- **Every sample saves immediately to IndexedDB** (browser database, survives page refresh)
- **Online indicator** in the navbar shows current connectivity
- **Offline banner** appears when disconnected
- **Auto-sync** runs when the browser detects a reconnection
- **QR code generation** is entirely client-side — no internet required

To make it installable on clinic tablets (PWA), add a `manifest.json` and a service worker to the `public/` folder.

---

## Project Structure

```
src/
├── api/
│   └── supabaseClient.js   # IndexedDB + Supabase API layer
├── auth/
│   └── ProtectedRoute.jsx  # Route guard
├── components/
│   ├── Navbar.jsx
│   └── Sidebar.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── RegisterSample.jsx  # Main registration form
│   ├── Samples.jsx         # Search, filter, view, delete
│   └── Settings.jsx        # Supabase config + SQL schema
├── App.jsx
├── main.jsx
└── index.css               # Global design system
```

---

## Sample ID Format

`{FAC}-{YYMMDD}-{NNNN}`

- `FAC` = first 3 letters of facility name (e.g. `UTH`, `KIT`, `NDO`)
- `YYMMDD` = collection date
- `NNNN` = 4-digit random sequence

Example: `UTH-250618-4823`

---

## Extending for Production

- **Authentication**: Replace the demo login with Supabase Auth (`supabase.auth.signInWithPassword`)
- **Row Level Security**: Enable RLS policies in Supabase to isolate facility data
- **Barcode printing**: Integrate ZPL (Zebra printer) generation for thermal label printing
- **PWA**: Add `public/manifest.json` + service worker for offline install on tablets
- **Sync conflict resolution**: Add a last-write-wins or server-wins strategy for concurrent edits
- **Role-based access**: Add `role` field to session for read-only vs. data-entry vs. admin

---

*Built for Zambian PCR laboratory workflows. Offline-first. Diza-compatible.*
