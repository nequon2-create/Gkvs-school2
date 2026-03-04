-- Critical Fix: Add missing columns and create missing tables
-- Run this BEFORE the attendance and exams migrations!

-- FIX 1: Add numeric_value column to classes table
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS numeric_value INTEGER;

-- Update numeric_value for existing classes
UPDATE public.classes
SET numeric_value = CASE
  WHEN class_name LIKE '%1%' OR class_name = 'Class 1' THEN 1
  WHEN class_name LIKE '%2%' OR class_name = 'Class 2' THEN 2
  WHEN class_name LIKE '%3%' OR class_name = 'Class 3' THEN 3
  WHEN class_name LIKE '%4%' OR class_name = 'Class 4' THEN 4
  WHEN class_name LIKE '%5%' OR class_name = 'Class 5' THEN 5
  WHEN class_name LIKE '%6%' OR class_name = 'Class 6' THEN 6
  WHEN class_name LIKE '%7%' OR class_name = 'Class 7' THEN 7
  WHEN class_name LIKE '%8%' OR class_name = 'Class 8' THEN 8
  WHEN class_name LIKE '%9%' OR class_name = 'Class 9' THEN 9
  WHEN class_name LIKE '%10%' OR class_name = 'Class 10' THEN 10
  ELSE 0
END
WHERE numeric_value IS NULL;

-- FIX 2: Add missing columns to academic_years table
ALTER TABLE public.academic_years
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE public.academic_years
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Update existing academic year records with dates
UPDATE public.academic_years
SET start_date = CASE 
    WHEN year_name LIKE '2024-2025' THEN '2024-04-01'
    WHEN year_name LIKE '2025-2026' THEN '2025-04-01'
    WHEN year_name LIKE '2026-2027' THEN '2026-04-01'
    WHEN year_name LIKE '2027-2028' THEN '2027-04-01'
    ELSE DATE(CONCAT(SUBSTRING(year_name, 1, 4), '-04-01'))
END,
end_date = CASE
    WHEN year_name LIKE '2024-2025' THEN '2025-03-31'
    WHEN year_name LIKE '2025-2026' THEN '2026-03-31'
    WHEN year_name LIKE '2026-2027' THEN '2027-03-31'
    WHEN year_name LIKE '2027-2028' THEN '2028-03-31'
    ELSE DATE(CONCAT(SUBSTRING(year_name, 6, 4), '-03-31'))
END
WHERE start_date IS NULL;

-- Force Supabase schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Verify fixes
SELECT 'Classes with numeric_value:' as status, COUNT(*) as count 
FROM public.classes WHERE numeric_value IS NOT NULL
UNION ALL
SELECT 'Academic years with dates:' as status, COUNT(*) as count
FROM public.academic_years WHERE start_date IS NOT NULL;
