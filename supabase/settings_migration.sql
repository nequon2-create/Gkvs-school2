-- ============================================================================
-- SCHOOL SETTINGS & NOTIFICATIONS MIGRATION
-- ============================================================================

-- 1. ADD NOTIFICATION PREFERENCES TO USERS TABLE
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS absence_alerts BOOLEAN DEFAULT true;

-- 2. CREATE SCHOOL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My School',
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if running multiple times (to prevent errors)
DROP POLICY IF EXISTS "Allow read access for all authenticated users" ON public.school_settings;
DROP POLICY IF EXISTS "Allow update access for admins" ON public.school_settings;
DROP POLICY IF EXISTS "Allow insert access for admins" ON public.school_settings;

-- Create Policies
CREATE POLICY "Allow read access for all authenticated users" ON public.school_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow update access for admins" ON public.school_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow insert access for admins" ON public.school_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Insert a default settings row if table is empty
INSERT INTO public.school_settings (name)
SELECT 'My School'
WHERE NOT EXISTS (SELECT 1 FROM public.school_settings);

-- 3. CREATE STORAGE BUCKET FOR SCHOOL LOGOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;

-- Create Storage Policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'school-assets' );

CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'school-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'school-assets' AND auth.role() = 'authenticated' );
