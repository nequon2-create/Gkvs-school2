-- Ensure students table has all required columns
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(20),
  date_of_birth DATE,
  parent_name VARCHAR(255),
  parent_phone VARCHAR(20),
  parent_email VARCHAR(255),
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  photo_url TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure teachers table has all required columns
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(20),
  date_of_birth DATE,
  subject VARCHAR(255),
  qualification VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  photo_url TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view students"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert students"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update students"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete students"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for teachers
CREATE POLICY IF NOT EXISTS "Allow authenticated users to view teachers"
  ON public.teachers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert teachers"
  ON public.teachers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update teachers"
  ON public.teachers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete teachers"
  ON public.teachers
  FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update timestamp triggers
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS students_updated_at_trigger ON public.students;
CREATE TRIGGER students_updated_at_trigger
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();

DROP TRIGGER IF EXISTS teachers_updated_at_trigger ON public.teachers;
CREATE TRIGGER teachers_updated_at_trigger
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_teachers_updated_at();
