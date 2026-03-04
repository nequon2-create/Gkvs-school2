-- Academic Years Table Migration
-- Creates table for managing school academic years

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_name VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to ensure only one current year
-- If index already exists, this will be skipped
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_only_one_current'
    ) THEN
        CREATE UNIQUE INDEX idx_only_one_current 
        ON academic_years (is_current) 
        WHERE is_current = TRUE;
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_academic_year_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_academic_year_timestamp'
    ) THEN
        CREATE TRIGGER update_academic_year_timestamp
        BEFORE UPDATE ON academic_years
        FOR EACH ROW
        EXECUTE FUNCTION update_academic_year_updated_at();
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON academic_years;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON academic_years;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON academic_years;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON academic_years;

-- Create RLS policies
-- Allow authenticated users to read all academic years
CREATE POLICY "Enable read access for authenticated users"
ON academic_years FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert academic years
CREATE POLICY "Enable insert for authenticated users"
ON academic_years FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update academic years
CREATE POLICY "Enable update for authenticated users"
ON academic_years FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete academic years
CREATE POLICY "Enable delete for authenticated users"
ON academic_years FOR DELETE
TO authenticated
USING (true);

-- Insert sample data (optional, only if table is empty)
INSERT INTO academic_years (year_name, start_date, end_date, is_current)
SELECT '2024-2025', '2024-08-01', '2025-07-31', true
WHERE NOT EXISTS (SELECT 1 FROM academic_years LIMIT 1);
