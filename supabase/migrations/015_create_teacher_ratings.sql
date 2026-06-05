-- Drop table if it already exists (prevents conflicts with partial/legacy tables)
DROP TABLE IF EXISTS public.teacher_ratings CASCADE;

-- Create teacher ratings table
CREATE TABLE public.teacher_ratings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments text,
    rating_month text NOT NULL CHECK (rating_month ~ '^[0-9]{4}-[0-9]{2}$'),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Constraint to enforce only one rating per parent/student to a teacher per calendar month
    UNIQUE (parent_id, teacher_id, rating_month)
);

-- Enable RLS
ALTER TABLE public.teacher_ratings ENABLE ROW LEVEL SECURITY;

-- Allow parents to insert/update their ratings
CREATE POLICY "Allow parent insert/update ratings" ON public.teacher_ratings
    FOR ALL TO authenticated
    USING (auth.uid() = parent_id)
    WITH CHECK (auth.uid() = parent_id);

-- Allow authenticated users to view ratings
CREATE POLICY "Allow select ratings" ON public.teacher_ratings
    FOR SELECT TO authenticated
    USING (true);

-- Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';
