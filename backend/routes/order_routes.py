from flask import Blueprint, request, jsonify
from config.supabase_config import get_supabase_client_with_token, get_supabase_client
from utils.auth import verify_token, require_role
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

order_bp = Blueprint('order', __name__)

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SENDER_EMAIL = os.getenv('SENDER_EMAIL', '')
SENDER_NAME = os.getenv('SENDER_NAME', 'Kirana Store Manager')

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


# ============================================================
# PURCHASE ORDER ROUTES (Manager to Supplier)
# ============================================================

def send_purchase_order_email(supplier_email, supplier_name, order_data):
    """Send purchase order email to supplier"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"New Purchase Order - {order_data['order_number']}"
        msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg['To'] = supplier_email

        items_html = ""
        for item in order_data['items']:
            items_html += f"""
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{item['product_name']}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">{item['quantity']}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹{item['unit_cost']:.2f}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹{item['total_cost']:.2f}</td>
                </tr>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="margin: 0;">Purchase Order</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Order #{order_data['order_number']}</p>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
                <p style="font-size: 16px;">Dear <strong>{supplier_name}</strong>,</p>
                <p>We would like to place a purchase order with the following details:</p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #4f46e5;">Order Information</h3>
                    <p><strong>Order Number:</strong> {order_data['order_number']}</p>
                    <p><strong>Date:</strong> {datetime.now().strftime('%B %d, %Y')}</p>
                    <p><strong>Status:</strong> PLACED</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 12px; text-align: left;">Product</th>
                            <th style="padding: 12px; text-align: center;">Qty</th>
                            <th style="padding: 12px; text-align: right;">Unit Price</th>
                            <th style="padding: 12px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>{items_html}</tbody>
                    <tfoot>
                        <tr style="background: #f9fafb;">
                            <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold;">Grand Total:</td>
                            <td style="padding: 15px; text-align: right; font-weight: bold; color: #059669;">₹{order_data['total_amount']:.2f}</td>
                        </tr>
                    </tfoot>
                </table>
                {f'<div style="background: #fef3c7; padding: 15px; margin-top: 20px;"><strong>Note:</strong> {order_data.get("notes", "")}</div>' if order_data.get('notes') else ''}
                <p style="margin-top: 30px;">Please confirm receipt of this order.</p>
                <p>Best regards,<br><strong>{SENDER_NAME}</strong></p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, 'html'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        print(f"Email sent to {supplier_email}")
        return True
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False


@order_bp.route('/purchase-order', methods=['POST'])
@verify_token
@require_role(['manager'])
def create_purchase_order():
    """Create purchase order and send email"""
    print("="*50)
    print("PURCHASE ORDER REQUEST RECEIVED")
    print("="*50)
    try:
        manager_token = request.access_token
        manager_id = request.user_id
        
        print(f"Manager ID: {manager_id}")
        print(f"Token present: {bool(manager_token)}")
        
        data = request.get_json()
        print(f"Request data: {data}")
        
        supplier_id = data.get('supplier_id')
        items = data.get('items', [])
        notes = data.get('notes', '')

        print(f"Supplier ID: {supplier_id}")
        print(f"Items count: {len(items)}")

        if not supplier_id or not items:
            print("Missing supplier_id or items")
            return jsonify({'error': 'Supplier ID and items required'}), 400

        supabase = get_supabase_client_with_token(manager_token)

        # Fetch supplier
        print(f"Fetching supplier: {supplier_id}")
        supplier_response = supabase.table('suppliers').select('*').eq('id', supplier_id).single().execute()
        if not supplier_response.data:
            print("Supplier not found")
            return jsonify({'error': 'Supplier not found'}), 404
        
        supplier = supplier_response.data
        print(f"Supplier found: {supplier['full_name']}")
        
        total_amount = sum(item['total_cost'] for item in items)
        print(f"Total amount: Rs {total_amount}")

        # Create purchase order
        po_data = {
            'supplier_id': supplier_id,
            'manager_id': manager_id,
            'total_amount': total_amount,
            'status': 'placed',
            'notes': notes
        }

        print("Creating purchase order...")
        po_response = supabase.table('purchase_orders').insert(po_data).execute()
        if not po_response.data:
            print("Failed to create purchase order")
            return jsonify({'error': 'Failed to create purchase order'}), 500

        purchase_order = po_response.data[0]
        order_id = purchase_order['id']
        order_number = purchase_order['order_number']
        print(f"Purchase order created: {order_number}")

        # Create items
        po_items = []
        for item in items:
            po_items.append({
                'purchase_order_id': order_id,
                'product_id': item['product_id'],
                'product_name': item['product_name'],
                'quantity': item['quantity'],
                'unit_cost': item['unit_cost'],
                'total_cost': item['total_cost']
            })

        print(f"Inserting {len(po_items)} items...")
        items_response = supabase.table('purchase_order_items').insert(po_items).execute()
        if not items_response.data:
            print("Failed to create items, rolling back...")
            supabase.table('purchase_orders').delete().eq('id', order_id).execute()
            return jsonify({'error': 'Failed to create items'}), 500

        print("Items created successfully")

        # Send email
        email_data = {
            'order_number': order_number,
            'total_amount': total_amount,
            'items': items,
            'notes': notes
        }
        print(f"Sending email to {supplier['email']}...")
        email_sent = send_purchase_order_email(supplier['email'], supplier['full_name'], email_data)
        print(f"Email {'sent' if email_sent else 'failed'}")

        response_data = {
            'success': True,
            'message': 'Purchase order created',
            'order_id': order_id,
            'order_number': order_number,
            'total_amount': total_amount,
            'email_sent': email_sent
        }
        
        print(f"Returning 201 response: {response_data}")
        print("="*50)
        return jsonify(response_data), 201

    except Exception as e:
        print(f"Error creating purchase order: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@order_bp.route('/purchase-orders', methods=['GET'])
@verify_token
@require_role(['manager'])
def get_purchase_orders():
    """Get all purchase orders"""
    try:
        manager_token = request.access_token
        supabase = get_supabase_client_with_token(manager_token)
        response = supabase.table('purchase_orders').select(
            '*, suppliers(full_name, email, phone)'
        ).order('created_at', desc=True).execute()

        purchase_orders = response.data
        for po in purchase_orders:
            items_response = supabase.table('purchase_order_items').select('*').eq(
                'purchase_order_id', po['id']
            ).execute()
            po['items'] = items_response.data

        return jsonify({'success': True, 'data': purchase_orders}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@order_bp.route('/purchase-order/<order_id>/receive', methods=['PUT'])
@verify_token
@require_role(['manager'])
def mark_order_received(order_id):
    """Mark as received and update stock"""
    try:
        manager_token = request.access_token
        supabase = get_supabase_client_with_token(manager_token)

        po_response = supabase.table('purchase_orders').select('*').eq('id', order_id).single().execute()
        if not po_response.data:
            return jsonify({'error': 'Order not found'}), 404

        if po_response.data['status'] == 'received':
            return jsonify({'error': 'Already received'}), 400

        items_response = supabase.table('purchase_order_items').select('*').eq(
            'purchase_order_id', order_id
        ).execute()

        for item in items_response.data:
            product_response = supabase.table('products').select('current_stock').eq(
                'id', item['product_id']
            ).single().execute()

            if product_response.data:
                current_stock = product_response.data['current_stock'] or 0
                new_stock = current_stock + item['quantity']

                supabase.table('products').update({
                    'current_stock': new_stock
                }).eq('id', item['product_id']).execute()

                print(f"{item['product_name']}: {current_stock} + {item['quantity']} = {new_stock}")

        supabase.table('purchase_orders').update({
            'status': 'received',
            'received_at': datetime.now().isoformat()
        }).eq('id', order_id).execute()

        return jsonify({
            'success': True,
            'message': 'Order received, stock updated',
            'items_updated': len(items_response.data)
        }), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500
