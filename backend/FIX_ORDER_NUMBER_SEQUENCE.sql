-- =====================================================
-- FIX: Order Number Generation (Race Condition Fix)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Create a sequence for purchase orders
CREATE SEQUENCE IF NOT EXISTS purchase_order_seq START 1;

-- Step 2: Replace the order number generation function with a sequence-based one
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_order_number TEXT;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Loop to handle race conditions
    LOOP
        attempt := attempt + 1;
        
        -- Get next sequence value
        sequence_num := nextval('purchase_order_seq');
        
        -- Generate order number
        new_order_number := 'PO-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
        
        -- Check if this order number already exists
        IF NOT EXISTS (SELECT 1 FROM purchase_orders WHERE order_number = new_order_number) THEN
            RETURN new_order_number;
        END IF;
        
        -- If we've tried too many times, raise an error
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique order number after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Alternative simpler approach - Use UUID-based order numbers
-- Uncomment if you prefer UUID-based order numbers instead of sequential

-- CREATE OR REPLACE FUNCTION generate_order_number()
-- RETURNS TEXT AS $$
-- DECLARE
--     random_suffix TEXT;
-- BEGIN
--     random_suffix := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
--     RETURN 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || random_suffix;
-- END;
-- $$ LANGUAGE plpgsql;

-- Step 4: Verify the fix
-- SELECT generate_order_number();  -- Should return PO-2025-0001, PO-2025-0002, etc.
