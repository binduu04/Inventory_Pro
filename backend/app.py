from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import blueprints
from routes.supplier_routes import supplier_bp
from routes.biller_routes import biller_bp
from routes.product_routes import product_bp
from routes.customer_routes import customer_bp
from routes.cart_routes import cart_bp
from routes.order_routes import order_bp
from routes.forecast_routes import forecast_bp
from routes.analytics_routes import analytics_bp


def create_app():
    app = Flask(
        __name__,
        static_folder="../frontend/dist",   # React build folder
        static_url_path="/"                 # Serve at root
    )

    # CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:5174"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Register blueprints (IMPORTANT — these must remain here!)
    app.register_blueprint(supplier_bp, url_prefix="/api/suppliers")
    app.register_blueprint(biller_bp, url_prefix="/api/billers")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(customer_bp, url_prefix="/api/customers")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(order_bp, url_prefix="/api/orders")
    app.register_blueprint(forecast_bp, url_prefix="/api/forecast")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    # Health Check
    @app.route('/health')
    def health():
        return jsonify({"status": "healthy"}), 200

    # Root API endpoint
    @app.route('/api')
    def api_root():
        return jsonify({"message": "Manager Dashboard API v1.0"}), 200

    # Serve frontend
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith("api"):
            return jsonify({"error": "Not Found"}), 404

        return send_from_directory(app.static_folder, "index.html")

    return app


# Run Server
if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
