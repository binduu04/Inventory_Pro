from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

# Import routes...
# (keep all your imports)

def create_app():
    app = Flask(
        __name__,
        static_folder="../frontend/dist",      # Location of built frontend
        static_url_path="/"                   # Serve static files at root
    )

    # CORS config (keep as-is)
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:5174"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Register blueprints (keep as-is)
    app.register_blueprint(supplier_bp)
    app.register_blueprint(biller_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(order_bp, url_prefix='/api/orders')
    app.register_blueprint(forecast_bp)
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

    # Health check
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy"}), 200

    # Serve React index.html for all non-API routes
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith("api"):
            return jsonify({"error": "Not Found"}), 404
        return send_from_directory(app.static_folder, "index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
