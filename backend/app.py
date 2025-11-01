from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routes
from routes.supplier_routes import supplier_bp
from routes.biller_routes import biller_bp
from routes.product_routes import product_bp
from routes.customer_routes import customer_bp

def create_app():
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:5174"],  # Your React app URLs
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(supplier_bp)
    app.register_blueprint(biller_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(customer_bp)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'API is running'}), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Manager Dashboard API',
            'version': '1.0.0',
            'endpoints': {
                'suppliers': '/api/suppliers',
                'billers': '/api/billers',
                'products': '/api/products',
                'health': '/health'
            }
        }), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)