-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, academic_year_id)
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view classes"
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert classes"
  ON public.classes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update classes"
  ON public.classes
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete classes"
  ON public.classes
  FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classes_updated_at_trigger
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION update_classes_updated_at();

-- Insert sample classes (1-10) for the current academic year
DO $$
DECLARE
  current_year_id UUID;
BEGIN
  -- Get the current academic year ID
  SELECT id INTO current_year_id 
  FROM public.academic_years 
  WHERE is_current = TRUE 
  LIMIT 1;
  
  -- If no current year, get the most recent one
  IF current_year_id IS NULL THEN
    SELECT id INTO current_year_id 
    FROM public.academic_years 
    ORDER BY start_date DESC 
    LIMIT 1;
  END IF;
  
  -- Insert classes 1-10 if we have an academic year
  IF current_year_id IS NOT NULL THEN
    INSERT INTO public.classes (name, academic_year_id)
    VALUES
      ('Class 1', current_year_id),
      ('Class 2', current_year_id),
      ('Class 3', current_year_id),
      ('Class 4', current_year_id),
      ('Class 5', current_year_id),
      ('Class 6', current_year_id),
      ('Class 7', current_year_id),
      ('Class 8', current_year_id),
      ('Class 9', current_year_id),
      ('Class 10', current_year_id)
    ON CONFLICT (name, academic_year_id) DO NOTHING;
  END IF;
END $$;
