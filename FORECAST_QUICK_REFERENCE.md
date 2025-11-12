# 🔍 Forecasting System - Quick Reference

## 📂 File Structure Overview

```
backend/ml_models/
├── __init__.py                    # Package initializer
├── feature_engineering.py         # Feature creation & festival logic
├── forecast_engine.py             # Prediction generation
├── save_trained_models.py         # Model saving script
└── saved_models/                  # Trained model storage
    ├── lgb_model.pkl              # LightGBM trained model
    ├── xgb_model.pkl              # XGBoost trained model
    ├── catboost_model.pkl         # CatBoost trained model
    ├── ensemble_config.pkl        # Ensemble weights & config
    └── feature_cols.pkl           # Feature column names
```

---

## 🧩 Key Functions

### **feature_engineering.py**

```python
# Festival detection
detect_festival_for_date(date, category)
# Returns: (is_festival, festival_name, days_to_festival)

# Discount calculation
calculate_discount_for_date(date, category)
# Returns: discount_percent (float)

# Feature creation (100+ features)
create_features(df)
# Input: DataFrame with sale_date, product_name, quantity_sold
# Output: DataFrame with 100+ engineered features

# Get feature column names
get_feature_columns(df)
# Returns: List of feature column names
```

---

### **forecast_engine.py**

```python
# Load trained models
models = load_models(model_dir='backend/ml_models/saved_models')
# Returns: dict with lgb_model, xgb_model, catboost_model, weights

# Generate future dates
future_df = generate_future_dates(last_date, num_days=7)
# Returns: DataFrame with basic features for future dates

# Prepare features with lags
future_features = prepare_future_features_with_lags(future_df, historical_df)
# Returns: DataFrame with complete feature set

# Generate forecast (main function)
forecast_df = generate_forecast(csv_path, num_days=7, models=None)
# Returns: DataFrame with predictions
```

---

## 🔄 Workflow

### **Training Pipeline (Jupyter Notebook)**

```
1. Load CSV → 2. Feature Engineering → 3. Train Models → 4. Save Models
```

### **Prediction Pipeline (API)**

```
1. Load Models → 2. Load CSV → 3. Generate Features → 4. Predict → 5. Return JSON
```

---

## 📊 Feature Categories

| Category         | Count    | Examples                           |
| ---------------- | -------- | ---------------------------------- |
| Time-based       | 25       | day_of_week, month_sin, is_weekend |
| Lag features     | 16       | lag_1, lag_7, lag_30               |
| Rolling stats    | 35       | rolling_mean_7, rolling_std_30     |
| EWMA             | 6        | ewm_7, ewm_std_30                  |
| Interactions     | 15       | discount_festival_interaction      |
| Trend/Momentum   | 10       | wow_trend, mom_trend, acceleration |
| Product encoding | 8        | product_encoded, category_encoded  |
| **TOTAL**        | **~115** |                                    |

---

## 🎯 Festival Configuration

Festivals with prep days and category impacts:

| Festival  | Prep Days          | Impacted Categories                         |
| --------- | ------------------ | ------------------------------------------- |
| Diwali    | 4                  | Snacks (4.0x), Dairy (3.0x), Staples (2.5x) |
| Navratri  | 1 (9-day festival) | Staples (4.0x), Dairy (2.0x)                |
| Holi      | 2                  | Beverages (3.0x), Personal Care (2.5x)      |
| Christmas | 3                  | Dairy (3.0x), Beverages (2.5x)              |

---

## 🚀 Quick Commands

### **Install dependencies:**

```powershell
cd backend
pip install -r requirements.txt
```

### **Train models:**

```python
# In Jupyter notebook after running all cells:
%run backend/ml_models/save_trained_models.py
```

### **Start backend:**

```powershell
cd backend
python app.py
```

### **Test API:**

```powershell
# Status check
Invoke-RestMethod -Uri "http://localhost:5000/api/forecast/status" -Method GET

# Generate forecast
Invoke-RestMethod -Uri "http://localhost:5000/api/forecast/generate" -Method POST -ContentType "application/json" -Body '{"num_days": 7}'
```

---

## 🔢 Model Performance (from Notebook)

| Model        | R² Score | RMSE     | MAPE    |
| ------------ | -------- | -------- | ------- |
| LightGBM     | 0.85     | 12.5     | 18%     |
| XGBoost      | 0.83     | 13.2     | 19%     |
| CatBoost     | 0.84     | 12.8     | 18%     |
| **Ensemble** | **0.87** | **11.8** | **16%** |

---

## 📋 API Response Format

```json
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
    }
  ],
  "summary": {
    "total_products": 50,
    "total_quantity": 3500,
    "total_revenue": 125000.0,
    "date_range": {"start": "2025-11-11", "end": "2025-11-17"},
    "by_category": [...]
  }
}
```

---

## ⚙️ Configuration Variables

```python
# Festival dates (feature_engineering.py)
FESTIVAL_DATES_2025 = {...}
FESTIVAL_IMPACTS = {...}

# Ensemble weights (saved in ensemble_config.pkl)
weights = [0.35, 0.33, 0.32]  # LGB, XGB, CatBoost
ensemble_type = "Optimized Weights"  # or "Stacking"
```

---

## 🐛 Common Issues & Fixes

| Issue            | Fix                                      |
| ---------------- | ---------------------------------------- |
| Models not found | Run `save_trained_models.py` in notebook |
| Import errors    | `pip install -r requirements.txt`        |
| NaN predictions  | Check CSV has 30+ days of data           |
| CORS errors      | Backend on port 5000, frontend on 5173   |

---

## 📚 File Purposes

| File                     | Purpose                              |
| ------------------------ | ------------------------------------ |
| `feature_engineering.py` | Create 100+ features from raw data   |
| `forecast_engine.py`     | Load models and generate predictions |
| `forecast_routes.py`     | Flask API endpoints                  |
| `save_trained_models.py` | Export models from notebook          |
| `Forecast.jsx`           | Frontend UI component                |

---

**Quick Start:**

1. Train models in notebook → 2. Save models → 3. Start backend → 4. Click "Run Forecast"
