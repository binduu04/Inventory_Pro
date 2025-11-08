from flask import Blueprint, request, jsonify
from config.supabase_config import get_supabase_client_with_token
from utils.auth import verify_token, require_role

order_bp = Blueprint('order', __name__)

# Get customer's online orders
@order_bp.route('/my-orders', methods=['GET'])
@verify_token
@require_role(['customer'])
def get_my_orders():
    try:
        customer_token = request.access_token
        supabase = get_supabase_client_with_token(customer_token)
        customer_id = request.user_id
        
        # Fetch customer's online orders with sale items
        response = supabase.table('sales')\
            .select('*, sale_items(*, products(product_name, image_url))')\
            .eq('customer_id', customer_id)\
            .eq('sale_type', 'ONLINE')\
            .order('sale_date', desc=True)\
            .execute()
        
        orders = []
        for sale in response.data:
            # Count items
            item_count = len(sale.get('sale_items', []))
            
            orders.append({
                'id': f"ORD-{str(sale['sale_id']).zfill(6)}",
                'sale_id': sale['sale_id'],
                'date': sale['sale_date'],
                'items': item_count,
                'total': float(sale['total_amount']),
                'status': sale['order_status'],
                'payment_method': sale['payment_method'],
                'sale_items': sale.get('sale_items', []),
                'packed_at': sale.get('packed_at'),
                'completed_at': sale.get('completed_at')
            })
        
        return jsonify({
            'success': True,
            'orders': orders
        }), 200
        
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# Get pending online orders for biller (to approve/pack)
@order_bp.route('/pending-orders', methods=['GET'])
@verify_token
@require_role(['biller'])
def get_pending_orders():
    try:
        biller_token = request.access_token
        supabase = get_supabase_client_with_token(biller_token)
        
        # Fetch online orders that are not completed
        response = supabase.table('sales')\
            .select('*, sale_items(*, products(product_name, image_url))')\
            .eq('sale_type', 'ONLINE')\
            .neq('order_status', 'completed')\
            .order('sale_date', desc=False)\
            .execute()
        
        orders = []
        for sale in response.data:
            # Count items
            item_count = len(sale.get('sale_items', []))
            
            # Get customer profile for additional details
            customer_response = supabase.table('profiles')\
                .select('full_name, phone')\
                .eq('id', sale['customer_id'])\
                .single()\
                .execute()
            
            customer_data = customer_response.data if customer_response.data else {}
            
            orders.append({
                'sale_id': sale['sale_id'],
                'order_number': f"ORD-{str(sale['sale_id']).zfill(6)}",
                'date': sale['sale_date'],
                'customer_name': customer_data.get('full_name') or sale.get('customer_name'),
                'customer_phone': customer_data.get('phone') or sale.get('customer_phone'),
                'items': item_count,
                'total': float(sale['total_amount']),
                'status': sale['order_status'],
                'payment_method': sale['payment_method'],
                'sale_items': sale.get('sale_items', []),
                'packed_at': sale.get('packed_at'),
                'packed_by_biller_id': sale.get('packed_by_biller_id')
            })
        
        return jsonify({
            'success': True,
            'orders': orders
        }), 200
        
    except Exception as e:
        print(f"Error fetching pending orders: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# Mark order as packed and ready for pickup
@order_bp.route('/mark-packed/<int:sale_id>', methods=['PUT'])
@verify_token
@require_role(['biller'])
def mark_order_packed(sale_id):
    try:
        biller_token = request.access_token
        supabase = get_supabase_client_with_token(biller_token)
        biller_id = request.user_id
        
        # Update order status
        response = supabase.table('sales')\
            .update({
                'order_status': 'packed_and_ready_for_pickup',
                'packed_by_biller_id': biller_id,
                'packed_at': 'now()',
                'updated_at': 'now()'
            })\
            .eq('sale_id', sale_id)\
            .eq('sale_type', 'ONLINE')\
            .execute()
        
        if not response.data:
            return jsonify({'error': 'Order not found or already processed'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Order marked as packed and ready for pickup'
        }), 200
        
    except Exception as e:
        print(f"Error marking order as packed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# Mark order as completed (customer picked up)
@order_bp.route('/mark-completed/<int:sale_id>', methods=['PUT'])
@verify_token
@require_role(['biller'])
def mark_order_completed(sale_id):
    try:
        biller_token = request.access_token
        supabase = get_supabase_client_with_token(biller_token)
        biller_id = request.user_id
        
        # Update order status
        response = supabase.table('sales')\
            .update({
                'order_status': 'completed',
                'completed_by_biller_id': biller_id,
                'completed_at': 'now()',
                'updated_at': 'now()'
            })\
            .eq('sale_id', sale_id)\
            .eq('sale_type', 'ONLINE')\
            .execute()
        
        if not response.data:
            return jsonify({'error': 'Order not found or already completed'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Order marked as completed'
        }), 200
        
    except Exception as e:
        print(f"Error marking order as completed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
