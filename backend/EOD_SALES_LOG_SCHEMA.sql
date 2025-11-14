-- =====================================================
-- EOD SALES LOG TABLE SCHEMA
-- Store daily actual sales in same format as CSV
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create table with exact CSV structure
CREATE TABLE IF NOT EXISTS eod_sales_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core fields (matching CSV exactly)
    sale_date DATE NOT NULL,
    product_id INTEGER,  -- From products table (optional for reference)
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    season_affinity VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold >= 0),
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    final_price DECIMAL(10, 2) NOT NULL,
    revenue DECIMAL(10, 2) NOT NULL,  -- quantity_sold * final_price
    profit DECIMAL(10, 2) NOT NULL,   -- quantity_sold * (final_price - cost_price)
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Monday, 6=Sunday
    is_weekend INTEGER NOT NULL CHECK (is_weekend IN (0, 1)),  -- 0=No, 1=Yes
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    is_festival BOOLEAN DEFAULT FALSE,
    festival_name VARCHAR(100),
    
    -- Metadata (additional tracking)
    uploaded_by UUID REFERENCES profiles(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One record per product per day
    CONSTRAINT unique_product_date UNIQUE(sale_date, product_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_eod_sales_date ON eod_sales_log(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_eod_sales_product ON eod_sales_log(product_name);
CREATE INDEX IF NOT EXISTS idx_eod_sales_date_product ON eod_sales_log(sale_date, product_name);
CREATE INDEX IF NOT EXISTS idx_eod_sales_uploaded_at ON eod_sales_log(uploaded_at DESC);

-- Enable Row Level Security
ALTER TABLE eod_sales_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Managers can insert EOD sales
CREATE POLICY "Managers can insert EOD sales"
ON eod_sales_log FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

-- RLS Policy: Managers can view EOD sales
CREATE POLICY "Managers can view EOD sales"
ON eod_sales_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

-- RLS Policy: Managers can update EOD sales (for corrections)
CREATE POLICY "Managers can update EOD sales"
ON eod_sales_log FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

-- RLS Policy: Managers can delete EOD sales
CREATE POLICY "Managers can delete EOD sales"
ON eod_sales_log FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

-- Function to get EOD sales as CSV-compatible format
CREATE OR REPLACE FUNCTION get_eod_sales_for_forecast()
RETURNS TABLE (
    sale_date DATE,
    product_id INTEGER,
    product_name VARCHAR(255),
    category VARCHAR(100),
    season_affinity VARCHAR(50),
    price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    quantity_sold INTEGER,
    discount_percent DECIMAL(5, 2),
    final_price DECIMAL(10, 2),
    revenue DECIMAL(10, 2),
    profit DECIMAL(10, 2),
    day_of_week INTEGER,
    is_weekend INTEGER,
    month INTEGER,
    year INTEGER,
    is_festival BOOLEAN,
    festival_name VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eod.sale_date,
        eod.product_id,
        eod.product_name,
        eod.category,
        eod.season_affinity,
        eod.price,
        eod.cost_price,
        eod.quantity_sold,
        eod.discount_percent,
        eod.final_price,
        eod.revenue,
        eod.profit,
        eod.day_of_week,
        eod.is_weekend,
        eod.month,
        eod.year,
        eod.is_festival,
        eod.festival_name
    FROM eod_sales_log eod
    ORDER BY eod.sale_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify table structure
COMMENT ON TABLE eod_sales_log IS 'Stores daily end-of-day sales with same structure as training CSV for incremental forecasting';
COMMENT ON COLUMN eod_sales_log.sale_date IS 'Date of sales (YYYY-MM-DD)';
COMMENT ON COLUMN eod_sales_log.product_name IS 'Product name (must match products table)';
COMMENT ON COLUMN eod_sales_log.quantity_sold IS 'Total units sold on this date';
COMMENT ON COLUMN eod_sales_log.discount_percent IS 'Auto-calculated discount percentage';
COMMENT ON COLUMN eod_sales_log.final_price IS 'Price after discount applied';
COMMENT ON COLUMN eod_sales_log.is_festival IS 'Whether this date is a festival';
