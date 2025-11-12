# 📊 Sales Forecasting System - Setup Guide

## 🎯 Overview

This guide will help you integrate the ML-based sales forecasting system into your inventory management application. The system uses an ensemble of LightGBM, XGBoost, and CatBoost models to predict 7-day product demand.

---

## 📁 Folder Structure

```
inventory_and_forecast/
├── kirana_sales_data_v2.3_production_discount.csv  # Historical sales data
├── kirana_sales_forecasting_pipeline.ipynb         # Training notebook
│
└── backend/
    ├── app.py                                       # ✅ Updated
    ├── requirements.txt                             # ✅ Updated
    │
    ├── ml_models/                                   # 🆕 NEW FOLDER
    │   ├── __init__.py                              # ✅ Created
    │   ├── feature_engineering.py                   # ✅ Created
    │   ├── forecast_engine.py                       # ✅ Created
    │   ├── save_trained_models.py                   # ✅ Created
    │   │
    │   └── saved_models/                            # 🔄 TO CREATE (next step)
    │       ├── lgb_model.pkl
    │       ├── xgb_model.pkl
    │       ├── catboost_model.pkl
    │       ├── ensemble_config.pkl
    │       └── feature_cols.pkl
    │
    └── routes/
        ├── forecast_routes.py                       # ✅ Created
        └── (other route files...)

frontend/
└── src/
    └── components/
        └── Forecast.jsx                             # ✅ Updated
```

---

## 🚀 Step-by-Step Setup

### **Step 1: Install Required Python Packages**

Navigate to the `backend/` folder and install dependencies:

```powershell
cd backend
pip install -r requirements.txt
```

**New packages added:**

- `pandas` - Data manipulation
- `numpy` - Numerical operations
- `scikit-learn` - ML utilities
- `lightgbm` - LightGBM model
- `xgboost` - XGBoost model
- `catboost` - CatBoost model
- `joblib` - Model serialization
- `scipy` - Optimization for ensemble weights

---

### **Step 2: Train Models in Jupyter Notebook**

1. **Open the Jupyter Notebook:**

   ```powershell
   jupyter notebook kirana_sales_forecasting_pipeline.ipynb
   ```

2. **Run all cells** in the notebook (Kernel → Restart & Run All)

3. **After training completes**, add a new cell at the end and run:

   ```python
   %run backend/ml_models/save_trained_models.py
   ```

4. **Verify models are saved:**
   - Check `backend/ml_models/saved_models/` folder
   - Should contain 5 files:
     - `lgb_model.pkl`
     - `xgb_model.pkl`
     - `catboost_model.pkl`
     - `ensemble_config.pkl`
     - `feature_cols.pkl`

---

### **Step 3: Test Forecast API**

1. **Start Flask backend:**

   ```powershell
   cd backend
   python app.py
   ```

2. **Test forecast status endpoint:**

   ```powershell
   # Using curl (PowerShell)
   Invoke-RestMethod -Uri "http://localhost:5000/api/forecast/status" -Method GET
   ```

   **Expected Response:**

   ```json
   {
     "success": true,
     "status": "ready",
     "models_loaded": true,
     "data_file_exists": true,
     "last_data_date": "2025-11-10"
   }
   ```

3. **Test forecast generation:**

   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/forecast/generate" -Method POST -ContentType "application/json" -Body '{"num_days": 7}'
   ```

   **Expected Response:**

   ```json
   {
     "success": true,
     "forecast": [
       {
         "date": "2025-11-11",
         "product_name": "Amul Milk 1L",
         "category": "Dairy",
         "predicted_quantity": 25,
         "forecasted_revenue": 1500.0,
         ...
       },
       ...
     ],
     "summary": {
       "total_products": 50,
       "total_quantity": 3500,
       "total_revenue": 125000.0,
       "date_range": {"start": "2025-11-11", "end": "2025-11-17"}
     }
   }
   ```

---

### **Step 4: Test Frontend Integration**

1. **Start React frontend:**

   ```powershell
   cd frontend
   npm run dev
   ```

2. **Navigate to Manager Dashboard → Forecast tab**

3. **Click "Run Forecast" button**

4. **Expected Result:**
   - Loading spinner appears
   - After 3-5 seconds, 7-day forecast table displays
   - Shows product names, categories, and predicted quantities
   - Color-coded cells (red = low stock, yellow = medium, green = good)
   - Dates shown in column headers (e.g., "Nov 11", "Nov 12")

---

## 📊 API Endpoints

### 1. **Generate Forecast**

- **Endpoint:** `POST /api/forecast/generate`
- **Request Body:**
  ```json
  {
    "num_days": 7
  }
  ```
- **Response:** Forecast data with predictions
- **Use Case:** Manager clicks "Run Forecast" button

---

### 2. **Check Forecast Status**

- **Endpoint:** `GET /api/forecast/status`
- **Response:**
  ```json
  {
    "success": true,
    "status": "ready",
    "models_loaded": true,
    "data_file_exists": true,
    "last_data_date": "2025-11-10"
  }
  ```
- **Use Case:** Verify system is ready before generating forecast

---

### 3. **Reload Models** (Optional)

- **Endpoint:** `POST /api/forecast/reload-models`
- **Use Case:** After retraining models, reload without restarting server

---

## 🧪 Testing Checklist

- [ ] ✅ Backend starts without errors
- [ ] ✅ `/api/forecast/status` returns `"status": "ready"`
- [ ] ✅ `/api/forecast/generate` returns 7-day predictions
- [ ] ✅ Frontend "Run Forecast" button works
- [ ] ✅ Table displays product names and quantities
- [ ] ✅ Dates shown in column headers
- [ ] ✅ Color coding works (red/yellow/green)

---

## 🔧 Troubleshooting

### **Issue: "Models not found" error**

**Solution:**

1. Check if `backend/ml_models/saved_models/` folder exists
2. Verify 5 `.pkl` files are present
3. Re-run `save_trained_models.py` in Jupyter notebook

---

### **Issue: "ImportError: No module named X"**

**Solution:**

```powershell
cd backend
pip install -r requirements.txt --upgrade
```

---

### **Issue: Frontend shows "Failed to generate forecast"**

**Check:**

1. Backend is running (`python app.py`)
2. Port 5000 is not blocked
3. Check browser console for CORS errors
4. Verify API endpoint: `http://localhost:5000/api/forecast/generate`

---

### **Issue: Predictions are all zeros**

**Cause:** Missing lag features or NaN values

**Solution:**

1. Ensure CSV file has at least 30 days of recent data
2. Check if `quantity_sold` column has valid values
3. Re-run feature engineering in notebook

---

## 📈 Next Steps (Phase 2 - Reorder Logic)

After forecast display is working, we can add:

1. **Reorder Recommendations Tab**

   - Products below safety stock
   - Suggested order quantities
   - Lead time consideration

2. **EOD Sales Upload**

   - Form to upload daily sales
   - Append to CSV
   - Auto-trigger forecast

3. **Alerts & Notifications**

   - Low stock warnings
   - Festival prep reminders
   - Unusual demand patterns

4. **Historical Accuracy Dashboard**
   - Compare predictions vs actuals
   - Model performance metrics
   - Continuous improvement insights

---

## 🎉 Success Criteria

When setup is complete, you should be able to:

✅ Click "Run Forecast" button in Manager Dashboard  
✅ See loading spinner for 3-5 seconds  
✅ View 7-day forecast table with 50 products  
✅ See predicted quantities color-coded by urgency  
✅ Hover over cells to see forecasted revenue  
✅ See dates in column headers (Nov 11, Nov 12, etc.)

---

## 📞 Need Help?

If you encounter any issues:

1. Check backend terminal for error messages
2. Check browser console for frontend errors
3. Verify all files were created correctly
4. Ensure models are trained and saved

**Status Check Command:**

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/forecast/status" -Method GET
```

---

**Last Updated:** November 2025  
**Version:** 1.0.0
