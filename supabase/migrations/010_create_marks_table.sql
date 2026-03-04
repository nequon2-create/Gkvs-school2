-- Migration: Create Marks Table
-- Description: Creates the marks table for storing student exam marks with grades and remarks
-- Author: School Management System
-- Date: 2026-02-17

-- ============================================
-- CREATE MARKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    
    -- Subject and Marks
    subject VARCHAR(100) NOT NULL,
    marks_obtained NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
    max_marks INTEGER NOT NULL CHECK (max_marks > 0),
    
    -- Auto-calculated fields
    percentage NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN max_marks > 0 THEN (marks_obtained / max_marks * 100)
            ELSE 0
        END
    ) STORED,
    
    grade VARCHAR(5) GENERATED ALWAYS AS (
        CASE
            WHEN max_marks > 0 AND (marks_obtained / max_marks * 100) >= 90 THEN 'A+'
            WHEN max_marks > 0 AND (marks_obtained / max_marks * 100) >= 80 THEN 'A'
            WHEN max_marks > 0 AND (marks_obtained / max_marks * 100) >= 70 THEN 'B+'
            WHEN max_marks > 0 AND (marks_obtained / max_marks * 100) >= 60 THEN 'B'
            WHEN max_marks > 0 AND (marks_obtained / max_marks * 100) >= 50 THEN 'C'
            WHEN max_marks > 0 AND (marks_obtained / max_marks * 100) >= 40 THEN 'D'
            ELSE 'F'
        END
    ) STORED,
    
    -- Additional fields
    remarks TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unique constraint: One mark entry per student per exam per subject
    CONSTRAINT unique_student_exam_subject UNIQUE (student_id, exam_id, subject),
    
    -- Validation: marks_obtained cannot exceed max_marks
    CONSTRAINT valid_marks_range CHECK (marks_obtained <= max_marks)
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for filtering by student
CREATE INDEX IF NOT EXISTS idx_marks_student_id ON public.marks(student_id);

-- Index for filtering by exam
CREATE INDEX IF NOT EXISTS idx_marks_exam_id ON public.marks(exam_id);

-- Index for filtering by subject
CREATE INDEX IF NOT EXISTS idx_marks_subject ON public.marks(subject);

-- Composite index for common query pattern (exam + class via student)
CREATE INDEX IF NOT EXISTS idx_marks_exam_student ON public.marks(exam_id, student_id);

-- Index for grade-based queries
CREATE INDEX IF NOT EXISTS idx_marks_grade ON public.marks(grade);

-- ============================================
-- CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_marks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marks_updated_at
    BEFORE UPDATE ON public.marks
    FOR EACH ROW
    EXECUTE FUNCTION update_marks_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all marks"
    ON public.marks
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: Teachers can view and create marks for their students
CREATE POLICY "Teachers can view their class marks"
    ON public.marks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.teachers ON teachers.user_id = users.id
            JOIN public.students ON students.class_id IN (
                SELECT id FROM public.classes WHERE class_teacher_id = teachers.id
            )
            WHERE users.id = auth.uid()
            AND users.role = 'teacher'
            AND students.id = marks.student_id
        )
    );

CREATE POLICY "Teachers can create marks for their students"
    ON public.marks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.teachers ON teachers.user_id = users.id
            JOIN public.students ON students.class_id IN (
                SELECT id FROM public.classes WHERE class_teacher_id = teachers.id
            )
            WHERE users.id = auth.uid()
            AND users.role = 'teacher'
            AND students.id = marks.student_id
        )
    );

-- Policy: Parents can view their children's marks
CREATE POLICY "Parents can view their children's marks"
    ON public.marks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            JOIN public.parents ON parents.user_id = users.id
            JOIN public.students ON students.parent_id = parents.id
            WHERE users.id = auth.uid()
            AND users.role = 'parent'
            AND students.id = marks.student_id
        )
    );

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Note: This will only work if you have existing students and exams
-- Uncomment to insert sample data:

/*
INSERT INTO public.marks (student_id, exam_id, subject, marks_obtained, max_marks, created_by)
SELECT 
    s.id as student_id,
    e.id as exam_id,
    'Mathematics' as subject,
    85.5 as marks_obtained,
    100 as max_marks,
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1) as created_by
FROM public.students s
CROSS JOIN public.exams e
LIMIT 5;
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'marks'
ORDER BY ordinal_position;

-- Verify constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'marks';

-- Verify indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'marks'
AND schemaname = 'public';

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'marks';

-- ============================================
-- USEFUL QUERIES FOR MARKS MANAGEMENT
-- ============================================

-- Get all marks for a specific exam
/*
SELECT 
    s.full_name,
    m.subject,
    m.marks_obtained,
    m.max_marks,
    m.percentage,
    m.grade
FROM public.marks m
JOIN public.students s ON s.id = m.student_id
WHERE m.exam_id = 'YOUR_EXAM_ID'
ORDER BY m.subject, s.full_name;
*/

-- Get class average for an exam
/*
SELECT 
    m.subject,
    ROUND(AVG(m.percentage), 2) as avg_percentage,
    COUNT(*) as total_students
FROM public.marks m
JOIN public.students s ON s.id = m.student_id
WHERE m.exam_id = 'YOUR_EXAM_ID'
AND s.class_id = 'YOUR_CLASS_ID'
GROUP BY m.subject;
*/

-- Get topper for each subject
/*
SELECT DISTINCT ON (m.subject)
    m.subject,
    s.full_name,
    m.marks_obtained,
    m.max_marks,
    m.percentage,
    m.grade
FROM public.marks m
JOIN public.students s ON s.id = m.student_id
WHERE m.exam_id = 'YOUR_EXAM_ID'
ORDER BY m.subject, m.percentage DESC;
*/

-- Get grade distribution
/*
SELECT 
    m.grade,
    COUNT(*) as student_count,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as percentage
FROM public.marks m
WHERE m.exam_id = 'YOUR_EXAM_ID'
GROUP BY m.grade
ORDER BY m.grade;
*/

COMMENT ON TABLE public.marks IS 'Stores student exam marks with auto-calculated grades and percentages';
COMMENT ON COLUMN public.marks.percentage IS 'Auto-calculated: (marks_obtained / max_marks) * 100';
COMMENT ON COLUMN public.marks.grade IS 'Auto-calculated based on percentage: A+, A, B+, B, C, D, F';
