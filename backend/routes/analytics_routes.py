from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from utils.auth import verify_token, require_role, get_authenticated_client

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


# =========================
# 1️⃣ SALES OVERVIEW
# =========================
@analytics_bp.route('/sales-overview', methods=['GET'])
@verify_token
@require_role(['manager'])
def get_sales_overview():
    """Return total revenue, total orders, avg order value, and growth rate."""
    try:
        supabase = get_authenticated_client()

        # Fetch all sales
        sales_response = supabase.table('sales').select('sale_date, total_amount').execute()
        sales = sales_response.data or []

        if not sales:
            return jsonify({'message': 'No sales found', 'data': {}}), 200

        # Calculate metrics
        total_revenue = sum(s['total_amount'] for s in sales)
        total_orders = len(sales)
        avg_order_value = round(total_revenue / total_orders, 2)

        # Weekly growth rate (last 7 days vs previous 7 days)
        now = datetime.utcnow()
        last_week = [s for s in sales if datetime.fromisoformat(s['sale_date'][:19]) >= now - timedelta(days=7)]
        prev_week = [s for s in sales if now - timedelta(days=14) <= datetime.fromisoformat(s['sale_date'][:19]) < now - timedelta(days=7)]

        last_revenue = sum(s['total_amount'] for s in last_week)
        prev_revenue = sum(s['total_amount'] for s in prev_week)
        growth_rate = 0 if prev_revenue == 0 else round(((last_revenue - prev_revenue) / prev_revenue) * 100, 2)

        return jsonify({
            'success': True,
            'data': {
                'total_revenue': total_revenue,
                'total_orders': total_orders,
                'avg_order_value': avg_order_value,
                'growth_rate': growth_rate
            }
        }), 200

    except Exception as e:
        print(f"Error fetching sales overview: {str(e)}")
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/category-wise', methods=['GET'])
@verify_token
@require_role(['manager'])
def get_category_wise_sales():
    """Aggregate total sales per product category (safe manual join)."""
    try:
        supabase = get_authenticated_client()

        # Fetch sale_items (with product_id and subtotal)
        sale_items_resp = supabase.table('sale_items').select('product_id, subtotal').execute()
        sale_items = sale_items_resp.data or []

        if not sale_items:
            return jsonify({'success': True, 'data': []}), 200

        # Fetch all products (id and category)
        products_resp = supabase.table('products').select('id, category').execute()
        products = {p['id']: p['category'] for p in (products_resp.data or [])}

        # Map sale_items to categories
        category_sales = {}
        for item in sale_items:
            product_id = item.get('product_id')
            category = products.get(product_id, 'Unknown')
            subtotal = float(item.get('subtotal', 0))
            category_sales[category] = category_sales.get(category, 0) + subtotal

        # Convert dict → sorted list
        result = [
            {'category': cat, 'sales': round(total, 2)}
            for cat, total in sorted(category_sales.items(), key=lambda x: x[1], reverse=True)
        ]

        return jsonify({'success': True, 'data': result}), 200

    except Exception as e:
        print(f"Error in category-wise sales: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# # =========================
# # 3️⃣ WEEKLY SALES
# # =========================
# @analytics_bp.route('/weekly-sales', methods=['GET'])
# @verify_token
# @require_role(['manager'])
# def get_weekly_sales():
#     """Compare sales week by week (last 4 weeks)."""
#     try:
#         supabase = get_authenticated_client()
#         response = supabase.table('sales').select('sale_date, total_amount').execute()
#         sales = response.data or []

#         now = datetime.utcnow()
#         weekly_data = []
#         for i in range(4, 0, -1):
#             week_start = now - timedelta(weeks=i)
#             week_end = week_start + timedelta(weeks=1)
#             week_sales = [s for s in sales if week_start <= datetime.fromisoformat(s['sale_date'][:19]) < week_end]
#             total = sum(s['total_amount'] for s in week_sales)
#             weekly_data.append({
#                 'week': f"Week {5 - i}",
#                 'revenue': round(total, 2)
#             })

#         return jsonify({'success': True, 'data': weekly_data}), 200

#     except Exception as e:
#         print(f"Error in weekly sales: {str(e)}")
#         return jsonify({'error': str(e)}), 500


# # =========================
# # 4️⃣ CHANNEL-WISE SALES
# # =========================
# @analytics_bp.route('/channel-wise', methods=['GET'])
# @verify_token
# @require_role(['manager'])
# def get_channel_wise_sales():
#     """Compare online vs offline revenue."""
#     try:
#         supabase = get_authenticated_client()
#         resp = supabase.table('sales').select('sale_type, total_amount').execute()
#         sales = resp.data or []

#         channel_data = {'ONLINE': 0, 'OFFLINE': 0}
#         for sale in sales:
#             t = sale.get('sale_type', 'UNKNOWN').upper()
#             if t in channel_data:
#                 channel_data[t] += sale['total_amount']

#         result = [{'type': k.title(), 'revenue': round(v, 2)} for k, v in channel_data.items()]
#         return jsonify({'success': True, 'data': result}), 200

#     except Exception as e:
#         print(f"Error in channel-wise sales: {str(e)}")
#         return jsonify({'error': str(e)}), 500




@analytics_bp.route('/weekly-sales', methods=['GET'])
@verify_token
@require_role(['manager'])
def get_weekly_sales():
    """Compare total sales for the last 4 weeks (with date ranges)."""
    try:
        supabase = get_authenticated_client()
        response = supabase.table('sales').select('sale_date, total_amount').execute()
        sales = response.data or []

        if not sales:
            return jsonify({'success': True, 'data': []}), 200

        now = datetime.utcnow()
        weekly_data = []

        for i in range(4, 0, -1):
            week_start = now - timedelta(weeks=i)
            week_end = week_start + timedelta(weeks=1)

            week_sales = [
                s for s in sales
                if week_start <= datetime.fromisoformat(s['sale_date'][:19]) < week_end
            ]
            total = sum(s['total_amount'] for s in week_sales)

            week_label = f"{week_start.strftime('%d %b')} - {week_end.strftime('%d %b')}"
            weekly_data.append({
                'week': week_label,
                'revenue': round(total, 2)
            })

        # Remove empty weeks (keep only where total > 0)
        weekly_data = [w for w in weekly_data if w['revenue'] > 0]

        return jsonify({'success': True, 'data': weekly_data}), 200

    except Exception as e:
        print(f"Error in weekly sales: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/channel-wise', methods=['GET'])
@verify_token
@require_role(['manager'])
def get_channel_wise_sales():
    """Compare online vs offline revenue (case-insensitive)."""
    try:
        supabase = get_authenticated_client()
        resp = supabase.table('sales').select('sale_type, total_amount').execute()
        sales = resp.data or []

        if not sales:
            return jsonify({'success': True, 'data': []}), 200

        channel_data = {'Online': 0, 'Offline': 0}

        for sale in sales:
            sale_type = (sale.get('sale_type') or '').strip().upper()
            if sale_type == 'ONLINE':
                channel_data['Online'] += float(sale['total_amount'])
            elif sale_type == 'OFFLINE':
                channel_data['Offline'] += float(sale['total_amount'])

        result = [{'type': k, 'revenue': round(v, 2)} for k, v in channel_data.items() if v > 0]
        return jsonify({'success': True, 'data': result}), 200

    except Exception as e:
        print(f"Error in channel-wise sales: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500



# =========================
# 5️⃣ PRODUCT PERFORMANCE
# =========================
@analytics_bp.route('/product-performance', methods=['GET'])
@verify_token
@require_role(['manager'])
def get_product_performance():
    """Return top 5 and bottom 5 products based on total quantity sold."""
    try:
        supabase = get_authenticated_client()
        resp = supabase.table('sale_items').select('quantity, products(product_name)').execute()
        items = resp.data or []

        product_sales = {}
        for i in items:
            name = i['products']['product_name']
            product_sales[name] = product_sales.get(name, 0) + i['quantity']

        sorted_sales = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)
        top_5 = [{'name': n, 'sales': s} for n, s in sorted_sales[:5]]
        bottom_5 = [{'name': n, 'sales': s} for n, s in sorted_sales[-5:]]

        return jsonify({
            'success': True,
            'data': {
                'top_products': top_5,
                'bottom_products': bottom_5
            }
        }), 200

    except Exception as e:
        print(f"Error in product performance: {str(e)}")
        return jsonify({'error': str(e)}), 500
