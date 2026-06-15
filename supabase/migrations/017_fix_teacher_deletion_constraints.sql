-- Migration: Fix Teacher Deletion Constraints
-- Description: Updates foreign key references to public.teachers to ON DELETE SET NULL or ON DELETE CASCADE.
-- This prevents database constraint violations when deleting a teacher profile.

BEGIN;

-- 1. Fix student_attendance/attendance marked_by foreign key
DO $$
BEGIN
    -- Fix student_attendance table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_attendance') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_attendance_marked_by_fkey' AND table_schema = 'public' AND table_name = 'student_attendance') THEN
            ALTER TABLE public.student_attendance DROP CONSTRAINT student_attendance_marked_by_fkey;
        END IF;
        
        ALTER TABLE public.student_attendance 
            ADD CONSTRAINT student_attendance_marked_by_fkey 
            FOREIGN KEY (marked_by) REFERENCES public.teachers(id) ON DELETE SET NULL;
    END IF;

    -- Fix attendance table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'attendance_marked_by_fkey' AND table_schema = 'public' AND table_name = 'attendance') THEN
            ALTER TABLE public.attendance DROP CONSTRAINT attendance_marked_by_fkey;
        END IF;
        
        ALTER TABLE public.attendance 
            ADD CONSTRAINT attendance_marked_by_fkey 
            FOREIGN KEY (marked_by) REFERENCES public.teachers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Fix classes class_teacher_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_class_teacher' AND table_schema = 'public' AND table_name = 'classes') THEN
        ALTER TABLE public.classes DROP CONSTRAINT fk_class_teacher;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classes_class_teacher_id_fkey' AND table_schema = 'public' AND table_name = 'classes') THEN
        ALTER TABLE public.classes DROP CONSTRAINT classes_class_teacher_id_fkey;
    END IF;

    ALTER TABLE public.classes 
        ADD CONSTRAINT fk_class_teacher 
        FOREIGN KEY (class_teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
END $$;

-- 3. Fix homework teacher_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'homework_teacher_id_fkey' AND table_schema = 'public' AND table_name = 'homework') THEN
        ALTER TABLE public.homework DROP CONSTRAINT homework_teacher_id_fkey;
    END IF;

    ALTER TABLE public.homework 
        ADD CONSTRAINT homework_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
END $$;

-- 4. Fix subjects teacher_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subjects_teacher_id_fkey' AND table_schema = 'public' AND table_name = 'subjects') THEN
        ALTER TABLE public.subjects DROP CONSTRAINT subjects_teacher_id_fkey;
    END IF;

    ALTER TABLE public.subjects 
        ADD CONSTRAINT subjects_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
END $$;

-- 5. Fix teacher_ratings teacher_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'teacher_ratings_teacher_id_fkey' AND table_schema = 'public' AND table_name = 'teacher_ratings') THEN
        ALTER TABLE public.teacher_ratings DROP CONSTRAINT teacher_ratings_teacher_id_fkey;
    END IF;

    ALTER TABLE public.teacher_ratings 
        ADD CONSTRAINT teacher_ratings_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
END $$;

-- Reload schema cache to update Postgrest API routes
NOTIFY pgrst, 'reload schema';

COMMIT;
