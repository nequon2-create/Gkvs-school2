-- Fix exams table migration
-- This replaces 008_create_exams_table.sql with correct structure

-- Drop existing exams table if it exists (to recreate with correct structure)
DROP TABLE IF EXISTS public.exams CASCADE;

-- Create exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    exam_time TIME,
    duration_minutes INTEGER,
    total_marks INTEGER NOT NULL CHECK (total_marks > 0),
    passing_marks INTEGER CHECK (passing_marks >= 0 AND passing_marks <= total_marks),
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_exams_class ON public.exams(class_id);
CREATE INDEX idx_exams_academic_year ON public.exams(academic_year_id);
CREATE INDEX idx_exams_date ON public.exams(exam_date);
CREATE INDEX idx_exams_published ON public.exams(is_published);
CREATE INDEX idx_exams_subject ON public.exams(subject);
CREATE INDEX idx_exams_class_date ON public.exams(class_id, exam_date);

-- Enable Row Level Security
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role bypass exams" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage all exams" ON public.exams;
DROP POLICY IF EXISTS "Users can view published exams" ON public.exams;

-- RLS Policies for admin full access
CREATE POLICY "Service role bypass exams"
    ON public.exams FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Admins can manage all exams"
    ON public.exams FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Students and parents can view published exams only
CREATE POLICY "Users can view published exams"
    ON public.exams FOR SELECT TO authenticated
    USING (is_published = TRUE);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set published_at when exam is published
CREATE OR REPLACE FUNCTION set_exam_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = TRUE AND (OLD.is_published = FALSE OR OLD.is_published IS NULL) THEN
        NEW.published_at = NOW();
    ELSIF NEW.is_published = FALSE THEN
        NEW.published_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_exam_published_at_trigger ON public.exams;
CREATE TRIGGER set_exam_published_at_trigger
    BEFORE UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION set_exam_published_at();

-- Grant permissions
GRANT ALL ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
GRANT ALL ON public.exams TO anon;

-- Add comments for documentation
COMMENT ON TABLE public.exams IS 'Stores examination details for all classes';
COMMENT ON COLUMN public.exams.exam_name IS 'Name of the examination (e.g., Mid-Term, Final)';
COMMENT ON COLUMN public.exams.subject IS 'Subject of the exam (e.g., Mathematics, English)';
COMMENT ON COLUMN public.exams.is_published IS 'Whether the exam is visible to students/parents';
COMMENT ON COLUMN public.exams.published_at IS 'Timestamp when the exam was published';
COMMENT ON COLUMN public.exams.duration_minutes IS 'Duration of the exam in minutes';
