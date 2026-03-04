-- FIX: Allow mobile teachers to insert homework
-- (Mobile app queries Supabase anonymously using login_id instead of Supabase Auth)
DROP POLICY IF EXISTS "Teachers can insert homework" ON public.homework;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.homework;

CREATE POLICY "Enable insert access for all users" 
ON public.homework 
FOR INSERT 
WITH CHECK (true);

-- FIX: Allow mobile users (teachers/parents) to view the students list
DROP POLICY IF EXISTS "Enable read access for all users" ON public.students;

CREATE POLICY "Enable read access for all users" 
ON public.students 
FOR SELECT 
USING (true);
