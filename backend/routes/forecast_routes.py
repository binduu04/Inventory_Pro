"""
Forecast API Routes
Handles sales forecasting endpoints
"""

from flask import Blueprint, jsonify, request
import os
import traceback
from datetime import datetime

# Import forecast engine
from ml_models.forecast_engine import generate_forecast, load_models

forecast_bp = Blueprint('forecast', __name__, url_prefix='/api/forecast')

# Global variable to store loaded models (load once for performance)
MODELS_CACHE = None


def get_models():
    """Get or load ML models (cached for performance)"""
    global MODELS_CACHE
    if MODELS_CACHE is None:
        print("Loading ML models for the first time...")
        MODELS_CACHE = load_models()
    return MODELS_CACHE


@forecast_bp.route('/generate', methods=['POST'])
def generate_forecast_api():
    """
    Generate sales forecast for next N days
    
    Request Body:
    {
        "num_days": 7  // Optional, defaults to 7
    }
    
    Response:
    {
        "success": true,
        "forecast": [
            {
                "date": "2025-11-11",
                "product_name": "Amul Milk 1L",
                "category": "Dairy",
                "price": 60.0,
                "discount_percent": 0.0,
                "final_price": 60.0,
                "is_festival": 0,
                "festival_name": "",
                "predicted_quantity": 25,
                "forecasted_revenue": 1500.0
            },
            ...
        ],
        "summary": {
            "total_products": 50,
            "total_quantity": 3500,
            "total_revenue": 125000.0,
            "date_range": {
                "start": "2025-11-11",
                "end": "2025-11-17"
            }
        }
    }
    """
    try:
        # Get request parameters
        data = request.get_json() or {}
        num_days = data.get('num_days', 7)
        
        # Validate num_days
        if not isinstance(num_days, int) or num_days < 1 or num_days > 30:
            return jsonify({
                'success': False,
                'error': 'num_days must be an integer between 1 and 30'
            }), 400
        
        # Path to CSV file (in root of project)
        # Go up from backend/routes/ -> backend/ -> project_root/
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_path = os.path.join(project_root, 'kirana_sales_data_v2.3_production_discount.csv')
        
        if not os.path.exists(csv_path):
            return jsonify({
                'success': False,
                'error': f'Sales data file not found: {csv_path}'
            }), 404
        
        # Load models (cached)
        models = get_models()
        
        # Generate forecast
        print(f"Generating {num_days}-day forecast...")
        forecast_df = generate_forecast(csv_path, num_days=num_days, models=models)
        
        # Convert to JSON format
        forecast_list = []
        for _, row in forecast_df.iterrows():
            forecast_list.append({
                'date': row['sale_date'].strftime('%Y-%m-%d'),
                'product_name': row['product_name'],
                'category': row['category'],
                'price': float(row['price']),
                'discount_percent': float(row['discount_percent']),
                'final_price': float(row['final_price']),
                'is_festival': int(row['is_festival']),
                'festival_name': row['festival_name'],
                'predicted_quantity': int(row['predicted_quantity']),
                'forecasted_revenue': float(row['forecasted_revenue'])
            })
        
        # Generate summary statistics
        total_quantity = forecast_df['predicted_quantity'].sum()
        total_revenue = forecast_df['forecasted_revenue'].sum()
        unique_products = forecast_df['product_name'].nunique()
        date_range = {
            'start': forecast_df['sale_date'].min().strftime('%Y-%m-%d'),
            'end': forecast_df['sale_date'].max().strftime('%Y-%m-%d')
        }
        
        # Category-wise summary
        category_summary = forecast_df.groupby('category').agg({
            'predicted_quantity': 'sum',
            'forecasted_revenue': 'sum'
        }).to_dict('index')
        
        category_summary_list = []
        for category, values in category_summary.items():
            category_summary_list.append({
                'category': category,
                'total_quantity': int(values['predicted_quantity']),
                'total_revenue': float(values['forecasted_revenue'])
            })
        
        return jsonify({
            'success': True,
            'forecast': forecast_list,
            'summary': {
                'total_products': int(unique_products),
                'total_quantity': int(total_quantity),
                'total_revenue': float(total_revenue),
                'date_range': date_range,
                'by_category': category_summary_list
            }
        }), 200
        
    except FileNotFoundError as e:
        print(f"ERROR: File not found: {e}")
        return jsonify({
            'success': False,
            'error': f'Required file not found: {str(e)}'
        }), 404
        
    except Exception as e:
        print(f"ERROR: Error generating forecast: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Failed to generate forecast: {str(e)}'
        }), 500


@forecast_bp.route('/status', methods=['GET'])
def forecast_status():
    """
    Check if forecast system is ready (models loaded, data available)
    
    Response:
    {
        "success": true,
        "status": "ready",
        "models_loaded": true,
        "data_file_exists": true,
        "last_data_date": "2025-11-10"
    }
    """
    try:
        import pandas as pd
        
        # Check if CSV file exists (in root of project)
        # Go up from backend/routes/ -> backend/ -> project_root/
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_path = os.path.join(project_root, 'kirana_sales_data_v2.3_production_discount.csv')
        data_file_exists = os.path.exists(csv_path)
        
        # Get last date in data
        last_data_date = None
        if data_file_exists:
            try:
                df = pd.read_csv(csv_path)
                df['sale_date'] = pd.to_datetime(df['sale_date'])
                last_data_date = df['sale_date'].max().strftime('%Y-%m-%d')
            except:
                pass
        
        # Check if models are loaded
        models_loaded = MODELS_CACHE is not None
        
        # Try to load models if not already loaded
        if not models_loaded:
            try:
                get_models()
                models_loaded = True
            except:
                models_loaded = False
        
        # Determine overall status
        if models_loaded and data_file_exists:
            status = 'ready'
        elif not models_loaded:
            status = 'models_not_loaded'
        elif not data_file_exists:
            status = 'data_not_found'
        else:
            status = 'unknown'
        
        return jsonify({
            'success': True,
            'status': status,
            'models_loaded': models_loaded,
            'data_file_exists': data_file_exists,
            'last_data_date': last_data_date
        }), 200
        
    except Exception as e:
        print(f"ERROR: Error checking forecast status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Optional: Reload models endpoint (for when you retrain)
@forecast_bp.route('/reload-models', methods=['POST'])
def reload_models():
    """
    Reload ML models from disk (use after retraining)
    
    Response:
    {
        "success": true,
        "message": "Models reloaded successfully"
    }
    """
    try:
        global MODELS_CACHE
        MODELS_CACHE = None  # Clear cache
        MODELS_CACHE = load_models()  # Reload
        
        return jsonify({
            'success': True,
            'message': 'Models reloaded successfully'
        }), 200
        
    except Exception as e:
        print(f"ERROR: Error reloading models: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
