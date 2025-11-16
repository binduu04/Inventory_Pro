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
from utils.whatsapp_service import get_whatsapp_service
from dotenv import load_dotenv
import os

load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")



@cart_bp.route('/create-payment-intent', methods=['POST'])
@verify_token
@require_role(['customer'])
def create_payment_intent():
    try:
        data = request.get_json()
        total_amount = data.get("total_amount")
        idempotency_key = data.get("idempotency_key")
        user_id = request.user_id

        if not total_amount:
            return jsonify({"error": "Missing total_amount"}), 400

        supabase = get_supabase_client_with_token(request.access_token)

        # Check if PaymentIntent already exists
        existing = (
            supabase.table("payment_intents")
            .select("*")
            .eq("user_id", user_id)
            .eq("idempotency_key", idempotency_key)
            .execute()
        )

        if existing.data and len(existing.data) > 0:
            return jsonify({
                "clientSecret": existing.data[0]["client_secret"]
            }), 200

        # Create new PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=int(total_amount * 100),
            currency="usd",
            payment_method_types=["card"],
            metadata={"user_id": str(user_id)},
        )

        # Save record
        supabase.table("payment_intents").insert({
            "user_id": user_id,
            "idempotency_key": idempotency_key,
            "payment_intent_id": intent.id,
            "client_secret": intent.client_secret,
            "amount": int(total_amount * 100),
            "created_at": datetime.utcnow().isoformat(),
        }).execute()

        return jsonify({"clientSecret": intent.client_secret}), 200

    except Exception as e:
        print("ERROR in create-payment-intent:", str(e))
        return jsonify({"error": str(e)}), 500



@cart_bp.route('/confirm-payment', methods=['POST'])
@verify_token
@require_role(['customer'])
def confirm_payment():
    try:
        supabase = get_supabase_client_with_token(request.access_token)
        admin_supabase = get_supabase_admin_client()

        user_id = request.user_id
        data = request.get_json()

        stripe_payment_id = data.get("stripe_payment_id")
        items = data.get("items", [])

        if not stripe_payment_id:
            return jsonify({"error": "Missing stripe_payment_id"}), 400
        if not items:
            return jsonify({"error": "No items provided"}), 400

        # 1️⃣ Verify PaymentIntent is successful
        pi = stripe.PaymentIntent.retrieve(stripe_payment_id)
        if pi.status != "succeeded":
            return jsonify({"error": "Payment not completed"}), 400

        # 2️⃣ Fetch customer profile
        profile_res = supabase.table('profiles').select("*").eq("id", user_id).single().execute()
        customer = profile_res.data

        # 3️⃣ Validate stock + compute totals
        validated_items = []
        total_amount = 0

        for item in items:
            product_id = item.get("product_id")
            qty = item.get("quantity", 1)

            product_res = supabase.table('products').select("*").eq("id", product_id).single().execute()
            product = product_res.data

            if not product:
                return jsonify({"error": f"Product {product_id} not found"}), 400

            if product["current_stock"] < qty:
                return jsonify({
                    "error": f"{product['product_name']} only has {product['current_stock']} left"
                }), 400

            # Discount handling (same as your original)
            selling_price = float(product["selling_price"])
            category = product.get("category", "")
            festival_disc = product.get("festival_discount_percent", 0) or 0
            flash_disc = product.get("flash_sale_discount_percent", 0) or 0
            disc = get_discount_for_product(category, festival_disc, flash_disc)

            if disc > 0:
                unit_price = selling_price * (1 - disc / 100)
            else:
                unit_price = selling_price

            subtotal = unit_price * qty
            total_amount += subtotal

            validated_items.append({
                "product_id": product_id,
                "quantity": qty,
                "unit_price": round(unit_price, 2),
                "subtotal": round(subtotal, 2)
            })

        # 4️⃣ Create sale record
        sale_data = {
            "sale_type": "ONLINE",
            "customer_id": user_id,
            "customer_name": customer.get("full_name"),
            "customer_phone": customer.get("phone"),
            "total_amount": round(total_amount, 2),
            "payment_method": "ONLINE",
            "order_status": "paid",
            "stripe_payment_id": stripe_payment_id,
            "created_at": datetime.utcnow().isoformat(),
        }

        sale_res = supabase.table("sales").insert(sale_data).execute()
        sale_id = sale_res.data[0]["sale_id"]

        # 5️⃣ Create sale items
        sale_items_insert = []
        for item in validated_items:
            sale_items_insert.append({
                "sale_id": sale_id,
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "unit_price": item["unit_price"],
                "subtotal": item["subtotal"]
            })

        supabase.table("sale_items").insert(sale_items_insert).execute()

        # 6️⃣ Update stock using ADMIN client
        for item in validated_items:
            p = admin_supabase.table("products").select("current_stock").eq("id", item["product_id"]).single().execute()
            new_stock = p.data["current_stock"] - item["quantity"]

            admin_supabase.table("products").update({
                "current_stock": new_stock
            }).eq("id", item["product_id"]).execute()

        # 7️⃣ Send WhatsApp notification to customer
        whatsapp_service = get_whatsapp_service()
        whatsapp_result = whatsapp_service.send_order_confirmation(
            customer_phone=customer.get("phone"),
            customer_name=customer.get("full_name", "Customer"),
            sale_id=sale_id,
            total_amount=round(total_amount, 2),
            items_count=len(validated_items)
        )
        
        # Log WhatsApp status (but don't fail the order if WhatsApp fails)
        if whatsapp_result['success']:
            print(f"[WHATSAPP] Message sent successfully to {customer.get('phone')}")
        else:
            print(f"[WHATSAPP] Failed: {whatsapp_result['message']}")

        return jsonify({
            "success": True,
            "message": "Payment confirmed — Order created!",
            "sale_id": sale_id,
            "total_amount": round(total_amount, 2),
            "items": len(validated_items),
            "whatsapp_sent": whatsapp_result['success']
        }), 200

    except Exception as e:
        print("Error confirm_payment:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
