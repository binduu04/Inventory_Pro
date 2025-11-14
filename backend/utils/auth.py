from functools import wraps
from flask import request, jsonify
from config.supabase_config import get_supabase_client, get_supabase_client_with_token
import jwt

def verify_token(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"[AUTH] Verifying token for: {request.method} {request.path}")
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            print("[AUTH] No authorization header found")
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
            print(f"[AUTH] Token extracted: {token[:20]}...")
            
            # Get Supabase client
            supabase = get_supabase_client()
            
            # Verify token by making a request with it
            print("[AUTH] Verifying with Supabase...")
            response = supabase.auth.get_user(token)
            
            if not response or not response.user:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Add user info to request
            request.user_id = response.user.id
            request.user_email = response.user.email
            request.user = response.user  # Store full user object
            request.access_token = token  # Store the access token for RLS
            
            # Fetch role from profiles table using the USER'S token (not admin)
            # This bypasses RLS issues since user can read their own profile
            try:
                user_supabase = get_supabase_client_with_token(token)
                profile_response = user_supabase.table('profiles').select('role').eq('id', response.user.id).execute()
                
                if profile_response.data and len(profile_response.data) > 0:
                    request.user_role = profile_response.data[0]['role']
                else:
                    # Fallback to user_metadata if profile not found
                    request.user_role = response.user.user_metadata.get('role', 'customer')
            except Exception as profile_error:
                print(f"Could not fetch profile: {str(profile_error)}, using metadata")
                request.user_role = response.user.user_metadata.get('role', 'customer')
            
            print(f"User authenticated: {request.user_email}, Role: {request.user_role}")
            
            return f(*args, **kwargs)
            
        except Exception as e:
            print("="*60)
            print("[AUTH ERROR] Token verification failed!")
            print(f"Error: {str(e)}")
            print(f"Request path: {request.path}")
            print(f"Request method: {request.method}")
            import traceback
            traceback.print_exc()
            print("="*60)
            return jsonify({'error': 'Invalid or expired token', 'details': str(e)}), 401
    
    return decorated_function

def get_authenticated_client():
    """Get Supabase client with the authenticated user's token"""
    token = getattr(request, 'access_token', None)
    if not token:
        raise ValueError("No access token found. Use @verify_token decorator first.")
    return get_supabase_client_with_token(token)

def require_role(required_role):
    """Decorator to check user role - accepts single role or list of roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_role = getattr(request, 'user_role', None)
            
            # Handle both single role and list of roles
            if isinstance(required_role, list):
                if user_role not in required_role:
                    print(f"Access denied: User role '{user_role}' not in required roles {required_role}")
                    return jsonify({'error': 'Insufficient permissions', 'user_role': user_role, 'required': required_role}), 403
            else:
                if user_role != required_role:
                    print(f"Access denied: User role '{user_role}' != required role '{required_role}'")
                    return jsonify({'error': 'Insufficient permissions', 'user_role': user_role, 'required': required_role}), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator