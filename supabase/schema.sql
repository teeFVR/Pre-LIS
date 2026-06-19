-- Pre-LIS Supabase Schema

-- Enable UUID extension just in case, though we are using string IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
    batch_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'Building',
    sample_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    exported_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create Samples Table
CREATE TABLE IF NOT EXISTS public.samples (
    sample_id TEXT PRIMARY KEY,
    test_type TEXT,
    facility_name TEXT,
    facility_code TEXT,
    ward TEXT,
    clinician TEXT,
    hmis_scare TEXT,
    nid TEXT,
    surname TEXT,
    first_name TEXT,
    art_no TEXT,
    dob TEXT,
    age TEXT,
    age_unit TEXT,
    age_cat TEXT,
    sex TEXT,
    pregnant TEXT,
    breastfeeding TEXT,
    art_line TEXT,
    vl_reason TEXT,
    art_initiation_date TEXT,
    current_regimen TEXT,
    specimen_code TEXT,
    specimen_condition TEXT,
    collection_date TEXT,
    collection_time TEXT,
    collector TEXT,
    priority TEXT,
    repeat TEXT,
    lab_notes TEXT,
    registered_by TEXT,
    status TEXT DEFAULT 'Registered',
    received_by TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    batch_id TEXT REFERENCES public.batches(batch_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS)
-- Enable RLS on both tables
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (Since we are using anonymous access for the SPA without Supabase Auth right now)
-- IMPORTANT: For production, you should integrate Supabase Auth and restrict these policies.

CREATE POLICY "Allow public read access to samples" ON public.samples FOR SELECT USING (true);
CREATE POLICY "Allow public insert to samples" ON public.samples FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to samples" ON public.samples FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of samples" ON public.samples FOR DELETE USING (true);

CREATE POLICY "Allow public read access to batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Allow public insert to batches" ON public.batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to batches" ON public.batches FOR UPDATE USING (true);
CREATE POLICY "Allow public delete of batches" ON public.batches FOR DELETE USING (true);
