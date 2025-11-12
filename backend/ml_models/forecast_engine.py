"""
Forecast Engine Module for Sales Forecasting
Handles model loading, prediction generation, and future feature preparation
"""

import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, timedelta
from .feature_engineering import (
    detect_festival_for_date, calculate_discount_for_date,
    create_features, get_feature_columns
)


# ============================================
# MODEL LOADING
# ============================================

def load_models(model_dir=None):
    """
    Load trained ML models and ensemble weights
    
    Returns:
    --------
    dict with keys: 'lgb_model', 'xgb_model', 'catboost_model', 
                     'ensemble_weights', 'ensemble_type', 'meta_model'
    """
    models = {}
    
    # Determine model directory path
    if model_dir is None:
        # Get the directory where this file is located
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(current_dir, 'saved_models')
    
    # Load LightGBM
    lgb_path = os.path.join(model_dir, 'lgb_model.pkl')
    if os.path.exists(lgb_path):
        models['lgb_model'] = joblib.load(lgb_path)
        print(f"[OK] Loaded LightGBM model from {lgb_path}")
    else:
        raise FileNotFoundError(f"LightGBM model not found at {lgb_path}")
    
    # Load XGBoost
    xgb_path = os.path.join(model_dir, 'xgb_model.pkl')
    if os.path.exists(xgb_path):
        models['xgb_model'] = joblib.load(xgb_path)
        print(f"[OK] Loaded XGBoost model from {xgb_path}")
    else:
        raise FileNotFoundError(f"XGBoost model not found at {xgb_path}")
    
    # Load CatBoost
    catboost_path = os.path.join(model_dir, 'catboost_model.pkl')
    if os.path.exists(catboost_path):
        models['catboost_model'] = joblib.load(catboost_path)
        print(f"[OK] Loaded CatBoost model from {catboost_path}")
    else:
        raise FileNotFoundError(f"CatBoost model not found at {catboost_path}")
    
    # Load ensemble configuration
    ensemble_config_path = os.path.join(model_dir, 'ensemble_config.pkl')
    if os.path.exists(ensemble_config_path):
        ensemble_config = joblib.load(ensemble_config_path)
        models['ensemble_weights'] = ensemble_config.get('weights', np.array([1/3, 1/3, 1/3]))
        models['ensemble_type'] = ensemble_config.get('type', 'Simple Average')
        models['meta_model'] = ensemble_config.get('meta_model', None)
        print(f"[OK] Loaded ensemble config: {models['ensemble_type']}")
    else:
        print("[WARNING] Ensemble config not found, using simple average")
        models['ensemble_weights'] = np.array([1/3, 1/3, 1/3])
        models['ensemble_type'] = 'Simple Average'
        models['meta_model'] = None
    
    # Load feature columns
    feature_cols_path = os.path.join(model_dir, 'feature_cols.pkl')
    if os.path.exists(feature_cols_path):
        models['feature_cols'] = joblib.load(feature_cols_path)
        print(f"[OK] Loaded {len(models['feature_cols'])} feature columns")
    else:
        print("[WARNING] Feature columns file not found, will use generated features")
        models['feature_cols'] = None
    
    return models


# ============================================
# FUTURE FEATURE GENERATION
# ============================================

def generate_future_dates(last_date, num_days=7, product_info_dict=None):
    """
    Generate future dates dataframe with basic features
    
    Parameters:
    -----------
    last_date : str or datetime
        Last date in historical data
    num_days : int
        Number of days to forecast ahead
    product_info_dict : dict
        Product master data (required)
    
    Returns:
    --------
    pandas.DataFrame with future dates and basic features
    """
    if product_info_dict is None:
        raise ValueError("product_info_dict is required")
    
    last_date = pd.to_datetime(last_date)
    
    # Generate future dates
    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1),
        periods=num_days,
        freq='D'
    )
    
    # Create future records for all products
    future_records = []
    
    for product_name, product_info in product_info_dict.items():
        category = product_info['category']
        season_affinity = product_info['season_affinity']
        price = product_info['price']
        cost_price = product_info['cost_price']
        
        for date in future_dates:
            # Detect festival
            is_festival, festival_name, days_to_fest = detect_festival_for_date(date, category)
            
            # Calculate discount
            discount_percent = calculate_discount_for_date(date, category)
            
            # Calculate final price
            final_price = price * (1 - discount_percent / 100)
            
            # Time features
            day_of_week = date.dayofweek
            month = date.month
            year = date.year
            is_weekend = 1 if day_of_week >= 5 else 0
            
            record = {
                'sale_date': date,
                'product_name': product_name,
                'category': category,
                'season_affinity': season_affinity,
                'price': price,
                'cost_price': cost_price,
                'discount_percent': discount_percent,
                'final_price': final_price,
                'is_festival': is_festival,
                'festival_name': festival_name,
                'days_to_festival': days_to_fest,
                'day_of_week': day_of_week,
                'month': month,
                'year': year,
                'is_weekend': is_weekend,
                'quantity_sold': 0  # Placeholder for lag calculations
            }
            
            future_records.append(record)
    
    future_df = pd.DataFrame(future_records)
    return future_df


def prepare_future_features_with_lags(future_df, historical_df):
    """
    Prepare complete feature set for future dates including lag features
    
    Parameters:
    -----------
    future_df : pandas.DataFrame
        Future dates with basic features
    historical_df : pandas.DataFrame
        Historical data with all features already computed
    
    Returns:
    --------
    pandas.DataFrame with complete feature set
    """
    future_df = future_df.copy()
    
    # ============================================
    # PRODUCT ENCODING (from historical data)
    # ============================================
    product_means = historical_df.groupby('product_name')['quantity_sold'].mean()
    product_std = historical_df.groupby('product_name')['quantity_sold'].std()
    product_median = historical_df.groupby('product_name')['quantity_sold'].median()
    product_max = historical_df.groupby('product_name')['quantity_sold'].max()
    
    future_df['product_encoded'] = future_df['product_name'].map(product_means)
    future_df['product_std'] = future_df['product_name'].map(product_std).fillna(0)
    future_df['product_median'] = future_df['product_name'].map(product_median)
    future_df['product_max'] = future_df['product_name'].map(product_max)
    
    # ============================================
    # LAG FEATURES AND ROLLING STATS
    # ============================================
    # Get last 30 days of data per product for lag calculation
    for product in future_df['product_name'].unique():
        historical_product = historical_df[historical_df['product_name'] == product].sort_values('sale_date')
        
        if len(historical_product) == 0:
            continue
        
        # Get last N values for lags
        last_values = historical_product['quantity_sold'].tail(30).values
        
        # Create mask for this product in future df
        future_product_mask = future_df['product_name'] == product
        
        # Lag features (use last historical values)
        if len(last_values) >= 1:
            future_df.loc[future_product_mask, 'lag_1'] = last_values[-1] if len(last_values) >= 1 else 0
        if len(last_values) >= 3:
            future_df.loc[future_product_mask, 'lag_3'] = last_values[-3] if len(last_values) >= 3 else last_values[-1]
        if len(last_values) >= 7:
            future_df.loc[future_product_mask, 'lag_7'] = last_values[-7] if len(last_values) >= 7 else last_values[-1]
        if len(last_values) >= 14:
            future_df.loc[future_product_mask, 'lag_14'] = last_values[-14] if len(last_values) >= 14 else last_values[-1]
        if len(last_values) >= 21:
            future_df.loc[future_product_mask, 'lag_21'] = last_values[-21] if len(last_values) >= 21 else last_values[-1]
        if len(last_values) >= 30:
            future_df.loc[future_product_mask, 'lag_30'] = last_values[-30] if len(last_values) >= 30 else last_values[-1]
        
        # Fill missing lags with fallback values
        lag_1 = future_df.loc[future_product_mask, 'lag_1'].fillna(0).values[0] if 'lag_1' in future_df.columns else 0
        lag_7 = future_df.loc[future_product_mask, 'lag_7'].fillna(lag_1).values[0] if 'lag_7' in future_df.columns else lag_1
        lag_14 = future_df.loc[future_product_mask, 'lag_14'].fillna(lag_7).values[0] if 'lag_14' in future_df.columns else lag_7
        lag_30 = future_df.loc[future_product_mask, 'lag_30'].fillna(lag_14).values[0] if 'lag_30' in future_df.columns else lag_14
        
        # Lag differences
        future_df.loc[future_product_mask, 'lag_diff_7_1'] = lag_1 - lag_7
        future_df.loc[future_product_mask, 'lag_diff_14_7'] = lag_7 - lag_14
        future_df.loc[future_product_mask, 'lag_diff_30_14'] = lag_14 - lag_30
        
        # Percentage changes
        future_df.loc[future_product_mask, 'lag_pct_change_7'] = (lag_1 - lag_7) / (lag_7 + 1)
        future_df.loc[future_product_mask, 'lag_pct_change_30'] = (lag_7 - lag_30) / (lag_30 + 1)
        
        # Rolling statistics (use last available values from historical data)
        for window in [3, 7, 14, 30]:
            if len(last_values) >= window:
                rolling_data = last_values[-window:]
                rolling_mean = np.mean(rolling_data)
                rolling_std = np.std(rolling_data)
                rolling_min = np.min(rolling_data)
                rolling_max = np.max(rolling_data)
                rolling_median = np.median(rolling_data)
                rolling_q25 = np.percentile(rolling_data, 25)
                rolling_q75 = np.percentile(rolling_data, 75)
            else:
                rolling_mean = np.mean(last_values) if len(last_values) > 0 else 0
                rolling_std = np.std(last_values) if len(last_values) > 0 else 0
                rolling_min = np.min(last_values) if len(last_values) > 0 else 0
                rolling_max = np.max(last_values) if len(last_values) > 0 else 0
                rolling_median = np.median(last_values) if len(last_values) > 0 else 0
                rolling_q25 = rolling_min
                rolling_q75 = rolling_max
            
            future_df.loc[future_product_mask, f'rolling_mean_{window}'] = rolling_mean
            future_df.loc[future_product_mask, f'rolling_std_{window}'] = rolling_std
            future_df.loc[future_product_mask, f'rolling_min_{window}'] = rolling_min
            future_df.loc[future_product_mask, f'rolling_max_{window}'] = rolling_max
            future_df.loc[future_product_mask, f'rolling_median_{window}'] = rolling_median
            future_df.loc[future_product_mask, f'rolling_q25_{window}'] = rolling_q25
            future_df.loc[future_product_mask, f'rolling_q75_{window}'] = rolling_q75
        
        # Coefficient of variation
        rolling_mean_7 = future_df.loc[future_product_mask, 'rolling_mean_7'].values[0] if 'rolling_mean_7' in future_df.columns else 1
        rolling_std_7 = future_df.loc[future_product_mask, 'rolling_std_7'].values[0] if 'rolling_std_7' in future_df.columns else 0
        rolling_mean_30 = future_df.loc[future_product_mask, 'rolling_mean_30'].values[0] if 'rolling_mean_30' in future_df.columns else 1
        rolling_std_30 = future_df.loc[future_product_mask, 'rolling_std_30'].values[0] if 'rolling_std_30' in future_df.columns else 0
        
        future_df.loc[future_product_mask, 'cv_7'] = rolling_std_7 / (rolling_mean_7 + 1)
        future_df.loc[future_product_mask, 'cv_30'] = rolling_std_30 / (rolling_mean_30 + 1)
        
        # EWMA features (approximate using last rolling mean)
        future_df.loc[future_product_mask, 'ewm_3'] = future_df.loc[future_product_mask, 'rolling_mean_3']
        future_df.loc[future_product_mask, 'ewm_7'] = future_df.loc[future_product_mask, 'rolling_mean_7']
        future_df.loc[future_product_mask, 'ewm_14'] = future_df.loc[future_product_mask, 'rolling_mean_14']
        future_df.loc[future_product_mask, 'ewm_30'] = future_df.loc[future_product_mask, 'rolling_mean_30']
        future_df.loc[future_product_mask, 'ewm_std_7'] = rolling_std_7
        future_df.loc[future_product_mask, 'ewm_std_30'] = rolling_std_30
        
        # Trend features
        future_df.loc[future_product_mask, 'wow_trend'] = lag_7 - lag_14
        future_df.loc[future_product_mask, 'wow_trend_pct'] = (lag_7 - lag_14) / (lag_14 + 1)
        future_df.loc[future_product_mask, 'mom_trend'] = lag_7 - lag_30
        future_df.loc[future_product_mask, 'mom_trend_pct'] = (lag_7 - lag_30) / (lag_30 + 1)
        future_df.loc[future_product_mask, 'acceleration'] = (lag_1 - lag_7) - (lag_7 - lag_14)
        
        # Same day of week mean (approximation)
        future_df.loc[future_product_mask, 'same_dow_mean_4w'] = rolling_mean_7
    
    # ============================================
    # CATEGORY ENCODING
    # ============================================
    category_means = historical_df.groupby('category')['quantity_sold'].mean()
    category_std = historical_df.groupby('category')['quantity_sold'].std()
    future_df['category_encoded'] = future_df['category'].map(category_means)
    future_df['category_std'] = future_df['category'].map(category_std)
    
    # Product-category interaction
    prod_cat_means = historical_df.groupby(['product_name', 'category'])['quantity_sold'].mean()
    future_df['product_category_encoded'] = future_df.apply(
        lambda x: prod_cat_means.get((x['product_name'], x['category']), x['product_encoded']), 
        axis=1
    )
    
    # ============================================
    # TIME-BASED FEATURES
    # ============================================
    future_df['day_of_month'] = future_df['sale_date'].dt.day
    future_df['week_of_year'] = future_df['sale_date'].dt.isocalendar().week
    future_df['quarter'] = future_df['sale_date'].dt.quarter
    future_df['is_month_start'] = (future_df['day_of_month'] <= 7).astype(int)
    future_df['is_month_end'] = (future_df['day_of_month'] >= 23).astype(int)
    future_df['days_in_month'] = future_df['sale_date'].dt.days_in_month
    future_df['day_of_year'] = future_df['sale_date'].dt.dayofyear
    
    # Payday features
    future_df['is_payday'] = future_df['day_of_month'].isin([1, 15, 30]).astype(int)
    future_df['days_since_month_start'] = future_df['day_of_month']
    future_df['days_until_month_end'] = future_df['days_in_month'] - future_df['day_of_month']
    
    # Cyclical encoding
    future_df['month_sin'] = np.sin(2 * np.pi * future_df['month'] / 12)
    future_df['month_cos'] = np.cos(2 * np.pi * future_df['month'] / 12)
    future_df['dow_sin'] = np.sin(2 * np.pi * future_df['day_of_week'] / 7)
    future_df['dow_cos'] = np.cos(2 * np.pi * future_df['day_of_week'] / 7)
    future_df['day_of_year_sin'] = np.sin(2 * np.pi * future_df['day_of_year'] / 365)
    future_df['day_of_year_cos'] = np.cos(2 * np.pi * future_df['day_of_year'] / 365)
    
    # ============================================
    # INTERACTION FEATURES
    # ============================================
    future_df['discount_festival_interaction'] = future_df['discount_percent'] * future_df['is_festival']
    future_df['weekend_festival_interaction'] = future_df['is_weekend'] * future_df['is_festival']
    future_df['discount_weekend_interaction'] = future_df['discount_percent'] * future_df['is_weekend']
    future_df['discount_squared'] = future_df['discount_percent'] ** 2
    future_df['discount_weekend_festival'] = future_df['discount_percent'] * future_df['is_weekend'] * future_df['is_festival']
    future_df['discount_price_interaction'] = future_df['discount_percent'] * future_df['price']
    future_df['festival_price_interaction'] = future_df['is_festival'] * future_df['price']
    
    # ============================================
    # SEASON ENCODING
    # ============================================
    season_map = {'all': 0, 'summer': 1, 'winter': 2, 'monsoon': 3}
    future_df['season_encoded'] = future_df['season_affinity'].map(season_map)
    future_df['season_month_interaction'] = future_df['season_encoded'] * future_df['month']
    future_df['season_festival_interaction'] = future_df['season_encoded'] * future_df['is_festival']
    
    # ============================================
    # PRICE FEATURES
    # ============================================
    future_df['price_discount_ratio'] = future_df['final_price'] / future_df['price']
    future_df['profit_margin'] = (future_df['price'] - future_df['cost_price']) / future_df['price']
    future_df['discount_amount'] = future_df['price'] - future_df['final_price']
    future_df['profit_amount'] = future_df['price'] - future_df['cost_price']
    future_df['price_to_cost_ratio'] = future_df['price'] / future_df['cost_price']
    future_df['discount_impact'] = future_df['discount_percent'] / (future_df['price'] + 1)
    
    # Fill any remaining NaN values
    future_df = future_df.fillna(0)
    
    return future_df


# ============================================
# PREDICTION GENERATION
# ============================================

def generate_forecast(csv_path, num_days=7, models=None):
    """
    Generate sales forecast for next N days
    
    Parameters:
    -----------
    csv_path : str
        Path to CSV file with historical sales data
    num_days : int
        Number of days to forecast ahead
    models : dict (optional)
        Pre-loaded models. If None, will load from default directory
    
    Returns:
    --------
    pandas.DataFrame with forecast results
    """
    # Load historical data
    print(f"Loading historical data from {csv_path}...")
    df = pd.read_csv(csv_path)
    df['sale_date'] = pd.to_datetime(df['sale_date'])
    df = df.sort_values('sale_date').reset_index(drop=True)
    
    last_date = df['sale_date'].max()
    print(f"   Last date in data: {last_date.date()}")
    print(f"   Total records: {len(df):,}")
    print(f"   Products: {df['product_name'].nunique()}")
    
    # Create product info dictionary from data
    product_info = df.groupby('product_name').agg({
        'category': 'first',
        'season_affinity': 'first',
        'price': 'first',
        'cost_price': 'first'
    }).to_dict('index')
    
    # Create features for historical data
    # CRITICAL: Keep FULL df_features (with NaN) for lag/rolling calculations
    print("Creating features for historical data...")
    df_features = create_features(df)
    print(f"   Total records with features: {len(df_features):,}")
    
    # Load models if not provided
    if models is None:
        print("Loading ML models...")
        models = load_models()
    
    # CRITICAL: Use saved feature columns from training, not newly generated ones
    if models['feature_cols'] is not None:
        feature_cols = models['feature_cols']
        print(f"   Using saved feature columns: {len(feature_cols)}")
    else:
        # Fallback to generating feature columns (not recommended)
        df_clean = df_features.dropna().reset_index(drop=True)
        feature_cols = get_feature_columns(df_clean)
        print(f"   [WARNING] Using generated feature columns: {len(feature_cols)}")
    
    # Generate future dates
    print(f"Generating features for next {num_days} days...")
    future_df = generate_future_dates(last_date, num_days, product_info)
    
    # CRITICAL: Pass FULL df_features (not cleaned) for accurate lag/rolling stats
    future_df_features = prepare_future_features_with_lags(future_df, df_features)
    
    # Ensure all required features are present
    missing_cols = set(feature_cols) - set(future_df_features.columns)
    if missing_cols:
        print(f"[WARNING] Filling missing features: {len(missing_cols)}")
        for col in missing_cols:
            future_df_features[col] = 0
    
    # Prepare feature matrix with EXACT order from training
    X_future = future_df_features[feature_cols].fillna(0)
    
    # Generate predictions
    print("Generating predictions...")
    
    # LightGBM
    pred_lgb = models['lgb_model'].predict(X_future, num_iteration=models['lgb_model'].best_iteration)
    pred_lgb = np.maximum(pred_lgb, 0)
    
    # XGBoost
    import xgboost as xgb
    dfuture = xgb.DMatrix(X_future)
    pred_xgb = models['xgb_model'].predict(dfuture)
    pred_xgb = np.maximum(pred_xgb, 0)
    
    # CatBoost
    pred_cat = models['catboost_model'].predict(X_future)
    pred_cat = np.maximum(pred_cat, 0)
    
    # Ensemble prediction
    ensemble_type = models['ensemble_type']
    if ensemble_type == 'Stacking' and models['meta_model'] is not None:
        meta_features = np.column_stack([pred_lgb, pred_xgb, pred_cat])
        pred_ensemble = models['meta_model'].predict(meta_features)
        pred_ensemble = np.maximum(pred_ensemble, 0)
    else:
        weights = models['ensemble_weights']
        pred_ensemble = weights[0] * pred_lgb + weights[1] * pred_xgb + weights[2] * pred_cat
        pred_ensemble = np.maximum(pred_ensemble, 0)
    
    # Add predictions to dataframe
    future_df_features['predicted_quantity'] = pred_ensemble.round().astype(int)
    future_df_features['forecasted_revenue'] = (
        future_df_features['predicted_quantity'] * future_df_features['final_price']
    )
    
    # Select relevant columns for output
    output_df = future_df_features[[
        'sale_date', 'product_name', 'category', 'price', 'discount_percent',
        'final_price', 'is_festival', 'festival_name', 'predicted_quantity', 'forecasted_revenue'
    ]].copy()
    
    print("[SUCCESS] Forecast generated successfully!")
    print(f"   Total predictions: {len(output_df):,}")
    print(f"   Date range: {output_df['sale_date'].min().date()} to {output_df['sale_date'].max().date()}")
    
    return output_df
