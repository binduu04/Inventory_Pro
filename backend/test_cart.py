"""
Quick test script to verify cart_items table exists and is accessible
Run this from the backend directory: python test_cart.py
"""

from config.supabase_config import get_supabase_client

def test_cart_table():
    try:
        supabase = get_supabase_client()
        
        # Try to query cart_items table
        print("Testing cart_items table access...")
        response = supabase.table('cart_items').select('*').limit(1).execute()
        
        print("✅ SUCCESS! cart_items table exists and is accessible")
        print(f"Response: {response}")
        return True
        
    except Exception as e:
        print("❌ ERROR! cart_items table not accessible")
        print(f"Error: {str(e)}")
        print("\nPlease run CART_TABLE_SETUP.sql in your Supabase SQL Editor")
        return False

if __name__ == '__main__':
    test_cart_table()
