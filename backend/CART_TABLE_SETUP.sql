-- ============================================
-- CART TABLE WITH RLS POLICIES
-- ============================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.cart_items CASCADE;

-- ============================================
-- CREATE CART_ITEMS TABLE
-- ============================================

CREATE TABLE public.cart_items (
  cart_item_id SERIAL PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one product per customer (no duplicates)
  UNIQUE(customer_id, product_id)
);

COMMENT ON TABLE public.cart_items IS 'Stores cart items for customers - replaces localStorage';
COMMENT ON COLUMN public.cart_items.customer_id IS 'UUID - references registered user in auth.users';
COMMENT ON COLUMN public.cart_items.product_id IS 'UUID - references public.products(id)';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_cart_items_customer_id ON public.cart_items(customer_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_updated_at();

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP OLD POLICIES (IF ANY)
-- ============================================

DROP POLICY IF EXISTS "Customers can view own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Customers can add to own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Customers can update own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Customers can delete from own cart" ON public.cart_items;

-- ============================================
-- CART_ITEMS TABLE RLS POLICIES
-- ============================================

-- Customers can view their own cart items
CREATE POLICY "Customers can view own cart"
ON public.cart_items
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Customers can add items to their own cart
CREATE POLICY "Customers can add to own cart"
ON public.cart_items
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Customers can update their own cart items
CREATE POLICY "Customers can update own cart"
ON public.cart_items
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Customers can delete items from their own cart
CREATE POLICY "Customers can delete from own cart"
ON public.cart_items
FOR DELETE
TO authenticated
USING (customer_id = auth.uid());

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE, SELECT ON SEQUENCE cart_items_cart_item_id_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Cart Items table created successfully!';
  RAISE NOTICE '✅ All RLS policies and permissions configured.';
END $$;
