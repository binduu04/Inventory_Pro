from flask import Blueprint, request, jsonify
from config.supabase_config import get_supabase_client_with_token
from utils.auth import verify_token, require_role, get_authenticated_client

cart_bp = Blueprint('cart', __name__)

#(all these not there from line 308 its there)
# Get cart items for logged-in customer (all these not there from line 308 its there)
@cart_bp.route('/', methods=['GET'])
@verify_token
@require_role(['customer'])
def get_cart():
    try:
        supabase = get_authenticated_client()
        customer_id = request.user_id
        
        # Fetch cart items with product details
        response = supabase.table('cart_items')\
            .select('*, products(*)')\
            .eq('customer_id', customer_id)\
            .execute()
        
        cart_items = response.data
        
        # Format response
        formatted_items = []
        for item in cart_items:
            product = item.get('products', {})
            formatted_items.append({
                'cart_item_id': item['cart_item_id'],
                'id': product.get('id'),  # product_id
                'product_name': product.get('product_name'),
                'category': product.get('category'),
                'selling_price': float(product.get('selling_price', 0)),
                'festival_discount_percent': product.get('festival_discount_percent'),
                'flash_sale_discount_percent': product.get('flash_sale_discount_percent'),
                'image_url': product.get('image_url'),
                'stock_quantity': product.get('stock_quantity'),
                'quantity': item['quantity'],
                'added_at': item['added_at']
            })
        
        return jsonify({
            'success': True,
            'cart_items': formatted_items
        }), 200
        
    except Exception as e:
        print(f"Error fetching cart: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Add item to cart
@cart_bp.route('/add', methods=['POST'])
@verify_token
@require_role(['customer'])
def add_to_cart():
    try:
        supabase = get_authenticated_client()
        customer_id = request.user_id
        data = request.get_json()
        
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        print(f"Adding to cart - Customer: {customer_id}, Product: {product_id}, Qty: {quantity}")
        
        if not product_id:
            return jsonify({'error': 'Product ID is required'}), 400
        
        # Check if item already exists in cart
        existing = supabase.table('cart_items')\
            .select('*')\
            .eq('customer_id', customer_id)\
            .eq('product_id', product_id)\
            .execute()
        
        print(f"Existing cart items: {existing.data}")
        
        if existing.data:
            # Update quantity
            new_quantity = existing.data[0]['quantity'] + quantity
            print(f"Updating existing item to quantity: {new_quantity}")
            response = supabase.table('cart_items')\
                .update({'quantity': new_quantity})\
                .eq('cart_item_id', existing.data[0]['cart_item_id'])\
                .execute()
            print(f"Update response: {response.data}")
        else:
            # Insert new item
            print(f"Inserting new item")
            response = supabase.table('cart_items')\
                .insert({
                    'customer_id': customer_id,
                    'product_id': product_id,
                    'quantity': quantity
                })\
                .execute()
            print(f"Insert response: {response.data}")
        
        return jsonify({
            'success': True,
            'message': 'Item added to cart'
        }), 200
        
    except Exception as e:
        print(f"Error adding to cart: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# Update cart item quantity
@cart_bp.route('/update/<int:cart_item_id>', methods=['PUT'])
@verify_token
@require_role(['customer'])
def update_cart_item(cart_item_id):
    try:
        supabase = get_authenticated_client()
        customer_id = request.user_id
        data = request.get_json()
        
        quantity = data.get('quantity')
        
        if quantity is None or quantity < 0:
            return jsonify({'error': 'Valid quantity is required'}), 400
        
        if quantity == 0:
            # Delete item if quantity is 0
            response = supabase.table('cart_items')\
                .delete()\
                .eq('cart_item_id', cart_item_id)\
                .eq('customer_id', customer_id)\
                .execute()
        else:
            # Update quantity
            response = supabase.table('cart_items')\
                .update({'quantity': quantity})\
                .eq('cart_item_id', cart_item_id)\
                .eq('customer_id', customer_id)\
                .execute()
        
        return jsonify({
            'success': True,
            'message': 'Cart updated'
        }), 200
        
    except Exception as e:
        print(f"Error updating cart: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Remove item from cart
@cart_bp.route('/remove/<int:cart_item_id>', methods=['DELETE'])
@verify_token
@require_role(['customer'])
def remove_from_cart(cart_item_id):
    try:
        supabase = get_authenticated_client()
        customer_id = request.user_id
        
        response = supabase.table('cart_items')\
            .delete()\
            .eq('cart_item_id', cart_item_id)\
            .eq('customer_id', customer_id)\
            .execute()
        
        return jsonify({
            'success': True,
            'message': 'Item removed from cart'
        }), 200
        
    except Exception as e:
        print(f"Error removing from cart: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Clear entire cart
@cart_bp.route('/clear', methods=['DELETE'])
@verify_token
@require_role(['customer'])
def clear_cart():
    try:
        supabase = get_authenticated_client()
        customer_id = request.user_id
        
        response = supabase.table('cart_items')\
            .delete()\
            .eq('customer_id', customer_id)\
            .execute()
        
        return jsonify({
            'success': True,
            'message': 'Cart cleared'
        }), 200
        
    except Exception as e:
        print(f"Error clearing cart: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Checkout - Create online order
@cart_bp.route('/checkout', methods=['POST'])
@verify_token
@require_role(['customer'])
def checkout():
    try:
        supabase = get_authenticated_client()
        customer_id = request.user_id
        
        # Get customer profile
        profile_response = supabase.table('profiles')\
            .select('*')\
            .eq('id', customer_id)\
            .single()\
            .execute()
        
        customer = profile_response.data
        
        # Get cart items with product details
        cart_response = supabase.table('cart_items')\
            .select('*, products(*)')\
            .eq('customer_id', customer_id)\
            .execute()
        
        cart_items = cart_response.data
        
        if not cart_items:
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Calculate total
        total_amount = 0
        sale_items = []
        
        for item in cart_items:
            product = item['products']
            
            # Calculate discounted price
            selling_price = float(product['selling_price'])
            discount_percent = product.get('festival_discount_percent') or product.get('flash_sale_discount_percent') or 0
            
            if discount_percent > 0:
                unit_price = selling_price * (1 - discount_percent / 100)
            else:
                unit_price = selling_price
            
            quantity = item['quantity']
            subtotal = unit_price * quantity
            total_amount += subtotal
            
            sale_items.append({
                'product_id': product['id'],
                'quantity': quantity,
                'unit_price': round(unit_price, 2),
                'subtotal': round(subtotal, 2)
            })
        
        # Create sale record
        sale_data = {
            'sale_type': 'ONLINE',
            'customer_id': customer_id,
            'customer_name': customer.get('full_name'),
            'customer_phone': customer.get('phone'),
            'total_amount': round(total_amount, 2),
            'payment_method': 'ONLINE',
            'order_status': 'paid'
        }
        
        sale_response = supabase.table('sales')\
            .insert(sale_data)\
            .execute()
        
        sale_id = sale_response.data[0]['sale_id']
        
        # Insert sale items
        for sale_item in sale_items:
            sale_item['sale_id'] = sale_id
        
        supabase.table('sale_items')\
            .insert(sale_items)\
            .execute()
        
        # Clear cart after successful checkout
        supabase.table('cart_items')\
            .delete()\
            .eq('customer_id', customer_id)\
            .execute()
        
        return jsonify({
            'success': True,
            'message': 'Order placed successfully',
            'sale_id': sale_id,
            'total_amount': round(total_amount, 2)
        }), 200
        
    except Exception as e:
        print(f"Error during checkout: {str(e)}")
        return jsonify({'error': str(e)}), 500
    









#from here its there....


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
            
            # Calculate current price with active discounts
            selling_price = float(product['selling_price'])
            discount_percent = product.get('festival_discount_percent') or product.get('flash_sale_discount_percent') or 0
            
            if discount_percent > 0:
                unit_price = selling_price * (1 - discount_percent / 100)
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
                'discount_percent': discount_percent
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


# Confirm Payment - Actually creates the sale and updates stock
@cart_bp.route('/confirm-payment', methods=['POST'])
@verify_token
@require_role(['customer'])
def confirm_payment():
    try:
        # Use customer's token for RLS policies
        customer_token = request.access_token
        supabase = get_supabase_client_with_token(customer_token)
        customer_id = request.user_id
        data = request.get_json()
        
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
        
        # Get customer profile
        profile_response = supabase.table('profiles')\
            .select('*')\
            .eq('id', customer_id)\
            .single()\
            .execute()
        
        customer = profile_response.data
        
        # Re-validate all items before creating order (防止并发问题)
        validated_items = []
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
                return jsonify({'error': f"Product {product_id} not found"}), 400
            
            product = product_response.data
            
            # Final stock check
            if product['current_stock'] < requested_qty:
                return jsonify({
                    'error': f"{product['product_name']}: Insufficient stock. Only {product['current_stock']} units available"
                }), 400
            
            # Calculate current price with active discounts
            selling_price = float(product['selling_price'])
            discount_percent = product.get('festival_discount_percent') or product.get('flash_sale_discount_percent') or 0
            
            if discount_percent > 0:
                unit_price = selling_price * (1 - discount_percent / 100)
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
        
        # Create sale record
        sale_data = {
            'sale_type': 'ONLINE',
            'customer_id': customer_id,
            'customer_name': customer.get('full_name'),
            'customer_phone': customer.get('phone'),
            'total_amount': round(total_amount, 2),
            'payment_method': 'ONLINE',
            'order_status': 'paid'
        }
        
        sale_response = supabase.table('sales')\
            .insert(sale_data)\
            .execute()
        
        sale_id = sale_response.data[0]['sale_id']
        
        # Insert sale items
        sale_items = []
        for item in validated_items:
            sale_items.append({
                'sale_id': sale_id,
                'product_id': item['product_id'],
                'quantity': item['quantity'],
                'unit_price': item['unit_price'],
                'subtotal': item['subtotal']
            })
        
        supabase.table('sale_items')\
            .insert(sale_items)\
            .execute()
        
        # Update product stock using admin client (customers don't have UPDATE permission on products)
        from config.supabase_config import get_supabase_admin_client
        admin_supabase = get_supabase_admin_client()
        
        for item in validated_items:
            # Fetch current stock
            current = admin_supabase.table('products')\
                .select('current_stock')\
                .eq('id', item['product_id'])\
                .single()\
                .execute()
            
            new_stock = current.data['current_stock'] - item['quantity']
            
            # Update stock
            admin_supabase.table('products')\
                .update({'current_stock': new_stock})\
                .eq('id', item['product_id'])\
                .execute()
        
        return jsonify({
            'success': True,
            'message': 'Payment successful! Order placed.',
            'sale_id': sale_id,
            'total': round(total_amount, 2),
            'items_ordered': len(validated_items)
        }), 200
        
    except Exception as e:
        print(f"Error during payment confirmation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
