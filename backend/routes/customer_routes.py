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
        
        return jsonify({
            'products': response.data,
            'count': len(response.data)
        }), 200
        
    except Exception as e:
        print(f"Error fetching products for customer: {str(e)}")
        return jsonify({'error': str(e)}), 500


@customer_bp.route('/products/<product_id>', methods=['GET'])
@verify_token
def get_customer_product_detail(product_id):
    """Get detailed view of a single product for customer"""
    try:
        supabase = get_authenticated_client()
        response = supabase.table('products').select(
            'id, product_name, category, season_affinity, selling_price, '
            'current_stock, image_url, festival_discount_percent, '
            'flash_sale_discount_percent'
        ).eq('id', product_id).execute()
        
        if response.data and len(response.data) > 0:
            return jsonify({'product': response.data[0]}), 200
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