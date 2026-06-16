-- Migration: Fix Student Deletion Cascades
-- Description: Drop and recreate foreign key constraints for fee_payments and certificates referencing students to cascade deletions.

BEGIN;

-- 1. Fix public.fee_payments student_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_payments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fee_payments_student_id_fkey' AND table_schema = 'public' AND table_name = 'fee_payments') THEN
            ALTER TABLE public.fee_payments DROP CONSTRAINT fee_payments_student_id_fkey;
        END IF;
        
        ALTER TABLE public.fee_payments 
            ADD CONSTRAINT fee_payments_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Fix public.certificates student_id foreign key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certificates') THEN
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'certificates_student_id_fkey' AND table_schema = 'public' AND table_name = 'certificates') THEN
            ALTER TABLE public.certificates DROP CONSTRAINT certificates_student_id_fkey;
        END IF;
        
        ALTER TABLE public.certificates 
            ADD CONSTRAINT certificates_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Reload schema cache to update Postgrest API routes
NOTIFY pgrst, 'reload schema';

COMMIT;
