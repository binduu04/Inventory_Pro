"""
Feature Engineering Module for Sales Forecasting
Extracted from kirana_sales_forecasting_pipeline.ipynb
"""

import pandas as pd
import numpy as np
from datetime import timedelta

# ============================================
# FESTIVAL CONFIGURATION
# ============================================

# Festival Impact Configuration (same as data generation)
FESTIVAL_IMPACTS = {
    "Makar Sankranti": {"prep_days": 1, "duration_days": 1, "impact": {"Staples": 2.0, "Snacks": 1.8, "Dairy": 1.5}},
    "Republic Day": {"prep_days": 0, "duration_days": 1, "impact": {"Beverages": 1.5, "Snacks": 1.5}},
    "Valentine's Day": {"prep_days": 1, "duration_days": 1, "impact": {"Snacks": 2.0}},
    "Maha Shivratri": {"prep_days": 1, "duration_days": 1, "impact": {"Dairy": 2.0, "Staples": 2.5}},
    "Holi": {"prep_days": 2, "duration_days": 1, "impact": {"Beverages": 3.0, "Personal Care": 2.5, "Snacks": 2.0, "Dairy": 1.8}},
    "Eid ul-Fitr": {"prep_days": 3, "duration_days": 1, "impact": {"Dairy": 3.0, "Staples": 2.5, "Snacks": 3.0, "Beverages": 2.0}},
    "Ram Navami": {"prep_days": 1, "duration_days": 1, "impact": {"Dairy": 2.0, "Snacks": 2.5}},
    "Eid ul-Adha": {"prep_days": 2, "duration_days": 1, "impact": {"Staples": 2.5, "Dairy": 2.5, "Snacks": 2.0}},
    "Independence Day": {"prep_days": 0, "duration_days": 1, "impact": {"Beverages": 1.5, "Snacks": 1.5}},
    "Raksha Bandhan": {"prep_days": 1, "duration_days": 1, "impact": {"Snacks": 3.0, "Dairy": 1.5}},
    "Janmashtami": {"prep_days": 1, "duration_days": 1, "impact": {"Dairy": 2.5, "Snacks": 2.0}},
    "Navratri": {"prep_days": 1, "duration_days": 9, "impact": {"Staples": 4.0, "Dairy": 2.0, "Beverages": 2.0}},
    "Dussehra": {"prep_days": 1, "duration_days": 1, "impact": {"Snacks": 2.5, "Dairy": 1.8, "Beverages": 1.8}},
    "Diwali": {"prep_days": 4, "duration_days": 3, "impact": {"Snacks": 4.0, "Dairy": 3.0, "Staples": 2.5, "Beverages": 2.5, "Personal Care": 1.8}},
    "Bhai Dooj": {"prep_days": 1, "duration_days": 1, "impact": {"Snacks": 2.0}},
    "Christmas": {"prep_days": 3, "duration_days": 1, "impact": {"Beverages": 2.5, "Dairy": 3.0, "Snacks": 2.5}},
    "New Year Eve": {"prep_days": 2, "duration_days": 1, "impact": {"Beverages": 3.0, "Snacks": 2.5}}
}

# Festival Dates for 2025 (for future predictions)
FESTIVAL_DATES_2025 = {
    "Makar Sankranti": "2025-01-14",
    "Republic Day": "2025-01-26",
    "Valentine's Day": "2025-02-14",
    "Maha Shivratri": "2025-02-26",
    "Holi": "2025-03-14",
    "Eid ul-Fitr": "2025-03-31",
    "Ram Navami": "2025-04-06",
    "Eid ul-Adha": "2025-06-07",
    "Independence Day": "2025-08-15",
    "Raksha Bandhan": "2025-08-09",
    "Janmashtami": "2025-08-16",
    "Navratri": "2025-09-22",
    "Dussehra": "2025-10-02",
    "Diwali": "2025-10-20",
    "Bhai Dooj": "2025-10-23",
    "Christmas": "2025-12-25",
    "New Year Eve": "2025-12-31"
}

# Festival Dates for 2026 (for future predictions beyond 2025)
FESTIVAL_DATES_2026 = {
    "Makar Sankranti": "2026-01-14",
    "Republic Day": "2026-01-26",
    "Valentine's Day": "2026-02-14",
    "Maha Shivratri": "2026-02-17",
    "Holi": "2026-03-03",
    "Eid ul-Fitr": "2026-03-20",
    "Ram Navami": "2026-03-27",
    "Eid ul-Adha": "2026-05-27",
    "Independence Day": "2026-08-15",
    "Raksha Bandhan": "2026-07-29",
    "Janmashtami": "2026-08-06",
    "Navratri": "2026-09-11",
    "Dussehra": "2026-09-21",
    "Diwali": "2026-10-09",
    "Bhai Dooj": "2026-10-12",
    "Christmas": "2026-12-25",
    "New Year Eve": "2026-12-31"
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def detect_festival_for_date(date, category):
    """
    Detect if a given date falls in festival period for specific category
    Returns: (is_festival, festival_name, days_to_festival)
    """
    date = pd.to_datetime(date).date()
    year = date.year
    
    # Get festival calendar for year
    if year == 2025:
        festival_calendar = FESTIVAL_DATES_2025
    elif year == 2026:
        festival_calendar = FESTIVAL_DATES_2026
    else:
        festival_calendar = {}
    
    is_festival = 0
    festival_name = ""
    days_to_festival = 999
    
    for fest_name, fest_date_str in festival_calendar.items():
        fest_date = pd.to_datetime(fest_date_str).date()
        fest_info = FESTIVAL_IMPACTS.get(fest_name, {})
        
        prep_days = fest_info.get('prep_days', 0)
        duration_days = fest_info.get('duration_days', 1)
        
        prep_start = fest_date - timedelta(days=prep_days)
        fest_end = fest_date + timedelta(days=duration_days - 1)
        
        # Check if date falls in prep or festival period
        if prep_start <= date <= fest_end:
            # Check if category is impacted
            if category in fest_info.get('impact', {}):
                is_festival = 1
                festival_name = fest_name
                days_to_festival = (fest_date - date).days
                break
    
    return is_festival, festival_name, days_to_festival


def calculate_discount_for_date(date, category):
    """
    Calculate discount percent for a given date and category
    Uses the same logic as data generation
    """
    date = pd.to_datetime(date)
    day = date.date()
    discount = 0.0
    
    # 1. Daily rotating discount (2-3.5%)
    day_of_week = date.weekday()
    daily_category_map = {
        0: "Dairy", 1: "Beverages", 2: "Snacks", 3: "Personal Care",
        4: "Staples", 5: "Snacks", 6: "Beverages"
    }
    if category == daily_category_map.get(day_of_week):
        discount = max(discount, np.random.choice([2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5]))
    
    # 2. Flash sales (Every 3rd Wednesday - 12%)
    if day.weekday() == 2:
        week_of_month = (day.day - 1) // 7 + 1
        if week_of_month == 3:
            month_category_map = {
                1: "Beverages", 2: "Snacks", 3: "Personal Care", 4: "Dairy",
                5: "Beverages", 6: "Snacks", 7: "Personal Care", 8: "Dairy",
                9: "Beverages", 10: "Snacks", 11: "Personal Care", 12: "Dairy"
            }
            if category == month_category_map.get(day.month):
                discount = max(discount, 12.0)
    
    # 3. Festival prep discounts (10-15%)
    festival_calendar = FESTIVAL_DATES_2025 if day.year == 2025 else FESTIVAL_DATES_2026 if day.year == 2026 else {}
    for fest_name, fest_date_str in festival_calendar.items():
        if fest_name not in {"Diwali", "Christmas", "Navratri"}:
            continue
        fest_date = pd.to_datetime(fest_date_str).date()
        days_before = (fest_date - day).days
        if 1 <= days_before <= 2:
            if category in ["Snacks", "Beverages"]:
                discount = max(discount, 15.0)
            else:
                discount = max(discount, 10.0)
    
    return round(discount, 2)


# ============================================
# FEATURE ENGINEERING FUNCTION
# ============================================

def create_features(df):
    """
    Create ADVANCED feature set for improved forecasting accuracy
    
    Parameters:
    -----------
    df : pandas.DataFrame
        Input dataframe with columns: sale_date, product_name, category, quantity_sold, 
        price, cost_price, season_affinity, discount_percent, is_festival, etc.
    
    Returns:
    --------
    pandas.DataFrame
        DataFrame with 100+ engineered features
    """
    df = df.copy()
    
    # ============================================
    # 1. TIME-BASED FEATURES (Enhanced)
    # ============================================
    df['day_of_week'] = df['sale_date'].dt.dayofweek
    df['day_of_month'] = df['sale_date'].dt.day
    df['week_of_year'] = df['sale_date'].dt.isocalendar().week
    df['month'] = df['sale_date'].dt.month
    df['quarter'] = df['sale_date'].dt.quarter
    df['year'] = df['sale_date'].dt.year
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['is_month_start'] = (df['day_of_month'] <= 7).astype(int)
    df['is_month_end'] = (df['day_of_month'] >= 23).astype(int)
    df['days_in_month'] = df['sale_date'].dt.days_in_month
    df['day_of_year'] = df['sale_date'].dt.dayofyear
    
    # NEW: Pay day features (1st, 15th, 30th)
    df['is_payday'] = df['day_of_month'].isin([1, 15, 30]).astype(int)
    df['days_since_month_start'] = df['day_of_month']
    df['days_until_month_end'] = df['days_in_month'] - df['day_of_month']
    
    # Cyclical encoding for month and day_of_week
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    df['dow_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['dow_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    df['day_of_year_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365)
    df['day_of_year_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365)
    
    # ============================================
    # 2. PRODUCT ENCODING (Enhanced Target Encoding)
    # ============================================
    # Calculate mean sales per product
    product_means = df.groupby('product_name')['quantity_sold'].mean()
    product_std = df.groupby('product_name')['quantity_sold'].std()
    product_median = df.groupby('product_name')['quantity_sold'].median()
    product_max = df.groupby('product_name')['quantity_sold'].max()
    
    df['product_encoded'] = df['product_name'].map(product_means)
    df['product_std'] = df['product_name'].map(product_std).fillna(0)
    df['product_median'] = df['product_name'].map(product_median)
    df['product_max'] = df['product_name'].map(product_max)
    
    # Category encoding
    category_means = df.groupby('category')['quantity_sold'].mean()
    category_std = df.groupby('category')['quantity_sold'].std()
    df['category_encoded'] = df['category'].map(category_means)
    df['category_std'] = df['category'].map(category_std)
    
    # Product-Category interaction
    prod_cat_means = df.groupby(['product_name', 'category'])['quantity_sold'].mean()
    df['product_category_encoded'] = df.apply(
        lambda x: prod_cat_means.get((x['product_name'], x['category']), x['product_encoded']), 
        axis=1
    )
    
    # ============================================
    # 3. ENHANCED LAG FEATURES (1, 3, 7, 14, 21, 30 days)
    # ============================================
    for lag in [1, 3, 7, 14, 21, 30]:
        df[f'lag_{lag}'] = df.groupby('product_name')['quantity_sold'].shift(lag)
    
    # NEW: Lag differences (momentum/trend indicators)
    df['lag_diff_7_1'] = df['lag_1'] - df['lag_7']
    df['lag_diff_14_7'] = df['lag_7'] - df['lag_14']
    df['lag_diff_30_14'] = df['lag_14'] - df['lag_30']
    
    # NEW: Percentage changes
    df['lag_pct_change_7'] = (df['lag_1'] - df['lag_7']) / (df['lag_7'] + 1)
    df['lag_pct_change_30'] = (df['lag_7'] - df['lag_30']) / (df['lag_30'] + 1)
    
    # ============================================
    # 4. ENHANCED ROLLING STATISTICS (3, 7, 14, 30-day windows)
    # ============================================
    for window in [3, 7, 14, 30]:
        # Rolling mean
        df[f'rolling_mean_{window}'] = df.groupby('product_name')['quantity_sold'].transform(
            lambda x: x.rolling(window, min_periods=1).mean()
        )
        # Rolling std
        df[f'rolling_std_{window}'] = df.groupby('product_name')['quantity_sold'].transform(
            lambda x: x.rolling(window, min_periods=1).std()
        )
        # Rolling min
        df[f'rolling_min_{window}'] = df.groupby('product_name')['quantity_sold'].transform(
            lambda x: x.rolling(window, min_periods=1).min()
        )
        # Rolling max
        df[f'rolling_max_{window}'] = df.groupby('product_name')['quantity_sold'].transform(
            lambda x: x.rolling(window, min_periods=1).max()
        )
        # NEW: Rolling median
        df[f'rolling_median_{window}'] = df.groupby('product_name')['quantity_sold'].transform(
            lambda x: x.rolling(window, min_periods=1).median()
        )
        # NEW: Rolling quantiles
        df[f'rolling_q25_{window}'] = df.groupby('product_name')['quantity_sold'].transform(
            lambda x: x.rolling(window, min_periods=1).quantile(0.25)
        )
        df[f'rolling_q75_{window}'] = df.groupby('product_name')['quantity_sold'].transform(
            lambda x: x.rolling(window, min_periods=1).quantile(0.75)
        )
    
    # NEW: Coefficient of variation (volatility measure)
    df['cv_7'] = df['rolling_std_7'] / (df['rolling_mean_7'] + 1)
    df['cv_30'] = df['rolling_std_30'] / (df['rolling_mean_30'] + 1)
    
    # ============================================
    # 5. EXPONENTIALLY WEIGHTED MOVING AVERAGE (Enhanced)
    # ============================================
    df['ewm_3'] = df.groupby('product_name')['quantity_sold'].transform(
        lambda x: x.ewm(span=3, adjust=False).mean()
    )
    df['ewm_7'] = df.groupby('product_name')['quantity_sold'].transform(
        lambda x: x.ewm(span=7, adjust=False).mean()
    )
    df['ewm_14'] = df.groupby('product_name')['quantity_sold'].transform(
        lambda x: x.ewm(span=14, adjust=False).mean()
    )
    df['ewm_30'] = df.groupby('product_name')['quantity_sold'].transform(
        lambda x: x.ewm(span=30, adjust=False).mean()
    )
    
    # NEW: EWMA Standard deviation
    df['ewm_std_7'] = df.groupby('product_name')['quantity_sold'].transform(
        lambda x: x.ewm(span=7, adjust=False).std()
    )
    df['ewm_std_30'] = df.groupby('product_name')['quantity_sold'].transform(
        lambda x: x.ewm(span=30, adjust=False).std()
    )
    
    # ============================================
    # 6. ENHANCED INTERACTION FEATURES
    # ============================================
    df['discount_festival_interaction'] = df['discount_percent'] * df['is_festival']
    df['weekend_festival_interaction'] = df['is_weekend'] * df['is_festival']
    df['discount_weekend_interaction'] = df['discount_percent'] * df['is_weekend']
    df['discount_squared'] = df['discount_percent'] ** 2
    df['discount_weekend_festival'] = df['discount_percent'] * df['is_weekend'] * df['is_festival']
    
    # NEW: Price-related interactions
    df['discount_price_interaction'] = df['discount_percent'] * df['price']
    df['festival_price_interaction'] = df['is_festival'] * df['price']
    
    # ============================================
    # 7. SEASON ENCODING
    # ============================================
    season_map = {'all': 0, 'summer': 1, 'winter': 2, 'monsoon': 3}
    df['season_encoded'] = df['season_affinity'].map(season_map)
    
    # NEW: Season interactions
    df['season_month_interaction'] = df['season_encoded'] * df['month']
    df['season_festival_interaction'] = df['season_encoded'] * df['is_festival']
    
    # ============================================
    # 8. ENHANCED PRICE-RELATED FEATURES
    # ============================================
    df['price_discount_ratio'] = df['final_price'] / df['price']
    df['profit_margin'] = (df['price'] - df['cost_price']) / df['price']
    df['discount_amount'] = df['price'] - df['final_price']
    df['profit_amount'] = df['price'] - df['cost_price']
    df['price_to_cost_ratio'] = df['price'] / df['cost_price']
    
    # NEW: Discount elasticity proxy
    df['discount_impact'] = df['discount_percent'] / (df['price'] + 1)
    
    # ============================================
    # 9. NEW: TREND AND MOMENTUM FEATURES
    # ============================================
    # Week-over-week trend
    df['wow_trend'] = df['lag_7'] - df['lag_14']
    df['wow_trend_pct'] = (df['lag_7'] - df['lag_14']) / (df['lag_14'] + 1)
    
    # Month-over-month trend
    df['mom_trend'] = df['lag_7'] - df['lag_30']
    df['mom_trend_pct'] = (df['lag_7'] - df['lag_30']) / (df['lag_30'] + 1)
    
    # Acceleration (second derivative)
    df['acceleration'] = (df['lag_1'] - df['lag_7']) - (df['lag_7'] - df['lag_14'])
    
    # ============================================
    # 10. NEW: SAME-DAY-OF-WEEK PATTERNS
    # ============================================
    # Average sales on same day of week (last 4 weeks)
    for product in df['product_name'].unique():
        product_mask = df['product_name'] == product
        for dow in range(7):
            dow_mask = product_mask & (df['day_of_week'] == dow)
            df.loc[dow_mask, f'same_dow_mean_4w'] = df.loc[dow_mask, 'quantity_sold'].rolling(4, min_periods=1).mean().shift(1)
    
    # Fill NaN for new feature
    df['same_dow_mean_4w'] = df['same_dow_mean_4w'].fillna(df['rolling_mean_7'])
    
    return df


# ============================================
# UTILITY FUNCTIONS
# ============================================

def get_feature_columns(df):
    """
    Get list of feature columns (exclude metadata and target)
    """
    exclude_cols = [
        'sale_date', 'product_name', 'category', 'season_affinity', 
        'festival_name', 'quantity_sold', 'revenue', 'profit', 'product_id'
    ]
    feature_cols = [col for col in df.columns if col not in exclude_cols]
    return feature_cols
