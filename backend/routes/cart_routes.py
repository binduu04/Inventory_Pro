from flask import Blueprint, request, jsonify
from config.supabase_config import get_supabase_client_with_token
from utils.auth import verify_token, require_role, get_authenticated_client

cart_bp = Blueprint('cart', __name__)

# Validate Cart - Only validates stock, prices, and discounts (no order creation)
@cart_bp.route('/validate', methods=['POST'])
@verify_token
@require_role(['customer'])
def validate_cart():
    try:
        # Use customer's token for RLS policies
        customer_token = request.access_token
        supabase = get_supabase_client_with_token(customer_token)
        customer_id = request.user_id
        data = request.get_json()
        
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Validate all items and get current prices/stock
        validated_items = []
        validation_errors = []
        total_amount = 0
        
        for item in items:
            product_id = item.get('product_id')
            requested_qty = item.get('quantity', 1)
            
            # Fetch current product details
            product_response = supabase.table('products')\
                .select('*')\
                .eq('id', product_id)\
                .single()\
                .execute()
            
            if not product_response.data:
                validation_errors.append(f"Product {product_id} not found")
                continue
            
            product = product_response.data
            
            # Check if product is out of stock
            if product['current_stock'] == 0:
                validation_errors.append(f"{product['product_name']} is out of stock")
                continue
            
            # Check if requested quantity exceeds stock
            if requested_qty > product['current_stock']:
                validation_errors.append(
                    f"{product['product_name']}: Only {product['current_stock']} units available (you requested {requested_qty})"
                )
                # Don't add to valid items if quantity exceeds stock
                continue
            
            # Calculate current price with DYNAMIC discounts based on date
            from utils.discount_calculator import get_discount_for_product
            
            selling_price = float(product['selling_price'])
            category = product.get('category', '')
            festival_discount = product.get('festival_discount_percent', 0) or 0
            flash_sale_discount = product.get('flash_sale_discount_percent', 0) or 0
            
            # Get discount only if today matches the discount rules
            active_discount = get_discount_for_product(category, festival_discount, flash_sale_discount)
            
            if active_discount > 0:
                unit_price = selling_price * (1 - active_discount / 100)
            else:
                unit_price = selling_price
            
            subtotal = unit_price * requested_qty
            total_amount += subtotal
            
            validated_items.append({
                'product_id': product['id'],
                'product_name': product['product_name'],
                'quantity': requested_qty,
                'unit_price': round(unit_price, 2),
                'subtotal': round(subtotal, 2),
                'discount_percent': active_discount
            })
        
        # If there are validation errors, return them with valid items
        if validation_errors:
            return jsonify({
                'hasErrors': True,
                'errors': validation_errors,
                'validItems': validated_items,
                'total': round(total_amount, 2) if validated_items else 0
            }), 200
        
        if not validated_items:
            return jsonify({
                'hasErrors': True,
                'errors': ['No valid items to checkout. All items have issues.'],
                'validItems': [],
                'total': 0
            }), 200
        
        # All items valid - return success
        return jsonify({
            'hasErrors': False,
            'validItems': validated_items,
            'total': round(total_amount, 2)
        }), 200
        
    except Exception as e:
        print(f"Error during validation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


import stripe
from flask import request, jsonify
from datetime import datetime
from config.supabase_config import get_supabase_client_with_token, get_supabase_admin_client
from utils.discount_calculator import get_discount_for_product
# from middleware.auth import verify_token, require_role

from dotenv import load_dotenv
import os

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")  # ✅ loads from .env

# ✅ STEP 1: Create Payment Intent (called by Payment.jsx initially)
@cart_bp.route('/create-payment-intent', methods=['POST'])
@verify_token
@require_role(['customer'])
def create_payment_intent():
    try:
        data = request.get_json()
        total_amount = data.get('total_amount')
        if not total_amount:
            return jsonify({"error": "Missing total_amount"}), 400

        intent = stripe.PaymentIntent.create(
            amount=int(round(total_amount * 100)),
            currency="usd",
            automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
        )

        return jsonify({"clientSecret": intent.client_secret}), 200
    except Exception as e:
        print(f"Stripe error: {str(e)}")
        return jsonify({"error": str(e)}), 500



# ✅ STEP 2: Confirm Payment and Create Sale Record (called after frontend succeeds)
@cart_bp.route('/confirm-payment', methods=['POST'])
@verify_token
@require_role(['customer'])
def confirm_payment():
    try:
        customer_token = request.access_token
        supabase = get_supabase_client_with_token(customer_token)
        customer_id = request.user_id
        data = request.get_json()
        
        items = data.get('items', [])
        stripe_payment_id = data.get('stripe_payment_id')

        if not items:
            return jsonify({'error': 'No items provided'}), 400
        if not stripe_payment_id:
            return jsonify({'error': 'Missing Stripe payment ID'}), 400
        
        # ✅ Step 1: Verify payment with Stripe
        payment_intent = stripe.PaymentIntent.retrieve(stripe_payment_id)

        if payment_intent.status != "succeeded":
            return jsonify({
                'error': f"Payment not successful. Current status: {payment_intent.status}"
            }), 400

        # ✅ Step 2: Fetch customer profile
        profile_response = supabase.table('profiles').select('*').eq('id', customer_id).single().execute()
        customer = profile_response.data

        # ✅ Step 3: Revalidate and compute totals
        validated_items = []
        total_amount = 0

        for item in items:
            product_id = item.get('product_id')
            requested_qty = item.get('quantity', 1)

            product_response = supabase.table('products').select('*').eq('id', product_id).single().execute()
            if not product_response.data:
                return jsonify({'error': f"Product {product_id} not found"}), 400

            product = product_response.data

            if product['current_stock'] < requested_qty:
                return jsonify({
                    'error': f"{product['product_name']}: Insufficient stock. Only {product['current_stock']} available"
                }), 400

            selling_price = float(product['selling_price'])
            category = product.get('category', '')
            festival_discount = product.get('festival_discount_percent', 0) or 0
            flash_sale_discount = product.get('flash_sale_discount_percent', 0) or 0
            active_discount = get_discount_for_product(category, festival_discount, flash_sale_discount)

            if active_discount > 0:
                unit_price = selling_price * (1 - active_discount / 100)
            else:
                unit_price = selling_price

            subtotal = unit_price * requested_qty
            total_amount += subtotal

            validated_items.append({
                'product_id': product['id'],
                'product_name': product['product_name'],
                'quantity': requested_qty,
                'unit_price': round(unit_price, 2),
                'subtotal': round(subtotal, 2)
            })

        # ✅ Step 4: Create sale record
        sale_data = {
            'sale_type': 'ONLINE',
            'customer_id': customer_id,
            'customer_name': customer.get('full_name'),
            'customer_phone': customer.get('phone'),
            'total_amount': round(total_amount, 2),
            'payment_method': 'ONLINE',
            'order_status': 'paid',
            'stripe_payment_id': stripe_payment_id
        }

        sale_response = supabase.table('sales').insert(sale_data).execute()
        sale_id = sale_response.data[0]['sale_id']

        # ✅ Step 5: Insert sale items
        sale_items = []
        for item in validated_items:
            sale_items.append({
                'sale_id': sale_id,
                'product_id': item['product_id'],
                'quantity': item['quantity'],
                'unit_price': item['unit_price'],
                'subtotal': item['subtotal']
            })
        supabase.table('sale_items').insert(sale_items).execute()

        # ✅ Step 6: Update stock
        admin_supabase = get_supabase_admin_client()
        for item in validated_items:
            current = admin_supabase.table('products').select('current_stock').eq('id', item['product_id']).single().execute()
            new_stock = current.data['current_stock'] - item['quantity']
            admin_supabase.table('products').update({'current_stock': new_stock}).eq('id', item['product_id']).execute()

        return jsonify({
            'success': True,
            'message': 'Payment verified and order created successfully!',
            'sale_id': sale_id,
            'total': round(total_amount, 2),
            'stripe_payment_id': stripe_payment_id,
            'items_ordered': len(validated_items)
        }), 200

    except Exception as e:
        print(f"Error during confirm_payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
