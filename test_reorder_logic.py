"""
Test Script for Inventory Reorder Logic
Validates the reorder calculations with mock data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from backend.ml_models.inventory_reorder import (
    calculate_reorder_recommendations,
    generate_reorder_summary,
    get_shelf_life_days,
    calculate_days_until_stockout,
    get_urgency_status
)


def test_basic_reorder_logic():
    """Test basic reorder logic with 3 sample products"""
    
    print("\n" + "="*80)
    print("TEST 1: Basic Reorder Logic (3 Products)")
    print("="*80)
    
    # Create mock forecast data
    dates = pd.date_range('2025-11-13', periods=7)
    
    forecast_data = []
    
    # Product 1: Amul Milk 1L (Daily delivery, high demand)
    for i, date in enumerate(dates):
        forecast_data.append({
            'sale_date': date,
            'product_name': 'Amul Milk 1L',
            'category': 'Dairy',
            'predicted_quantity': 56 - i  # Decreasing: 56, 55, 54...
        })
    
    # Product 2: Amul Butter 100g (4-day shelf life)
    for i, date in enumerate(dates):
        forecast_data.append({
            'sale_date': date,
            'product_name': 'Amul Butter 100g',
            'category': 'Dairy',
            'predicted_quantity': 32 - i  # Decreasing: 32, 31, 30...
        })
    
    # Product 3: Lays Chips 50g (6-day shelf life)
    for i, date in enumerate(dates):
        forecast_data.append({
            'sale_date': date,
            'product_name': 'Lays Chips 50g',
            'category': 'Snacks',
            'predicted_quantity': 45 - i  # Decreasing: 45, 44, 43...
        })
    
    forecast_df = pd.DataFrame(forecast_data)
    
    # Mock current stock levels
    current_stock_dict = {
        'Amul Milk 1L': 25,      # LOW - should be CRITICAL
        'Amul Butter 100g': 15,  # LOW - should be CRITICAL
        'Lays Chips 50g': 100    # LOW but more days - might be RED/YELLOW
    }
    
    # Calculate reorder recommendations
    reorder_df = calculate_reorder_recommendations(forecast_df, current_stock_dict)
    
    # Display results
    print("\n--- REORDER RECOMMENDATIONS ---\n")
    for _, row in reorder_df.iterrows():
        print(f"Product: {row['product_name']}")
        print(f"  Current Stock: {row['current_stock']}")
        print(f"  Shelf Life: {row['shelf_life_days']} days")
        print(f"  Days Until Stockout: {row['days_until_stockout']:.1f}")
        print(f"  Status: {row['urgency_status'].upper()}")
        print(f"  Target Stock: {row['target_stock']}")
        print(f"  Recommended Order: {row['recommended_order_qty']} units")
        print(f"  Reason: {row['reorder_reason']}")
        print(f"  7-Day Forecast Total: {row['forecast_7day_total']}")
        print()
    
    # Generate summary
    summary = generate_reorder_summary(reorder_df)
    print("\n--- SUMMARY ---")
    print(f"Total Products: {summary['total_products']}")
    print(f"🔴 Critical: {summary['critical_count']}")
    print(f"🟡 Warning: {summary['warning_count']}")
    print(f"🟢 Good: {summary['good_count']}")
    print(f"Total Order Qty: {summary['total_order_qty']}")
    print(f"Products Needing Order: {summary['products_needing_order']}")
    
    # Validate expectations
    assert reorder_df.loc[reorder_df['product_name'] == 'Amul Milk 1L', 'urgency_status'].values[0] == 'red'
    assert reorder_df.loc[reorder_df['product_name'] == 'Amul Butter 100g', 'urgency_status'].values[0] == 'red'
    print("\n✅ Test 1 PASSED!\n")


def test_edge_cases():
    """Test edge cases: zero stock, high stock, etc."""
    
    print("\n" + "="*80)
    print("TEST 2: Edge Cases")
    print("="*80)
    
    dates = pd.date_range('2025-11-13', periods=7)
    
    forecast_data = []
    for date in dates:
        forecast_data.append({
            'sale_date': date,
            'product_name': 'Zero Stock Product',
            'category': 'Dairy',
            'predicted_quantity': 50
        })
        forecast_data.append({
            'sale_date': date,
            'product_name': 'High Stock Product',
            'category': 'Snacks',
            'predicted_quantity': 10
        })
    
    forecast_df = pd.DataFrame(forecast_data)
    
    current_stock_dict = {
        'Zero Stock Product': 0,     # ZERO stock - should be CRITICAL
        'High Stock Product': 1000   # VERY HIGH stock - should be GREEN
    }
    
    reorder_df = calculate_reorder_recommendations(forecast_df, current_stock_dict)
    
    print("\n--- EDGE CASE RESULTS ---\n")
    for _, row in reorder_df.iterrows():
        print(f"{row['product_name']}:")
        print(f"  Current: {row['current_stock']} | Days Left: {row['days_until_stockout']:.1f} | Status: {row['urgency_status'].upper()}")
        print(f"  Order: {row['recommended_order_qty']} units")
        print()
    
    # Validate
    zero_stock = reorder_df[reorder_df['product_name'] == 'Zero Stock Product'].iloc[0]
    high_stock = reorder_df[reorder_df['product_name'] == 'High Stock Product'].iloc[0]
    
    assert zero_stock['urgency_status'] == 'red', "Zero stock should be CRITICAL"
    assert zero_stock['days_until_stockout'] == 0.0, "Zero stock days should be 0"
    assert high_stock['urgency_status'] == 'green', "High stock should be GREEN"
    
    print("✅ Test 2 PASSED!\n")


def test_days_until_stockout():
    """Test fractional days calculation"""
    
    print("\n" + "="*80)
    print("TEST 3: Days Until Stockout Calculation")
    print("="*80)
    
    # Test Case 1: Runs out mid-day 2
    current_stock = 50
    daily_forecast = [30, 25, 20, 15, 10, 10, 10]
    days = calculate_days_until_stockout(current_stock, daily_forecast)
    print(f"\nCase 1: Stock={current_stock}, Forecast={daily_forecast[:3]}")
    print(f"  Result: {days:.2f} days")
    print(f"  Expected: ~1.8 days (30 units day 1, then 20/25 of day 2)")
    assert abs(days - 1.8) < 0.1, f"Expected ~1.8, got {days}"
    
    # Test Case 2: Lasts beyond forecast
    current_stock = 1000
    daily_forecast = [10] * 7
    days = calculate_days_until_stockout(current_stock, daily_forecast)
    print(f"\nCase 2: Stock={current_stock}, Forecast=10/day")
    print(f"  Result: {days:.2f} days")
    print(f"  Expected: 100+ days (way beyond forecast)")
    assert days > 50, "Should last way beyond 7-day forecast"
    
    # Test Case 3: Zero stock
    current_stock = 0
    daily_forecast = [50] * 7
    days = calculate_days_until_stockout(current_stock, daily_forecast)
    print(f"\nCase 3: Stock={current_stock}")
    print(f"  Result: {days:.2f} days")
    print(f"  Expected: 0.0 days")
    assert days == 0.0, "Zero stock should return 0 days"
    
    print("\n✅ Test 3 PASSED!\n")


def test_urgency_classification():
    """Test urgency status classification"""
    
    print("\n" + "="*80)
    print("TEST 4: Urgency Status Classification")
    print("="*80)
    
    test_cases = [
        (0.5, 'red', 'Half day left'),
        (1.0, 'red', '1 day left'),
        (2.0, 'red', '2 days left'),
        (2.1, 'yellow', '2.1 days left'),
        (3.5, 'yellow', '3.5 days left'),
        (5.0, 'yellow', '5 days left'),
        (5.1, 'green', '5.1 days left'),
        (10.0, 'green', '10 days left'),
    ]
    
    print("\nDays Until Stockout | Expected Status | Result")
    print("-" * 60)
    
    all_passed = True
    for days, expected_status, description in test_cases:
        result_status = get_urgency_status(days)
        status_emoji = {'red': '🔴', 'yellow': '🟡', 'green': '🟢'}
        passed = "✅" if result_status == expected_status else "❌"
        print(f"{days:>6.1f} days        | {expected_status:>6} {status_emoji[expected_status]} | {result_status:>6} {status_emoji[result_status]} {passed}")
        if result_status != expected_status:
            all_passed = False
    
    assert all_passed, "Some urgency classifications failed"
    print("\n✅ Test 4 PASSED!\n")


def test_shelf_life_logic():
    """Test shelf life configuration"""
    
    print("\n" + "="*80)
    print("TEST 5: Shelf Life Configuration")
    print("="*80)
    
    test_products = [
        ('Amul Milk 1L', 'Dairy', 1),
        ('Amul Butter 100g', 'Dairy', 4),
        ('Unknown Dairy Product', 'Dairy', 4),  # Should use category default
        ('Unknown Snack', 'Snacks', 6),  # Should use category default
    ]
    
    print("\nProduct | Category | Expected | Result")
    print("-" * 60)
    
    all_passed = True
    for product, category, expected_days in test_products:
        result_days = get_shelf_life_days(product, category)
        passed = "✅" if result_days == expected_days else "❌"
        print(f"{product:30} | {category:12} | {expected_days} days | {result_days} days {passed}")
        if result_days != expected_days:
            all_passed = False
    
    assert all_passed, "Some shelf life lookups failed"
    print("\n✅ Test 5 PASSED!\n")


def run_all_tests():
    """Run all test suites"""
    
    print("\n" + "="*80)
    print("🧪 INVENTORY REORDER LOGIC - TEST SUITE")
    print("="*80)
    
    try:
        test_basic_reorder_logic()
        test_edge_cases()
        test_days_until_stockout()
        test_urgency_classification()
        test_shelf_life_logic()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED!")
        print("="*80)
        print("\n🎉 Reorder logic is working correctly!\n")
        
    except AssertionError as e:
        print("\n" + "="*80)
        print("❌ TEST FAILED!")
        print("="*80)
        print(f"\nError: {e}\n")
        raise
    except Exception as e:
        print("\n" + "="*80)
        print("❌ UNEXPECTED ERROR!")
        print("="*80)
        print(f"\nError: {e}\n")
        raise


if __name__ == "__main__":
    run_all_tests()
