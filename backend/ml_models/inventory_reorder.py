"""
Inventory Reorder Logic Module
Calculates reorder quantities based on forecast and current stock
"""

import pandas as pd
import numpy as np


# ============================================
# PRODUCT SHELF LIFE CONFIGURATION
# ============================================

# Define shelf life (in days) for different products
PRODUCT_SHELF_LIFE = {
    # Dairy - Short shelf life (daily delivery for milk)
    'Amul Milk 1L': 1,  # Daily delivery
    'Amul Milk 500ml': 1,  # Daily delivery
    'Britannia Milk Bread': 2,  # Fresh daily
    'Amul Butter 100g': 4,
    'Amul Butter 500g': 4,
    'Amul Cheese Slices 200g': 4,
    'Amul Paneer 200g': 3,
    'Mother Dairy Curd 400g': 3,
    'Nestle Dahi 400g': 3,
    
    # All other products - Standard shelf life
    # (Will default to 6 days for category-based logic)
}

# Category-based shelf life defaults
CATEGORY_SHELF_LIFE = {
    'Dairy': 4,  # Most dairy products last 3-4 days
    'Beverages': 6,
    'Snacks': 6,
    'Staples': 6,
    'Personal Care': 6
}

# Default values
DEFAULT_SAFETY_STOCK = 5
DEFAULT_LEAD_TIME_DAYS = 1


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_shelf_life_days(product_name, category):
    """
    Get shelf life in days for a product
    
    Parameters:
    -----------
    product_name : str
        Name of the product
    category : str
        Product category
    
    Returns:
    --------
    int : Shelf life in days
    """
    # Check product-specific shelf life first
    if product_name in PRODUCT_SHELF_LIFE:
        return PRODUCT_SHELF_LIFE[product_name]
    
    # Fall back to category-based shelf life
    return CATEGORY_SHELF_LIFE.get(category, 6)


def calculate_days_until_stockout(current_stock, daily_forecast):
    """
    Calculate how many days until stock runs out
    
    Parameters:
    -----------
    current_stock : int
        Current stock level
    daily_forecast : list
        List of daily forecasted quantities
    
    Returns:
    --------
    float : Days until stockout (can be fractional)
    """
    if current_stock <= 0:
        return 0.0
    
    cumulative = 0
    for day_idx, forecast_qty in enumerate(daily_forecast):
        cumulative += forecast_qty
        if cumulative >= current_stock:
            # Fractional day calculation
            remaining_after_previous_day = current_stock - (cumulative - forecast_qty)
            fraction = remaining_after_previous_day / forecast_qty if forecast_qty > 0 else 0
            return day_idx + fraction
    
    # Stock lasts beyond forecast period
    return len(daily_forecast) + (current_stock - cumulative) / (daily_forecast[-1] if daily_forecast[-1] > 0 else 1)


def get_urgency_status(days_until_stockout):
    """
    Determine urgency status based on days until stockout
    
    Parameters:
    -----------
    days_until_stockout : float
        Days until stock runs out
    
    Returns:
    --------
    str : 'red', 'yellow', or 'green'
    """
    if days_until_stockout <= 2:
        return 'red'  # CRITICAL: 0-2 days
    elif days_until_stockout <= 5:
        return 'yellow'  # WARNING: 3-5 days
    else:
        return 'green'  # GOOD: 6+ days


# ============================================
# MAIN REORDER CALCULATION
# ============================================

def calculate_reorder_recommendations(forecast_df, current_stock_dict, safety_stock=DEFAULT_SAFETY_STOCK, lead_time_days=DEFAULT_LEAD_TIME_DAYS):
    """
    Calculate reorder recommendations for all products
    
    Parameters:
    -----------
    forecast_df : pandas.DataFrame
        Forecast data with columns: date, product_name, category, predicted_quantity
    current_stock_dict : dict
        Dictionary mapping product_name -> current_stock_level
        Example: {'Amul Milk 1L': 50, 'Amul Butter 100g': 30, ...}
    safety_stock : int
        Safety stock buffer (default: 5 units)
    lead_time_days : int
        Lead time for replenishment (default: 1 day)
    
    Returns:
    --------
    pandas.DataFrame with columns:
        - product_name
        - category
        - current_stock
        - days_until_stockout
        - urgency_status (red/yellow/green)
        - recommended_order_qty
        - reorder_reason
        - forecast_7day_total
    """
    results = []
    
    # Group by product
    for product_name, product_forecast in forecast_df.groupby('product_name'):
        product_forecast = product_forecast.sort_values('sale_date').reset_index(drop=True)
        
        # Get product details
        category = product_forecast.iloc[0]['category']
        shelf_life_days = get_shelf_life_days(product_name, category)
        
        # Get current stock (default to 0 if not found)
        current_stock = current_stock_dict.get(product_name, 0)
        
        # Get daily forecast for next 7 days
        daily_forecast = product_forecast['predicted_quantity'].tolist()
        
        # Calculate days until stockout
        days_until_stockout = calculate_days_until_stockout(current_stock, daily_forecast)
        
        # Determine urgency status
        urgency_status = get_urgency_status(days_until_stockout)
        
        # ============================================
        # REORDER QUANTITY CALCULATION
        # ============================================
        
        # Calculate target stock based on shelf life
        # Target = forecast for shelf_life days + safety stock + lead time buffer
        
        # For products with daily delivery (shelf life = 1 day like milk)
        if shelf_life_days == 1:
            # Order for tomorrow + safety stock
            target_stock = daily_forecast[0] + safety_stock
            reorder_reason = f"Daily delivery item (1-day shelf life)"
        
        # For short shelf life dairy (3-4 days)
        elif shelf_life_days <= 4:
            # Order to cover next shelf_life days + safety stock
            forecast_sum = sum(daily_forecast[:shelf_life_days])
            target_stock = forecast_sum + safety_stock
            reorder_reason = f"Order to cover next {shelf_life_days} days + safety stock"
        
        # For all other products (6+ day shelf life)
        else:
            # Order to cover next 6 days + safety stock
            forecast_sum = sum(daily_forecast[:6])
            target_stock = forecast_sum + safety_stock
            reorder_reason = f"Order to cover next 6 days + safety stock"
        
        # Calculate recommended order quantity
        recommended_order_qty = max(0, target_stock - current_stock)
        
        # Round to nearest integer
        recommended_order_qty = int(np.round(recommended_order_qty))
        
        # If order quantity is 0 or stock exceeds target, mark as sufficient
        if recommended_order_qty == 0:
            reorder_reason = "Stock sufficient"
        
        # Calculate 7-day total forecast
        forecast_7day_total = int(sum(daily_forecast))
        
        # Append result
        results.append({
            'product_name': product_name,
            'category': category,
            'current_stock': current_stock,
            'shelf_life_days': shelf_life_days,
            'days_until_stockout': round(days_until_stockout, 1),
            'urgency_status': urgency_status,
            'target_stock': target_stock,
            'recommended_order_qty': recommended_order_qty,
            'reorder_reason': reorder_reason,
            'forecast_7day_total': forecast_7day_total,
            'forecast_day1': daily_forecast[0],
            'forecast_day2': daily_forecast[1] if len(daily_forecast) > 1 else 0,
            'forecast_day3': daily_forecast[2] if len(daily_forecast) > 2 else 0
        })
    
    # Convert to DataFrame
    reorder_df = pd.DataFrame(results)
    
    # Sort by urgency (red first, then yellow, then green)
    urgency_order = {'red': 0, 'yellow': 1, 'green': 2}
    reorder_df['urgency_sort'] = reorder_df['urgency_status'].map(urgency_order)
    reorder_df = reorder_df.sort_values(['urgency_sort', 'days_until_stockout']).reset_index(drop=True)
    reorder_df = reorder_df.drop('urgency_sort', axis=1)
    
    return reorder_df


# ============================================
# SUMMARY STATISTICS
# ============================================

def generate_reorder_summary(reorder_df):
    """
    Generate summary statistics for reorder recommendations
    
    Parameters:
    -----------
    reorder_df : pandas.DataFrame
        Reorder recommendations from calculate_reorder_recommendations()
    
    Returns:
    --------
    dict with summary statistics
    """
    summary = {
        'total_products': len(reorder_df),
        'critical_count': len(reorder_df[reorder_df['urgency_status'] == 'red']),
        'warning_count': len(reorder_df[reorder_df['urgency_status'] == 'yellow']),
        'good_count': len(reorder_df[reorder_df['urgency_status'] == 'green']),
        'total_order_qty': int(reorder_df['recommended_order_qty'].sum()),
        'products_needing_order': len(reorder_df[reorder_df['recommended_order_qty'] > 0])
    }
    
    # Category-wise breakdown
    category_breakdown = reorder_df.groupby('category').agg({
        'recommended_order_qty': 'sum',
        'urgency_status': lambda x: (x == 'red').sum()
    }).to_dict('index')
    
    summary['by_category'] = [
        {
            'category': cat,
            'total_order_qty': int(vals['recommended_order_qty']),
            'critical_count': int(vals['urgency_status'])
        }
        for cat, vals in category_breakdown.items()
    ]
    
    return summary


# ============================================
# EXAMPLE USAGE (for testing)
# ============================================

if __name__ == "__main__":
    # Example: Create mock forecast data
    dates = pd.date_range('2025-11-13', periods=7)
    products = ['Amul Milk 1L', 'Amul Butter 100g', 'Lays Chips 50g']
    categories = ['Dairy', 'Dairy', 'Snacks']
    
    forecast_data = []
    for product, category in zip(products, categories):
        for date in dates:
            forecast_data.append({
                'sale_date': date,
                'product_name': product,
                'category': category,
                'predicted_quantity': np.random.randint(10, 50)
            })
    
    forecast_df = pd.DataFrame(forecast_data)
    
    # Example: Current stock levels
    current_stock_dict = {
        'Amul Milk 1L': 25,
        'Amul Butter 100g': 15,
        'Lays Chips 50g': 100
    }
    
    # Calculate reorder recommendations
    reorder_df = calculate_reorder_recommendations(forecast_df, current_stock_dict)
    
    print("\n=== REORDER RECOMMENDATIONS ===")
    print(reorder_df.to_string(index=False))
    
    # Generate summary
    summary = generate_reorder_summary(reorder_df)
    print("\n=== SUMMARY ===")
    print(f"Critical: {summary['critical_count']}")
    print(f"Warning: {summary['warning_count']}")
    print(f"Good: {summary['good_count']}")
    print(f"Total Order Qty: {summary['total_order_qty']}")
