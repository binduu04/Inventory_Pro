-- =====================================================
-- PURCHASE ORDER MANAGEMENT SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add supplier_id and cost_price to products table (if not exists)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id),
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) DEFAULT 0.00;

-- Create index for supplier lookup
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

-- Step 2: Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    manager_id UUID NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'placed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_po_status CHECK (status IN ('placed', 'received'))
);

-- Step 3: Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost DECIMAL(10, 2) NOT NULL CHECK (total_cost >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_manager ON purchase_orders(manager_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_created ON purchase_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_product ON purchase_order_items(product_id);

-- Step 5: Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    count_part INTEGER;
    new_order_number TEXT;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COUNT(*) + 1 INTO count_part
    FROM purchase_orders
    WHERE order_number LIKE 'PO-' || year_part || '-%';
    new_order_number := 'PO-' || year_part || '-' || LPAD(count_part::TEXT, 4, '0');
    RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Step 7: Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_po_timestamp
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Step 8: Function to calculate total
CREATE OR REPLACE FUNCTION calculate_po_total(po_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(total_cost), 0.00) INTO total
    FROM purchase_order_items
    WHERE purchase_order_id = po_id;
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Trigger to auto-update total
CREATE OR REPLACE FUNCTION update_po_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE purchase_orders
        SET total_amount = calculate_po_total(OLD.purchase_order_id)
        WHERE id = OLD.purchase_order_id;
        RETURN OLD;
    ELSE
        UPDATE purchase_orders
        SET total_amount = calculate_po_total(NEW.purchase_order_id)
        WHERE id = NEW.purchase_order_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_total_insert
AFTER INSERT ON purchase_order_items
FOR EACH ROW EXECUTE FUNCTION update_po_total();

CREATE TRIGGER trigger_update_total_update
AFTER UPDATE ON purchase_order_items
FOR EACH ROW EXECUTE FUNCTION update_po_total();

CREATE TRIGGER trigger_update_total_delete
AFTER DELETE ON purchase_order_items
FOR EACH ROW EXECUTE FUNCTION update_po_total();

-- Step 10: Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Step 11: RLS Policies
CREATE POLICY "Managers can view purchase orders"
ON purchase_orders FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

CREATE POLICY "Managers can create purchase orders"
ON purchase_orders FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

CREATE POLICY "Managers can update purchase orders"
ON purchase_orders FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

CREATE POLICY "Managers can view items"
ON purchase_order_items FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

CREATE POLICY "Managers can insert items"
ON purchase_order_items FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
);

-- Step 12: Grant permissions
GRANT ALL ON purchase_orders TO authenticated;
GRANT ALL ON purchase_order_items TO authenticated;
