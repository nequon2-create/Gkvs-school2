-- Migration: Add alert settings to student_fees and trigger for automatic balance calculation
-- Description: Sets up alert_active, alert_frequency, and alert_last_shown_at fields and receipt sync trigger.

ALTER TABLE student_fees
ADD COLUMN IF NOT EXISTS alert_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS alert_frequency VARCHAR DEFAULT 'once',
ADD COLUMN IF NOT EXISTS alert_last_shown_at TIMESTAMP WITH TIME ZONE;

-- Create function to update student_fees aggregate balance upon fee receipt insert
CREATE OR REPLACE FUNCTION update_student_fees_on_receipt()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid NUMERIC;
BEGIN
    -- Aggregate total amount paid for the student in the current academic year
    SELECT COALESCE(SUM(amount_paid), 0)
    INTO v_total_paid
    FROM fee_receipts
    WHERE student_id = NEW.student_id
      AND academic_year_id = NEW.academic_year_id;

    -- Update parent student_fees table row
    UPDATE student_fees
    SET amount_paid = v_total_paid,
        amount_pending = total_amount - v_total_paid,
        updated_at = NOW()
    WHERE student_id = NEW.student_id
      AND academic_year_id = NEW.academic_year_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up the trigger to call the function after any fee receipt insert or update
DROP TRIGGER IF EXISTS trg_update_student_fees_on_receipt ON fee_receipts;
CREATE TRIGGER trg_update_student_fees_on_receipt
AFTER INSERT OR UPDATE ON fee_receipts
FOR EACH ROW
EXECUTE FUNCTION update_student_fees_on_receipt();
