-- Create student_enrollment_history table
CREATE TABLE IF NOT EXISTS public.student_enrollment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'transferred', 'alumni')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_enrollment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view enrollment history"
  ON public.student_enrollment_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert enrollment history"
  ON public.student_enrollment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update enrollment history"
  ON public.student_enrollment_history
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete enrollment history"
  ON public.student_enrollment_history
  FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update timestamp trigger (Assuming update_classes_updated_at is generic or we create a new one, actually let's just make one specifically or use a generic one if it exists. Looking at create_classes_table, it defines `update_classes_updated_at`. Let me define a new one for this table)

CREATE OR REPLACE FUNCTION update_enrollment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_history_updated_at_trigger
  BEFORE UPDATE ON public.student_enrollment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_history_updated_at();

-- Create RPC function to handle bulk promotion
CREATE OR REPLACE FUNCTION public.promote_students(
  p_student_ids UUID[],
  p_new_class_id UUID,
  p_new_academic_year_id UUID
) RETURNS void AS $$
DECLARE
  v_student_id UUID;
  v_old_class_id UUID;
  v_old_academic_year_id UUID;
BEGIN
  -- Loop through each student to promote
  FOREACH v_student_id IN ARRAY p_student_ids
  LOOP
    -- Get current class and academic year for the student
    SELECT class_id, academic_year_id INTO v_old_class_id, v_old_academic_year_id
    FROM public.students
    WHERE id = v_student_id;

    -- ONLY insert into history if they had a previous academic year
    IF v_old_academic_year_id IS NOT NULL THEN
      INSERT INTO public.student_enrollment_history (
        student_id, academic_year_id, class_id, status
      ) VALUES (
        v_student_id, v_old_academic_year_id, v_old_class_id, 'completed'
      );
    END IF;

    -- Update the student record to the new class and academic year
    UPDATE public.students
    SET 
      class_id = p_new_class_id,
      academic_year_id = p_new_academic_year_id,
      updated_at = timezone('utc'::text, now())
    WHERE id = v_student_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
