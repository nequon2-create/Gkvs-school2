-- Migration: Fix teacher ratings RLS and parent_id foreign key
-- Drop existing RLS policies
DROP POLICY IF EXISTS "Allow parent insert/update ratings" ON public.teacher_ratings;
DROP POLICY IF EXISTS "Allow select ratings" ON public.teacher_ratings;

-- Create public policies to allow both authenticated and anonymous mobile users to read and write ratings
CREATE POLICY "Allow public ratings operations" ON public.teacher_ratings
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- Drop the old foreign key constraint referencing auth.users
ALTER TABLE public.teacher_ratings DROP CONSTRAINT IF EXISTS teacher_ratings_parent_id_fkey;

-- Recreate the foreign key constraint referencing public.students table
ALTER TABLE public.teacher_ratings
    ADD CONSTRAINT teacher_ratings_parent_id_fkey
    FOREIGN KEY (parent_id)
    REFERENCES public.students(id)
    ON DELETE CASCADE;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
