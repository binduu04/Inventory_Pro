# Cart & Checkout Implementation Guide

## Overview

This implementation replaces localStorage-based cart with a database-backed cart system and adds online checkout functionality for customers.

## Setup Steps

### 1. Create Cart Table in Database

Run the SQL script to create the cart_items table:

```bash
# Execute the CART_TABLE_SETUP.sql file in your Supabase SQL editor
```

The script creates:

- `cart_items` table with RLS policies
- Proper indexes for performance
- Customer-only access policies

### 2. Backend Changes Made

#### New Files:

- `backend/routes/cart_routes.py` - Cart API endpoints
- `backend/CART_TABLE_SETUP.sql` - Database schema

#### Modified Files:

- `backend/app.py` - Registered cart routes at `/api/cart`

#### API Endpoints Created:

1. `GET /api/cart/` - Fetch customer's cart items
2. `POST /api/cart/add` - Add item to cart
3. `PUT /api/cart/update/<cart_item_id>` - Update item quantity
4. `DELETE /api/cart/remove/<cart_item_id>` - Remove item from cart
5. `DELETE /api/cart/clear` - Clear entire cart
6. `POST /api/cart/checkout` - Process checkout and create online order

### 3. Frontend Changes Made

#### Modified Files:

- `frontend/src/pages/CustomerDashboard.jsx`
- `frontend/src/components/Cart.jsx`

#### Key Changes:

1. Replaced localStorage operations with API calls
2. Added `fetchCart()` to load cart from database
3. Updated `addToCart()` to use POST API
4. Updated `updateQuantity()` to use PUT API
5. Updated `removeFromCart()` to use DELETE API
6. Added `handleCheckout()` for order placement

### 4. Checkout Flow

When customer clicks "Proceed to Checkout":

1. Validates cart is not empty
2. Calculates total with discounts
3. Creates sale record with:
   - `sale_type: 'ONLINE'`
   - `order_status: 'paid'`
   - `payment_method: 'ONLINE'`
   - Customer details from profile
4. Creates sale_items for each product
5. Clears cart after successful order
6. Shows success alert with order ID

## Features Implemented

### ✅ Database Cart

- Cart persists across sessions
- No localStorage needed
- Proper user isolation via RLS

### ✅ Cart Operations

- Add to cart
- Update quantity
- Remove items
- Automatic refresh after operations

### ✅ Checkout Process

- Validates cart
- Calculates discounted prices
- Creates online order (status: paid)
- Clears cart on success
- Shows success/error alerts

## Testing Steps

1. **Start Backend Server:**

   ```bash
   cd backend
   python app.py
   ```

2. **Run SQL Script:**

   - Open Supabase SQL Editor
   - Copy content from `CART_TABLE_SETUP.sql`
   - Execute the script

3. **Test Cart Operations:**

   - Login as customer
   - Add products to cart
   - Verify cart persists after page refresh
   - Update quantities
   - Remove items

4. **Test Checkout:**
   - Add items to cart
   - Click "Proceed to Checkout"
   - Verify success alert appears
   - Check cart is cleared
   - Verify order created in `sales` table with:
     - `sale_type = 'ONLINE'`
     - `order_status = 'paid'`

## Database Verification

After checkout, verify in Supabase:

```sql
-- Check sales table for new online order
SELECT * FROM sales
WHERE sale_type = 'ONLINE'
ORDER BY created_at DESC
LIMIT 5;

-- Check sale items
SELECT si.*, p.product_name
FROM sale_items si
JOIN products p ON si.product_id = p.id
WHERE sale_id = <your_sale_id>;

-- Check cart is empty
SELECT * FROM cart_items
WHERE customer_id = '<your_customer_id>';
```

## Next Steps (To Be Implemented)

- Order tracking for customers
- Biller interface for packing orders
- Order status updates
- Email/SMS notifications
- Payment gateway integration (Stripe/Razorpay)

## Notes

- Currently shows "Payment Successful" alert immediately
- No actual payment processing yet (marked as ONLINE/paid)
- Cart automatically clears after successful checkout
- Order appears in billers' "Online Orders" tab for processing
