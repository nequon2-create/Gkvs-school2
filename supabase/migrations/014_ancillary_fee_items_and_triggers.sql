-- Migration: 014_ancillary_fee_items_and_triggers.sql
-- Description: Creates ancillary fee tables (uniform, books, van, tie_belt, shoes),
-- adds receipt categorization, and updates triggers to handle INSERT, UPDATE, and DELETE accurately.

-- 1. Create table for Class Default Item Fees
CREATE TABLE IF NOT EXISTS class_item_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('uniform', 'books', 'van', 'tie_belt', 'shoes')),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, academic_year_id, item_type)
);

-- 2. Create table for Student Item Fees (Individual tracking)
CREATE TABLE IF NOT EXISTS student_item_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('uniform', 'books', 'van', 'tie_belt', 'shoes')),
    amount_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_pending NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id, item_type)
);

-- 3. Enhance fee_receipts with item receipt fields
ALTER TABLE fee_receipts
ADD COLUMN IF NOT EXISTS receipt_type VARCHAR(20) DEFAULT 'academic' CHECK (receipt_type IN ('academic', 'item')),
ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) CHECK (item_type IN ('uniform', 'books', 'van', 'tie_belt', 'shoes')),
ADD COLUMN IF NOT EXISTS item_receipt_number INTEGER,
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- Index for speedy queries
CREATE INDEX IF NOT EXISTS idx_student_item_fees_student ON student_item_fees(student_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_type ON fee_receipts(receipt_type, item_type);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_academic_year ON fee_receipts(academic_year_id);

-- 4. Improved Trigger Function to update balances on INSERT, UPDATE, or DELETE
CREATE OR REPLACE FUNCTION update_student_fees_on_receipt()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_academic_year_id UUID;
    v_receipt_type VARCHAR;
    v_item_type VARCHAR;
    v_total_paid NUMERIC;
BEGIN
    -- Determine which row context to use (OLD on DELETE, NEW on INSERT/UPDATE)
    IF (TG_OP = 'DELETE') THEN
        v_student_id := OLD.student_id;
        v_academic_year_id := OLD.academic_year_id;
        v_receipt_type := COALESCE(OLD.receipt_type, 'academic');
        v_item_type := OLD.item_type;
    ELSE
        v_student_id := NEW.student_id;
        v_academic_year_id := NEW.academic_year_id;
        v_receipt_type := COALESCE(NEW.receipt_type, 'academic');
        v_item_type := NEW.item_type;
    END IF;

    -- If academic fee receipt
    IF (v_receipt_type = 'academic' OR v_item_type IS NULL) THEN
        -- Calculate total paid excluding cancelled receipts
        SELECT COALESCE(SUM(amount_paid), 0)
        INTO v_total_paid
        FROM fee_receipts
        WHERE student_id = v_student_id
          AND academic_year_id = v_academic_year_id
          AND (receipt_type = 'academic' OR receipt_type IS NULL)
          AND (is_cancelled IS FALSE OR is_cancelled IS NULL);

        -- Update student_fees
        UPDATE student_fees
        SET amount_paid = v_total_paid,
            amount_pending = GREATEST(0, total_amount - v_total_paid),
            updated_at = NOW()
        WHERE student_id = v_student_id
          AND academic_year_id = v_academic_year_id;

    -- If ancillary item receipt
    ELSE
        SELECT COALESCE(SUM(amount_paid), 0)
        INTO v_total_paid
        FROM fee_receipts
        WHERE student_id = v_student_id
          AND academic_year_id = v_academic_year_id
          AND receipt_type = 'item'
          AND item_type = v_item_type
          AND (is_cancelled IS FALSE OR is_cancelled IS NULL);

        -- Update student_item_fees
        UPDATE student_item_fees
        SET amount_paid = v_total_paid,
            amount_pending = GREATEST(0, amount_total - v_total_paid),
            updated_at = NOW()
        WHERE student_id = v_student_id
          AND academic_year_id = v_academic_year_id
          AND item_type = v_item_type;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger for INSERT, UPDATE, and DELETE
DROP TRIGGER IF EXISTS trg_update_student_fees_on_receipt ON fee_receipts;
CREATE TRIGGER trg_update_student_fees_on_receipt
AFTER INSERT OR UPDATE OR DELETE ON fee_receipts
FOR EACH ROW
EXECUTE FUNCTION update_student_fees_on_receipt();
