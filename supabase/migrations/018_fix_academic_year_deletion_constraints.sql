-- Migration: Fix Academic Year Deletion Constraints
-- Description: Updates foreign key references to public.academic_years to ON DELETE CASCADE or ON DELETE SET NULL.
-- This prevents database constraint violations when deleting an academic year.

BEGIN;

-- 1. Fix student_fees academic_year_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_fees') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_fees_academic_year_id_fkey' AND table_schema = 'public' AND table_name = 'student_fees') THEN
            ALTER TABLE public.student_fees DROP CONSTRAINT student_fees_academic_year_id_fkey;
        END IF;
        
        ALTER TABLE public.student_fees 
            ADD CONSTRAINT student_fees_academic_year_id_fkey 
            FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Fix fee_structure academic_year_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structure') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fee_structure_academic_year_id_fkey' AND table_schema = 'public' AND table_name = 'fee_structure') THEN
            ALTER TABLE public.fee_structure DROP CONSTRAINT fee_structure_academic_year_id_fkey;
        END IF;
        
        ALTER TABLE public.fee_structure 
            ADD CONSTRAINT fee_structure_academic_year_id_fkey 
            FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Fix classes academic_year_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classes') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classes_academic_year_id_fkey' AND table_schema = 'public' AND table_name = 'classes') THEN
            ALTER TABLE public.classes DROP CONSTRAINT classes_academic_year_id_fkey;
        END IF;
        
        ALTER TABLE public.classes 
            ADD CONSTRAINT classes_academic_year_id_fkey 
            FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Fix exams academic_year_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exams') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'exams_academic_year_id_fkey' AND table_schema = 'public' AND table_name = 'exams') THEN
            ALTER TABLE public.exams DROP CONSTRAINT exams_academic_year_id_fkey;
        END IF;
        
        ALTER TABLE public.exams 
            ADD CONSTRAINT exams_academic_year_id_fkey 
            FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Fix students academic_year_id foreign key (ON DELETE SET NULL to preserve student records)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'students_academic_year_id_fkey' AND table_schema = 'public' AND table_name = 'students') THEN
            ALTER TABLE public.students DROP CONSTRAINT students_academic_year_id_fkey;
        END IF;
        
        ALTER TABLE public.students 
            ADD CONSTRAINT students_academic_year_id_fkey 
            FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. Fix student_enrollment_history academic_year_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_enrollment_history') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_enrollment_history_academic_year_id_fkey' AND table_schema = 'public' AND table_name = 'student_enrollment_history') THEN
            ALTER TABLE public.student_enrollment_history DROP CONSTRAINT student_enrollment_history_academic_year_id_fkey;
        END IF;
        
        ALTER TABLE public.student_enrollment_history 
            ADD CONSTRAINT student_enrollment_history_academic_year_id_fkey 
            FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Reload schema cache to update Postgrest API routes
NOTIFY pgrst, 'reload schema';

COMMIT;
