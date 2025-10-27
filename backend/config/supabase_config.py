import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

def get_supabase_client() -> Client:
    """Create and return Supabase client with anon key"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_admin_client() -> Client:
    """Create and return Supabase client with service role key (bypasses RLS)"""
    if not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY not set in environment variables")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_supabase_client_with_token(access_token: str) -> Client:
    """Create and return Supabase client with user's access token"""
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    # Set the user's access token for RLS policies
    client.postgrest.auth(access_token)
    return client