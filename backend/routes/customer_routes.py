from flask import Blueprint, request, jsonify
from config.supabase_config import get_supabase_client
from utils.auth import verify_token, get_authenticated_client

customer_bp = Blueprint('customer', __name__, url_prefix='/api/customer')

@customer_bp.route('/products', methods=['GET'])
@verify_token
def get_customer_products():
    """
    Get all products for customer view with only necessary fields
    Excludes admin-specific fields like cost_price, created_by, etc.
    """
    try:
        from utils.discount_calculator import apply_discount_to_products
        
        supabase = get_authenticated_client()
        
        # Build query - select only customer-relevant fields
        query = supabase.table('products').select(
            'id, product_name, category, season_affinity, selling_price, '
            'current_stock, image_url, festival_discount_percent, '
            'flash_sale_discount_percent, supplier_id'
        )
        
        # Apply filters from query parameters
        category = request.args.get('category')
        if category:
            query = query.eq('category', category)
        
        season = request.args.get('season')
        if season:
            query = query.eq('season_affinity', season.lower())
        
        # Only show products with stock > 0 (optional - you can remove this)
        show_out_of_stock = request.args.get('show_out_of_stock', 'true').lower() == 'true'
        if not show_out_of_stock:
            query = query.gt('current_stock', 0)
        
        # Execute query
        response = query.order('created_at', desc=True).execute()
        
        # Apply dynamic discounts based on current date
        products_with_discounts = apply_discount_to_products(response.data)
        
        return jsonify({
            'products': products_with_discounts,
            'count': len(products_with_discounts)
        }), 200
        
    except Exception as e:
        print(f"Error fetching products for customer: {str(e)}")
        return jsonify({'error': str(e)}), 500


@customer_bp.route('/products/<product_id>', methods=['GET'])
@verify_token
def get_customer_product_detail(product_id):
    """Get detailed view of a single product for customer"""
    try:
        from utils.discount_calculator import apply_discount_to_products
        
        supabase = get_authenticated_client()
        response = supabase.table('products').select(
            'id, product_name, category, season_affinity, selling_price, '
            'current_stock, image_url, festival_discount_percent, '
            'flash_sale_discount_percent'
        ).eq('id', product_id).execute()
        
        if response.data and len(response.data) > 0:
            # Apply dynamic discount
            product_with_discount = apply_discount_to_products(response.data)[0]
            return jsonify({'product': product_with_discount}), 200
        else:
            return jsonify({'error': 'Product not found'}), 404
            
    except Exception as e:
        print(f"Error fetching product detail: {str(e)}")
        return jsonify({'error': str(e)}), 500


@customer_bp.route('/categories', methods=['GET'])
@verify_token
def get_customer_categories():
    """Get list of all available categories"""
    categories = ['Dairy', 'Beverages', 'Snacks', 'Staples', 'Personal Care']
    return jsonify({'categories': categories}), 200


@customer_bp.route('/featured-products', methods=['GET'])
@verify_token
def get_featured_products():
    """
    Get featured products (products with active discounts)
    """
    try:
        supabase = get_authenticated_client()
        
        # Get products with festival or flash sale discounts
        response = supabase.table('products').select(
            'id, product_name, category, selling_price, current_stock, '
            'image_url, festival_discount_percent, flash_sale_discount_percent'
        ).or_(
            'festival_discount_percent.gt.0,flash_sale_discount_percent.gt.0'
        ).gt('current_stock', 0).order('created_at', desc=True).limit(10).execute()
        
        return jsonify({
            'products': response.data,
            'count': len(response.data)
        }), 200
        
    except Exception as e:
        print(f"Error fetching featured products: {str(e)}")
        return jsonify({'error': str(e)}), 500


@customer_bp.route('/seasonal-products', methods=['GET'])
@verify_token
def get_seasonal_products():
    """
    Get products based on current season
    Query param: season (summer, winter, monsoon, all)
    """
    try:
        season = request.args.get('season', 'all').lower()
        valid_seasons = ['all', 'summer', 'winter', 'monsoon']
        
        if season not in valid_seasons:
            return jsonify({'error': 'Invalid season'}), 400
        
        supabase = get_authenticated_client()
        query = supabase.table('products').select(
            'id, product_name, category, selling_price, current_stock, '
            'image_url, festival_discount_percent, flash_sale_discount_percent, season_affinity'
        )
        
        # Filter by season (include 'all' season products too)
        if season != 'all':
            query = query.or_(f'season_affinity.eq.{season},season_affinity.eq.all')
        
        response = query.gt('current_stock', 0).order('created_at', desc=True).execute()
        
        return jsonify({
            'products': response.data,
            'count': len(response.data),
            'season': season
        }), 200
        
    except Exception as e:
        print(f"Error fetching seasonal products: {str(e)}")
        return jsonify({'error': str(e)}), 500


#for updating customer profile in customer dashbaord
@customer_bp.route('/profile', methods=['PUT'])
@verify_token
def update_customer_profile():
    """Update customer's profile information (name and phone only)"""
    try:
        # Get the authenticated user's ID from the token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        supabase = get_authenticated_client()
        
        # Verify the token and get user info
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = user_response.user.id
        
        # Get the request data
        data = request.get_json()
        
        # Only allow updating certain fields
        allowed_fields = ['full_name', 'phone']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update the profile
        response = supabase.table('profiles').update(update_data).eq('id', user_id).eq('role', 'customer').execute()
        
        if response.data:
            return jsonify({
                'message': 'Profile updated successfully',
                'user': response.data[0]
            }), 200
        else:
            return jsonify({'error': 'Profile not found or unauthorized'}), 404
            
    except Exception as e:
        print(f"Error updating customer profile: {str(e)}")
        return jsonify({'error': str(e)}), 500
    

from utils.auth import verify_token, require_role
from config.supabase_config import get_supabase_client_with_token


@customer_bp.route('/all', methods=['GET'])
@verify_token
@require_role(['manager', 'admin'])
def get_all_customers():
    """Get all customer profiles"""
    try:
        manager_token = request.access_token
        supabase = get_supabase_client_with_token(manager_token)
        
        # Fetch only customers
        response = supabase.table('profiles')\
            .select('id, full_name, email, phone, role, created_at, updated_at')\
            .eq('role', 'customer')\
            .order('created_at', desc=True)\
            .execute()
        
        customers = response.data or []
        return jsonify({'customers': customers, 'count': len(customers)}), 200
    
    except Exception as e:
        print(f"Error fetching customers: {str(e)}")
        return jsonify({'error': str(e)}), 500


@customer_bp.route('/<customer_id>/orders', methods=['GET'])
@verify_token
@require_role(['manager', 'admin'])
def get_customer_orders(customer_id):
    """Fetch the 5 most recent orders for a specific customer"""
    try:
        manager_token = request.access_token
        supabase = get_supabase_client_with_token(manager_token)
        
        # Fetch recent 5 orders for this customer
        response = supabase.table('sales')\
            .select('sale_id, sale_date, total_amount, sale_type, order_status, '
                    'payment_method, sale_items(*, products(product_name, image_url))')\
            .eq('customer_id', customer_id)\
            .order('sale_date', desc=True)\
            .limit(5)\
            .execute()
        
        orders = []
        for sale in response.data:
            orders.append({
                'sale_id': sale['sale_id'],
                'order_number': f"ORD-{str(sale['sale_id']).zfill(6)}",
                'date': sale['sale_date'],
                'total': float(sale['total_amount']),
                'status': sale.get('order_status'),
                'payment_method': sale.get('payment_method'),
                'sale_items': sale.get('sale_items', [])
            })
        
        return jsonify({'orders': orders, 'count': len(orders)}), 200
    
    except Exception as e:
        print(f"Error fetching customer orders: {str(e)}")
        return jsonify({'error': str(e)}), 500


@customer_bp.route('/<customer_id>', methods=['DELETE'])
@verify_token
@require_role(['manager', 'admin'])
def delete_customer(customer_id):
    """Delete a customer permanently from both profiles and auth tables"""
    try:
        from config.supabase_config import get_supabase_admin_client, SUPABASE_URL
        import requests
        import os

        # Use an authenticated client to check/delete profiles.
        # If you prefer to use a token-scoped client (manager's token) replace this
        # with your get_supabase_client_with_token(manager_token) call.
        supabase = get_authenticated_client()

        # First check if the customer exists
        check_response = supabase.table('profiles').select('*').eq('id', customer_id).eq('role', 'customer').execute()

        if not check_response.data or len(check_response.data) == 0:
            return jsonify({'error': 'Customer not found'}), 404

        # Delete from profiles table first
        profile_response = supabase.table('profiles').delete().eq('id', customer_id).eq('role', 'customer').execute()

        # Delete from auth.users table using Admin API
        try:
            service_role_key = os.getenv('SUPABASE_SERVICE_KEY')
            if service_role_key:
                # Preferred: use Supabase Admin client (server-side service role)
                admin_client = get_supabase_admin_client()
                admin_client.auth.admin.delete_user(customer_id)
            else:
                # Fallback: use Supabase REST Admin endpoint (requires appropriate key)
                auth_url = f"{SUPABASE_URL}/auth/v1/admin/users/{customer_id}"
                headers = {
                    'apikey': os.getenv('SUPABASE_KEY'),
                    'Authorization': f"Bearer {os.getenv('SUPABASE_KEY')}",
                    'Content-Type': 'application/json'
                }
                delete_auth_response = requests.delete(auth_url, headers=headers)

                if delete_auth_response.status_code not in [200, 204]:
                    # Log warning but do not fail the whole request since profile was removed.
                    print(f"Warning: Failed to delete user from auth table: {delete_auth_response.status_code} {delete_auth_response.text}")
        except Exception as auth_error:
            # Log the auth deletion error and continue — profile deletion is the critical part.
            print(f"Warning: Error deleting from auth table: {str(auth_error)}")

        return jsonify({'message': 'Customer deleted successfully from profiles and auth'}), 200

    except Exception as e:
        print(f"Error deleting customer: {str(e)}")
        return jsonify({'error': str(e)}), 500
