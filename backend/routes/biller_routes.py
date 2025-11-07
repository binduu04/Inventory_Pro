from flask import Blueprint, request, jsonify
from config.supabase_config import get_supabase_client
from utils.auth import verify_token, require_role, get_authenticated_client

biller_bp = Blueprint('billers', __name__, url_prefix='/api/billers')

#product routes for biller view


@biller_bp.route('/check-auth', methods=['GET'])
@verify_token
def check_auth():
    """Debug endpoint to check authentication and role"""
    return jsonify({
        'authenticated': True,
        'user_id': request.user_id,
        'email': request.user_email,
        'role': request.user_role,
        'user_metadata': request.user.user_metadata if hasattr(request, 'user') else {}
    }), 200


@biller_bp.route('/products', methods=['GET'])
@verify_token
@require_role(['biller', 'manager'])
def get_products_for_billing():
    """Get all products for biller to create orders"""
    try:
        supabase = get_authenticated_client()
        
        # Get category filter from query params
        category = request.args.get('category')
        
        query = supabase.table('products').select(
            'id, product_name, category, selling_price, current_stock, image_url, '
            'festival_discount_percent, flash_sale_discount_percent'
        )
        
        # Apply category filter if provided
        if category and category != 'all':
            query = query.eq('category', category)
        
        # Only show products with stock
        query = query.gt('current_stock', 0)
        
        response = query.order('product_name').execute()
        
        # Calculate effective discount and final price for each product
        products = []
        for product in response.data:
            festival_discount = product.get('festival_discount_percent') or 0
            flash_discount = product.get('flash_sale_discount_percent') or 0
            
            # Use the higher discount
            discount_percent = max(festival_discount, flash_discount)
            
            selling_price = product['selling_price']
            discount_amount = (selling_price * discount_percent) / 100
            final_price = selling_price - discount_amount
            
            products.append({
                **product,
                'discount_percent': discount_percent,
                'discount_amount': discount_amount,
                'final_price': final_price
            })
        
        return jsonify({'products': products}), 200
        
    except Exception as e:
        print(f"Error fetching products for biller: {str(e)}")
        return jsonify({'error': str(e)}), 500


@biller_bp.route('/categories', methods=['GET'])
@verify_token
@require_role(['biller', 'manager'])
def get_categories_for_billing():
    """Get all unique categories for filtering"""
    try:
        supabase = get_authenticated_client()
        
        response = supabase.table('products').select('category').execute()
        
        # Get unique categories
        categories = list(set([p['category'] for p in response.data if p.get('category')]))
        categories.sort()
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        print(f"Error fetching categories: {str(e)}")
        return jsonify({'error': str(e)}), 500
    



#biller _routes..


@biller_bp.route('/', methods=['POST'])
@verify_token
@require_role('manager')
def add_biller():
    """Add a new biller - creates a user account with biller role"""
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['email', 'password', 'full_name', 'phone']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Email validation
        if '@' not in data['email']:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Password validation
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Create user account with biller role
        supabase = get_supabase_client()
        
        # Sign up the biller
        auth_response = supabase.auth.sign_up({
            'email': data['email'],
            'password': data['password'],
            'options': {
                'data': {
                    'full_name': data['full_name'],
                    'phone': data['phone'],
                    'role': 'biller'
                }
            }
        })
        
        if auth_response.user:
            # Fetch the created profile
            profile_response = supabase.table('profiles').select('*').eq('id', auth_response.user.id).execute()
            
            if profile_response.data and len(profile_response.data) > 0:
                return jsonify({
                    'message': 'Biller added successfully',
                    'biller': profile_response.data[0]
                }), 201
            else:
                return jsonify({
                    'message': 'Biller account created but profile not found',
                    'biller': {
                        'id': auth_response.user.id,
                        'email': data['email'],
                        'full_name': data['full_name'],
                        'phone': data['phone'],
                        'role': 'biller'
                    }
                }), 201
        else:
            return jsonify({'error': 'Failed to create biller account'}), 500
            
    except Exception as e:
        error_message = str(e)
        print(f"Error adding biller: {error_message}")
        
        # Handle duplicate email error
        if 'already registered' in error_message.lower() or 'duplicate' in error_message.lower():
            return jsonify({'error': 'Email already registered'}), 400
        
        return jsonify({'error': error_message}), 500

@biller_bp.route('/', methods=['GET'])
@verify_token
@require_role('manager')
def get_billers():
    """Get all billers"""
    try:
        supabase = get_authenticated_client()
        response = supabase.table('profiles').select('*').eq('role', 'biller').order('created_at', desc=True).execute()
        
        return jsonify({
            'billers': response.data,
            'count': len(response.data)
        }), 200
        
    except Exception as e:
        print(f"Error fetching billers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@biller_bp.route('/<biller_id>', methods=['GET'])
@verify_token
@require_role('manager')
def get_biller(biller_id):
    """Get a specific biller"""
    try:
        supabase = get_authenticated_client()
        response = supabase.table('profiles').select('*').eq('id', biller_id).eq('role', 'biller').execute()
        
        if response.data and len(response.data) > 0:
            return jsonify({'biller': response.data[0]}), 200
        else:
            return jsonify({'error': 'Biller not found'}), 404
            
    except Exception as e:
        print(f"Error fetching biller: {str(e)}")
        return jsonify({'error': str(e)}), 500

@biller_bp.route('/<biller_id>', methods=['PUT'])
@verify_token
@require_role('manager')
def update_biller(biller_id):
    """Update a biller's profile information"""
    try:
        data = request.get_json()
        
        # Only allow updating certain fields
        allowed_fields = ['full_name', 'phone']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        supabase = get_authenticated_client()
        response = supabase.table('profiles').update(update_data).eq('id', biller_id).eq('role', 'biller').execute()
        
        if response.data:
            return jsonify({
                'message': 'Biller updated successfully',
                'biller': response.data[0]
            }), 200
        else:
            return jsonify({'error': 'Biller not found'}), 404
            
    except Exception as e:
        print(f"Error updating biller: {str(e)}")
        return jsonify({'error': str(e)}), 500

@biller_bp.route('/<biller_id>', methods=['DELETE'])
@verify_token
@require_role('manager')
def delete_biller(biller_id):
    """Delete a biller permanently from both profiles and auth tables"""
    try:
        from config.supabase_config import get_supabase_admin_client, SUPABASE_URL
        import requests
        import os
        
        supabase = get_authenticated_client()
        
        # First check if the biller exists
        check_response = supabase.table('profiles').select('*').eq('id', biller_id).eq('role', 'biller').execute()
        
        if not check_response.data or len(check_response.data) == 0:
            return jsonify({'error': 'Biller not found'}), 404
        
        # Delete from profiles table first
        profile_response = supabase.table('profiles').delete().eq('id', biller_id).eq('role', 'biller').execute()
        
        # Delete from auth.users table using Admin API
        try:
            service_role_key = os.getenv('SUPABASE_SERVICE_KEY')
            if service_role_key:
                # Use Supabase Admin API to delete user
                admin_client = get_supabase_admin_client()
                admin_client.auth.admin.delete_user(biller_id)
            else:
                # Fallback: Use REST API directly
                auth_url = f"{SUPABASE_URL}/auth/v1/admin/users/{biller_id}"
                headers = {
                    'apikey': os.getenv('SUPABASE_KEY'),
                    'Authorization': f"Bearer {os.getenv('SUPABASE_KEY')}",
                    'Content-Type': 'application/json'
                }
                delete_auth_response = requests.delete(auth_url, headers=headers)
                
                if delete_auth_response.status_code not in [200, 204]:
                    print(f"Warning: Failed to delete user from auth table: {delete_auth_response.text}")
        except Exception as auth_error:
            print(f"Warning: Error deleting from auth table: {str(auth_error)}")
            # Continue anyway - profile is deleted which is most important
        
        return jsonify({'message': 'Biller deleted successfully from profiles and auth'}), 200
            
    except Exception as e:
        print(f"Error deleting biller: {str(e)}")
        return jsonify({'error': str(e)}), 500


from datetime import datetime

@biller_bp.route('/sales', methods=['POST'])
@verify_token
@require_role(['biller', 'manager'])
def create_offline_sale():
    """
    Create a new offline sale and its sale items.
    This will insert one row in 'sales' and multiple rows in 'sale_items'.
    """
    try:
        data = request.get_json()

        # Basic validation
        required_fields = ['customer_name', 'customer_phone', 'items']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400

        if not isinstance(data['items'], list) or len(data['items']) == 0:
            return jsonify({'error': 'At least one item is required'}), 400

        supabase = get_authenticated_client()

        # 1️⃣ Insert into sales table
        sale_data = {
            'sale_date': datetime.utcnow().isoformat(),
            'sale_type': 'OFFLINE',
            'customer_name': data['customer_name'],
            'customer_phone': data['customer_phone'],
            'created_by_biller_id': request.user_id,
            'packed_by_biller_id': request.user_id,
            'completed_by_biller_id': request.user_id,
            'total_amount': data.get('total_amount', 0),
            'payment_method': data.get('payment_method', 'CASH'),
        }

        sale_insert = supabase.table('sales').insert(sale_data).execute()

        if not sale_insert.data:
            return jsonify({'error': 'Failed to create sale record'}), 500

        sale_id = sale_insert.data[0]['sale_id']

        # 2️⃣ Insert into sale_items table
        sale_items_data = []
        for item in data['items']:
            product_id = item.get('id')
            quantity = item.get('quantity')
            price = item.get('final_price') or item.get('selling_price') or item.get('price')
            subtotal = round(price * quantity, 2)

            if not product_id or not quantity:
                return jsonify({'error': 'Invalid product in items list'}), 400

            sale_items_data.append({
                'sale_id': sale_id,
                'product_id': product_id,
                'quantity': quantity,
                'unit_price': price,
                'subtotal': subtotal,
            })

        if sale_items_data:
            supabase.table('sale_items').insert(sale_items_data).execute()

        return jsonify({
            'message': 'Sale and items added successfully',
            'sale_id': sale_id,
            'total_items': len(sale_items_data)
        }), 201

    except Exception as e:
        print(f"Error creating sale: {str(e)}")
        return jsonify({'error': str(e)}), 500


@biller_bp.route('/sales', methods=['GET'])
@verify_token
@require_role(['biller', 'manager'])
def get_sales_by_biller():
    """
    Fetch all sales created by the logged-in biller, sorted by date (newest first).
    """
    try:
        supabase = get_authenticated_client()

        response = (
            supabase.table('sales')
            .select('*')
            .eq('created_by_biller_id', request.user_id)
            .order('sale_date', desc=True)
            .execute()
        )

        sales = response.data or []

        return jsonify({'sales': sales, 'count': len(sales)}), 200

    except Exception as e:
        print(f"Error fetching sales for biller: {str(e)}")
        return jsonify({'error': str(e)}), 500
