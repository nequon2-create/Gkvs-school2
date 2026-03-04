-- =================================================================================
-- FIX: MOBILE APP LOGIN (RLS POLICIES FOR ANONYMOUS QUERIES)
-- =================================================================================
-- The mobile app attempts to verify the login_id and password using an anonymous
-- Supabase query BEFORE the user is authenticated. 
-- The existing RLS policies only allow "authenticated" users to read the tables,
-- resulting in 0 rows being returned during login.

-- FIX STUDENTS TABLE
DROP POLICY IF EXISTS "Allow authenticated users to view students" ON public.students;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.students;

CREATE POLICY "Enable read access for all students" 
ON public.students 
FOR SELECT 
USING (true);

-- FIX TEACHERS TABLE
DROP POLICY IF EXISTS "Allow authenticated users to view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.teachers;

CREATE POLICY "Enable read access for all teachers" 
ON public.teachers 
FOR SELECT 
USING (true);
