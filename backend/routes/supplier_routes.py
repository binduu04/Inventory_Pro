from flask import Blueprint, request, jsonify
from config.supabase_config import get_supabase_client
from models.supplier import Supplier
from utils.auth import verify_token, require_role, get_authenticated_client

supplier_bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')

@supplier_bp.route('/', methods=['POST'])
@verify_token
@require_role('manager')
def add_supplier():
    """Add a new supplier"""
    try:
        data = request.get_json()
        user_id = request.user_id  # Set by verify_token decorator
        
        # Validate input
        is_valid, error_message = Supplier.validate(data)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Create supplier object
        supplier = Supplier(
            full_name=data['full_name'],
            email=data['email'],
            phone=data['phone'],
            company=data['company'],
            address=data['address'],
            created_by=user_id
        )
        
        # Insert into database using authenticated client (respects RLS with user's token)
        supabase = get_authenticated_client()
        response = supabase.table('suppliers').insert(supplier.to_dict()).execute()
        
        if response.data:
            return jsonify({
                'message': 'Supplier added successfully',
                'supplier': response.data[0]
            }), 201
        else:
            return jsonify({'error': 'Failed to add supplier'}), 500
            
    except Exception as e:
        print(f"Error adding supplier: {str(e)}")
        return jsonify({'error': str(e)}), 500

@supplier_bp.route('/', methods=['GET'])
@verify_token
@require_role('manager')
def get_suppliers():
    """Get all suppliers"""
    try:
        supabase = get_authenticated_client()
        response = supabase.table('suppliers').select('*').order('created_at', desc=True).execute()
        
        return jsonify({
            'suppliers': response.data,
            'count': len(response.data)
        }), 200
        
    except Exception as e:
        print(f"Error fetching suppliers: {str(e)}")
        return jsonify({'error': str(e)}), 500

@supplier_bp.route('/<supplier_id>', methods=['GET'])
@verify_token
@require_role('manager')
def get_supplier(supplier_id):
    """Get a specific supplier"""
    try:
        supabase = get_authenticated_client()
        response = supabase.table('suppliers').select('*').eq('id', supplier_id).execute()
        
        if response.data and len(response.data) > 0:
            return jsonify({'supplier': response.data[0]}), 200
        else:
            return jsonify({'error': 'Supplier not found'}), 404
            
    except Exception as e:
        print(f"Error fetching supplier: {str(e)}")
        return jsonify({'error': str(e)}), 500

@supplier_bp.route('/<supplier_id>', methods=['PUT'])
@verify_token
@require_role('manager')
def update_supplier(supplier_id):
    """Update a supplier"""
    try:
        data = request.get_json()
        
        # Validate input
        is_valid, error_message = Supplier.validate(data)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        supabase = get_authenticated_client()
        response = supabase.table('suppliers').update(data).eq('id', supplier_id).execute()
        
        if response.data:
            return jsonify({
                'message': 'Supplier updated successfully',
                'supplier': response.data[0]
            }), 200
        else:
            return jsonify({'error': 'Supplier not found'}), 404
            
    except Exception as e:
        print(f"Error updating supplier: {str(e)}")
        return jsonify({'error': str(e)}), 500

@supplier_bp.route('/<supplier_id>', methods=['DELETE'])
@verify_token
@require_role('manager')
def delete_supplier(supplier_id):
    """Delete a supplier (soft delete by setting status to inactive)"""
    try:
        supabase = get_authenticated_client()
        response = supabase.table('suppliers').update({'status': 'inactive'}).eq('id', supplier_id).execute()
        
        if response.data:
            return jsonify({'message': 'Supplier deleted successfully'}), 200
        else:
            return jsonify({'error': 'Supplier not found'}), 404
            
    except Exception as e:
        print(f"Error deleting supplier: {str(e)}")
        return jsonify({'error': str(e)}), 500