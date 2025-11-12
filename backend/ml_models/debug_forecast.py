"""
Debug script to compare feature generation between notebook and separate files
"""
import sys
import os

# Add parent directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import pandas as pd
import numpy as np
import joblib

# Import from local modules
import feature_engineering
import forecast_engine

# Load historical data
csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                        'kirana_sales_data_v2.3_production_discount.csv')
print(f"Loading CSV from: {csv_path}")
df = pd.read_csv(csv_path)
df['sale_date'] = pd.to_datetime(df['sale_date'])

# Create features
print("\n" + "="*80)
print("1. CREATING FEATURES FROM RAW DATA")
print("="*80)
df_features = feature_engineering.create_features(df)
print(f"Features created: {len(df_features.columns)} columns")
print(f"Rows before dropna: {len(df_features)}")

# Drop NaN
df_clean = df_features.dropna().reset_index(drop=True)
print(f"Rows after dropna: {len(df_clean)}")

# Get feature columns
feature_cols_generated = feature_engineering.get_feature_columns(df_clean)
print(f"Generated feature columns: {len(feature_cols_generated)}")

# Load saved feature columns
models = forecast_engine.load_models()
feature_cols_saved = models['feature_cols']
print(f"\nSaved feature columns: {len(feature_cols_saved)}")

# Compare
print("\n" + "="*80)
print("2. COMPARING FEATURE COLUMNS")
print("="*80)

if set(feature_cols_generated) == set(feature_cols_saved):
    print("✓ Feature sets MATCH!")
else:
    missing_in_generated = set(feature_cols_saved) - set(feature_cols_generated)
    extra_in_generated = set(feature_cols_generated) - set(feature_cols_saved)
    
    if missing_in_generated:
        print(f"\n✗ Missing in generated ({len(missing_in_generated)}):")
        for col in sorted(missing_in_generated):
            print(f"  - {col}")
    
    if extra_in_generated:
        print(f"\n✗ Extra in generated ({len(extra_in_generated)}):")
        for col in sorted(extra_in_generated):
            print(f"  - {col}")

# Check if order matters
if list(feature_cols_generated) == list(feature_cols_saved):
    print("\n✓ Feature ORDER also matches!")
else:
    print("\n✗ Feature ORDER differs (but sets might be same)")

# Test forecast with one product
print("\n" + "="*80)
print("3. TESTING FORECAST FOR ONE PRODUCT")
print("="*80)

test_product = 'Aashirvaad Atta 5kg'
hist_product = df_clean[df_clean['product_name'] == test_product].tail(5)

print(f"\nLast 5 days for {test_product}:")
print(hist_product[['sale_date', 'quantity_sold', 'lag_1', 'lag_7', 'rolling_mean_7']].to_string())

# Check what saved model expects
print(f"\n\nFeature columns model expects (first 10):")
for i, col in enumerate(feature_cols_saved[:10], 1):
    print(f"  {i:2d}. {col}")

print(f"\n\nFeature columns we generate (first 10):")
for i, col in enumerate(feature_cols_generated[:10], 1):
    print(f"  {i:2d}. {col}")

# Sample values comparison
print("\n" + "="*80)
print("4. SAMPLE FEATURE VALUES FOR LAST ROW")
print("="*80)
last_row = df_clean.iloc[-1]
print(f"Product: {last_row['product_name']}")
print(f"Date: {last_row['sale_date']}")
print(f"Quantity: {last_row['quantity_sold']}")
print(f"\nSample features:")
sample_features = ['lag_1', 'lag_7', 'rolling_mean_7', 'product_encoded', 'discount_percent', 
                   'is_festival', 'is_weekend', 'month', 'day_of_week']
for feat in sample_features:
    if feat in last_row:
        print(f"  {feat:20s}: {last_row[feat]}")
