from flask import Blueprint, request, jsonify
from config.supabase_config import get_supabase_client, get_supabase_admin_client
from utils.auth import verify_token, require_role, get_authenticated_client
from decimal import Decimal
from werkzeug.utils import secure_filename
import uuid
import re
import os

product_bp = Blueprint('products', __name__, url_prefix='/api/products')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def delete_image_from_storage(image_url):
    """Delete image from Supabase storage"""
    if not image_url:
        return
    
    try:
        # Extract file path from the public URL
        # URL format: https://{project}.supabase.co/storage/v1/object/public/product-images/{filename}
        match = re.search(r'/product-images/(.+)$', image_url)
        if match:
            file_path = match.group(1)
            supabase_admin = get_supabase_admin_client()
            supabase_admin.storage.from_('product-images').remove([file_path])
            print(f"Deleted image: {file_path}")
    except Exception as e:
        print(f"Error deleting image from storage: {str(e)}")

@product_bp.route('/', methods=['POST'])
@verify_token
@require_role('manager')
def add_product():
    """Add a new product with optional image upload"""
    try:
        # Get form data (not JSON since we're using multipart/form-data)
        data = request.form.to_dict()
        user_id = request.user_id
        
        # Get the image file if present
        image_file = request.files.get('image')
        image_url = None
        
        # Handle image upload to Supabase storage
        if image_file and image_file.filename:
            if not allowed_file(image_file.filename):
                return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, webp, gif'}), 400
            
            try:
                # Generate unique filename
                file_ext = image_file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4()}.{file_ext}"
                
                # Read file bytes
                file_bytes = image_file.read()
                
                # Upload to Supabase storage using ADMIN client (bypasses RLS)
                supabase_admin = get_supabase_admin_client()
                upload_response = supabase_admin.storage.from_('product-images').upload(
                    unique_filename,
                    file_bytes,
                    {'content-type': image_file.content_type}
                )
                
                # Get public URL
                image_url = supabase_admin.storage.from_('product-images').get_public_url(unique_filename)
                print(f"✅ Image uploaded successfully: {image_url}")
                
            except Exception as upload_error:
                print(f"❌ Image upload error: {str(upload_error)}")
                return jsonify({'error': f'Image upload failed: {str(upload_error)}'}), 500
        
        # Validate required fields
        required_fields = ['product_name', 'category', 'supplier_id', 
                          'cost_price', 'selling_price']
        for field in required_fields:
            if field not in data or data[field] == '':
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate category
        valid_categories = ['Dairy', 'Beverages', 'Snacks', 'Staples', 'Personal Care']
        if data['category'] not in valid_categories:
            return jsonify({'error': f'Invalid category. Must be one of: {", ".join(valid_categories)}'}), 400
        
        # Validate season_affinity - convert to lowercase
        valid_seasons = ['all', 'summer', 'winter', 'monsoon']
        season = data.get('season_affinity', 'All').lower()
        if season not in valid_seasons:
            return jsonify({'error': f'Invalid season. Must be one of: {", ".join(valid_seasons)}'}), 400
        
        # Validate prices
        try:
            cost_price = float(data['cost_price'])
            selling_price = float(data['selling_price'])
            if cost_price < 0 or selling_price < 0:
                return jsonify({'error': 'Prices cannot be negative'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid price format'}), 400
        
        # Validate stock values
        current_stock = int(data.get('current_stock', 0))
        
        # Set default values for safety_stock and lead_time_days
        safety_stock = int(data.get('safety_stock', 5))
        lead_time_days = int(data.get('lead_time_days', 1))
        
        if current_stock < 0 or safety_stock < 0 or lead_time_days < 0:
            return jsonify({'error': 'Stock values cannot be negative'}), 400
        
        # Validate discount percentages
        festival_discount = float(data.get('festival_discount_percent', 0))
        flash_sale_discount = float(data.get('flash_sale_discount_percent', 0))
        
        if festival_discount < 0 or festival_discount > 100:
            return jsonify({'error': 'Festival discount must be between 0 and 100'}), 400
        if flash_sale_discount < 0 or flash_sale_discount > 100:
            return jsonify({'error': 'Flash sale discount must be between 0 and 100'}), 400
        
        # Prepare product data
        product_data = {
            'product_name': data['product_name'].strip(),
            'category': data['category'],
            'season_affinity': season,
            'supplier_id': data['supplier_id'],
            'cost_price': cost_price,
            'selling_price': selling_price,
            'current_stock': current_stock,
            'safety_stock': safety_stock,
            'lead_time_days': lead_time_days,
            'is_forecastable': data.get('is_forecastable', 'false').lower() == 'true',
            'image_url': image_url,
            'festival_discount_percent': festival_discount,
            'flash_sale_discount_percent': flash_sale_discount,
            'created_by': user_id
        }
        
        # Insert into database
        supabase = get_authenticated_client()
        response = supabase.table('products').insert(product_data).execute()
        
        if response.data:
            return jsonify({
                'message': 'Product added successfully',
                'product': response.data[0]
            }), 201
        else:
            # If database insert fails, clean up the uploaded image
            if image_url:
                delete_image_from_storage(image_url)
            return jsonify({'error': 'Failed to add product'}), 500
            
    except Exception as e:
        error_message = str(e)
        print(f"Error adding product: {error_message}")
        
        # Handle duplicate product name
        if 'duplicate key' in error_message.lower() or 'unique' in error_message.lower():
            # Clean up uploaded image if product name is duplicate
            if image_url:
                delete_image_from_storage(image_url)
            return jsonify({'error': 'A product with this name already exists'}), 400
        
        return jsonify({'error': error_message}), 500

@product_bp.route('/', methods=['GET'])
@verify_token
def get_products():
    """Get all products with optional filters and dynamic discounts"""
    try:
        from utils.discount_calculator import apply_discount_to_products
        
        supabase = get_authenticated_client()
        
        # Build query
        query = supabase.table('products').select('*')
        
        # Apply filters from query parameters
        category = request.args.get('category')
        if category:
            query = query.eq('category', category)
        
        is_forecastable = request.args.get('is_forecastable')
        if is_forecastable is not None:
            query = query.eq('is_forecastable', is_forecastable.lower() == 'true')
        
        supplier_id = request.args.get('supplier_id')
        if supplier_id:
            query = query.eq('supplier_id', supplier_id)
        
        # Execute query
        response = query.order('created_at', desc=True).execute()
        
        # Apply dynamic discounts based on current date
        products_with_discounts = apply_discount_to_products(response.data)
        
        return jsonify({
            'products': products_with_discounts,
            'count': len(products_with_discounts)
        }), 200
        
    except Exception as e:
        print(f"Error fetching products: {str(e)}")
        return jsonify({'error': str(e)}), 500

@product_bp.route('/<product_id>', methods=['GET'])
@verify_token
def get_product(product_id):
    """Get a specific product"""
    try:
        supabase = get_authenticated_client()
        response = supabase.table('products').select('*').eq('id', product_id).execute()
        
        if response.data and len(response.data) > 0:
            return jsonify({'product': response.data[0]}), 200
        else:
            return jsonify({'error': 'Product not found'}), 404
            
    except Exception as e:
        print(f"Error fetching product: {str(e)}")
        return jsonify({'error': str(e)}), 500

@product_bp.route('/<product_id>', methods=['PUT'])
@verify_token
@require_role('manager')
def update_product(product_id):
    """Update a product with optional image upload"""
    try:
        # Get form data (not JSON since we're using multipart/form-data)
        data = request.form.to_dict()
        
        # Get the image file if present
        image_file = request.files.get('image')
        
        # Handle image upload to Supabase storage
        if image_file and image_file.filename:
            if not allowed_file(image_file.filename):
                return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, webp, gif'}), 400
            
            try:
                # Generate unique filename
                file_ext = image_file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4()}.{file_ext}"
                
                # Read file bytes
                file_bytes = image_file.read()
                
                # Upload to Supabase storage using ADMIN client (bypasses RLS)
                supabase_admin = get_supabase_admin_client()
                upload_response = supabase_admin.storage.from_('product-images').upload(
                    unique_filename,
                    file_bytes,
                    {'content-type': image_file.content_type}
                )
                
                # Get public URL
                new_image_url = supabase_admin.storage.from_('product-images').get_public_url(unique_filename)
                print(f"✅ Image uploaded successfully: {new_image_url}")
                
                # Delete old image if exists
                # We'll need to get the old image URL from the database first
                supabase = get_authenticated_client()
                check_response = supabase.table('products').select('image_url').eq('id', product_id).execute()
                if check_response.data and len(check_response.data) > 0:
                    old_image_url = check_response.data[0].get('image_url')
                    if old_image_url:
                        delete_image_from_storage(old_image_url)
                
            except Exception as upload_error:
                print(f"❌ Image upload error: {str(upload_error)}")
                return jsonify({'error': f'Image upload failed: {str(upload_error)}'}), 500
        else:
            new_image_url = None
        
        # Build update data (only include provided fields)
        update_data = {}
        
        if 'product_name' in data:
            update_data['product_name'] = data['product_name'].strip()
        
        if 'category' in data:
            valid_categories = ['Dairy', 'Beverages', 'Snacks', 'Staples', 'Personal Care']
            if data['category'] not in valid_categories:
                return jsonify({'error': 'Invalid category'}), 400
            update_data['category'] = data['category']
        
        if 'season_affinity' in data:
            valid_seasons = ['all', 'summer', 'winter', 'monsoon']
            season = data['season_affinity'].lower()
            if season not in valid_seasons:
                return jsonify({'error': 'Invalid season'}), 400
            update_data['season_affinity'] = season
        
        if 'cost_price' in data:
            cost_price = float(data['cost_price'])
            if cost_price < 0:
                return jsonify({'error': 'Cost price cannot be negative'}), 400
            update_data['cost_price'] = cost_price
        
        if 'selling_price' in data:
            selling_price = float(data['selling_price'])
            if selling_price < 0:
                return jsonify({'error': 'Selling price cannot be negative'}), 400
            update_data['selling_price'] = selling_price
        
        if 'current_stock' in data:
            current_stock = int(data['current_stock'])
            if current_stock < 0:
                return jsonify({'error': 'Stock cannot be negative'}), 400
            update_data['current_stock'] = current_stock
        
        if 'safety_stock' in data:
            update_data['safety_stock'] = int(data['safety_stock'])
        
        if 'lead_time_days' in data:
            update_data['lead_time_days'] = int(data['lead_time_days'])
        
        if 'is_forecastable' in data:
            update_data['is_forecastable'] = data['is_forecastable'].lower() == 'true'
        
        # Add new image URL if uploaded
        if new_image_url:
            update_data['image_url'] = new_image_url
        
        if 'supplier_id' in data:
            update_data['supplier_id'] = data['supplier_id']
        
        if 'festival_discount_percent' in data:
            festival_discount = float(data['festival_discount_percent'])
            if festival_discount < 0 or festival_discount > 100:
                return jsonify({'error': 'Festival discount must be between 0 and 100'}), 400
            update_data['festival_discount_percent'] = festival_discount
        
        if 'flash_sale_discount_percent' in data:
            flash_sale_discount = float(data['flash_sale_discount_percent'])
            if flash_sale_discount < 0 or flash_sale_discount > 100:
                return jsonify({'error': 'Flash sale discount must be between 0 and 100'}), 400
            update_data['flash_sale_discount_percent'] = flash_sale_discount
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        supabase = get_authenticated_client()
        response = supabase.table('products').update(update_data).eq('id', product_id).execute()
        
        if response.data:
            return jsonify({
                'message': 'Product updated successfully',
                'product': response.data[0]
            }), 200
        else:
            # Clean up uploaded image if update fails
            if new_image_url:
                delete_image_from_storage(new_image_url)
            return jsonify({'error': 'Product not found'}), 404
            
    except Exception as e:
        error_message = str(e)
        print(f"Error updating product: {error_message}")
        
        # Clean up uploaded image if there's an error
        if new_image_url:
            delete_image_from_storage(new_image_url)
        
        if 'duplicate key' in error_message.lower():
            return jsonify({'error': 'A product with this name already exists'}), 400
        
        return jsonify({'error': error_message}), 500

@product_bp.route('/<product_id>', methods=['DELETE'])
@verify_token
@require_role('manager')
def delete_product(product_id):
    """Delete a product and its associated image from storage"""
    try:
        supabase = get_authenticated_client()
        
        # First check if product exists and get its image URL
        check_response = supabase.table('products').select('*').eq('id', product_id).execute()
        
        if not check_response.data or len(check_response.data) == 0:
            return jsonify({'error': 'Product not found'}), 404
        
        product = check_response.data[0]
        image_url = product.get('image_url')
        
        # Delete the product from database
        response = supabase.table('products').delete().eq('id', product_id).execute()
        
        # Delete the image from storage if it exists
        if image_url:
            delete_image_from_storage(image_url)
        
        return jsonify({'message': 'Product deleted successfully'}), 200
            
    except Exception as e:
        print(f"Error deleting product: {str(e)}")
        return jsonify({'error': str(e)}), 500

@product_bp.route('/low-stock', methods=['GET'])
@verify_token
def get_low_stock_products():
    """Get products where current_stock <= safety_stock"""
    try:
        supabase = get_authenticated_client()
        
        # Get all products and filter in Python (Supabase doesn't support column comparison in filters)
        response = supabase.table('products').select('*').order('current_stock').execute()
        
        # Filter for low stock
        low_stock_products = [
            product for product in response.data 
            if product['current_stock'] <= product['safety_stock']
        ]
        
        return jsonify({
            'products': low_stock_products,
            'count': len(low_stock_products)
        }), 200
        
    except Exception as e:
        print(f"Error fetching low stock products: {str(e)}")
        return jsonify({'error': str(e)}), 500

@product_bp.route('/categories', methods=['GET'])
@verify_token
def get_categories():
    """Get list of all valid categories"""
    categories = ['Dairy', 'Beverages', 'Snacks', 'Staples', 'Personal Care']
    return jsonify({'categories': categories}), 200

@product_bp.route('/seasons', methods=['GET'])
@verify_token
def get_seasons():
    """Get list of all valid seasons"""
    seasons = ['all season', 'summer', 'winter', 'monsoon']
    return jsonify({'seasons': seasons}), 200
