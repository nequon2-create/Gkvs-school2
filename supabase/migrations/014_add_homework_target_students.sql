-- Add student_ids column to homework table
ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS student_ids uuid[] DEFAULT NULL;

-- Force postgrest cache reload
NOTIFY pgrst, 'reload schema';
