-- Fix attendance table migration
-- This replaces 007_create_attendance_table.sql with correct structure

-- Drop existing attendance table if it exists (to recreate with correct structure)
DROP TABLE IF EXISTS public.attendance CASCADE;

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES auth.users(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_date UNIQUE(student_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_class ON public.attendance(class_id);
CREATE INDEX idx_attendance_class_date ON public.attendance(class_id, date);
CREATE INDEX idx_attendance_academic_year ON public.attendance(academic_year_id);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role bypass attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can view published attendance" ON public.attendance;

-- Create RLS policies
CREATE POLICY "Service role bypass attendance"
ON public.attendance FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage attendance"
ON public.attendance FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

CREATE POLICY "Teachers can manage attendance"
ON public.attendance FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'teacher')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'teacher')
);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
GRANT ALL ON public.attendance TO anon;

-- Add comment
COMMENT ON TABLE public.attendance IS 'Stores daily attendance records for students';
