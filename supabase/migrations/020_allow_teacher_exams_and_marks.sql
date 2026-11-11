-- Migration: Allow Public and Teacher Exam and Marks Operations
-- Enables teacher mobile app to create/update exams, generate marks sheets, and publish marks

DROP POLICY IF EXISTS "Admins manage exams" ON public.exams;
DROP POLICY IF EXISTS "Everyone can view published exams" ON public.exams;
DROP POLICY IF EXISTS "Allow public exams operations" ON public.exams;

CREATE POLICY "Allow public exams operations" ON public.exams
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage marks" ON public.marks;
DROP POLICY IF EXISTS "Public can view marks" ON public.marks;
DROP POLICY IF EXISTS "Allow public marks operations" ON public.marks;

CREATE POLICY "Allow public marks operations" ON public.marks
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
