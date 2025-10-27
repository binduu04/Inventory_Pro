from functools import wraps
from flask import request, jsonify
from config.supabase_config import get_supabase_client, get_supabase_client_with_token
import jwt

def verify_token(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
            
            # Get Supabase client
            supabase = get_supabase_client()
            
            # Verify token by making a request with it
            response = supabase.auth.get_user(token)
            
            if not response or not response.user:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Add user info to request
            request.user_id = response.user.id
            request.user_email = response.user.email
            request.user_role = response.user.user_metadata.get('role', 'customer')
            request.access_token = token  # Store the access token for RLS
            
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Token verification error: {str(e)}")
            return jsonify({'error': 'Invalid or expired token'}), 401
    
    return decorated_function

def get_authenticated_client():
    """Get Supabase client with the authenticated user's token"""
    token = getattr(request, 'access_token', None)
    if not token:
        raise ValueError("No access token found. Use @verify_token decorator first.")
    return get_supabase_client_with_token(token)

def require_role(required_role):
    """Decorator to check user role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_role = getattr(request, 'user_role', None)
            
            if user_role != required_role:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator