from datetime import datetime, timedelta
import numpy as np

FESTIVAL_DATES_2023 = {
    "Diwali": "2023-11-12",
    "Bhai Dooj": "2023-11-15",
    "Christmas": "2023-12-25",
    "New Year Eve": "2023-12-31"
}

FESTIVAL_DATES_2024 = {
    "Makar Sankranti": "2024-01-14",
    "Republic Day": "2024-01-26",
    "Valentine's Day": "2024-02-14",
    "Maha Shivratri": "2024-03-08",
    "Holi": "2024-03-25",
    "Eid ul-Fitr": "2024-04-11",
    "Ram Navami": "2024-04-17",
    "Eid ul-Adha": "2024-06-17",
    "Independence Day": "2024-08-15",
    "Raksha Bandhan": "2024-08-19",
    "Janmashtami": "2024-08-26",
    "Navratri": "2024-10-03",
    "Dussehra": "2024-10-12",
    "Diwali": "2024-10-31",
    "Bhai Dooj": "2024-11-15",
    "Christmas": "2024-12-25",
    "New Year Eve": "2024-12-31"
}

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
    "Bhai Dooj": "2025-11-03",
    "Christmas": "2025-12-25",
    "New Year Eve": "2025-12-31"
}

FESTIVAL_DATES_2026 = {
    "Makar Sankranti": "2026-01-14",
    "Republic Day": "2026-01-26",
    "Valentine's Day": "2026-02-14",
    "Maha Shivratri": "2026-02-15",
    "Holi": "2026-03-04",
    "Eid ul-Fitr": "2026-03-20",
    "Ram Navami": "2026-03-27",
    "Eid ul-Adha": "2026-05-27",
    "Independence Day": "2026-08-15",
    "Raksha Bandhan": "2026-08-28",
    "Janmashtami": "2026-09-05",
    "Navratri": "2026-09-10",
    "Dussehra": "2026-09-19",
    "Diwali": "2026-11-08",
    "Bhai Dooj": "2026-11-10",
    "Christmas": "2026-12-25",
    "New Year Eve": "2026-12-31"
}


def get_festival_calendar(year):
    """Get festival dates for a specific year"""
    calendars = {
        2023: FESTIVAL_DATES_2023,
        2024: FESTIVAL_DATES_2024,
        2025: FESTIVAL_DATES_2025,
        2026: FESTIVAL_DATES_2026
    }
    return calendars.get(year, {})


def get_discount_for_product(product_category, festival_discount_percent=0, flash_sale_discount_percent=0, check_date=None):
    """
    Returns the applicable discount percentage for a product based on current date/time
    
    Args:
        product_category: Category of the product (e.g., "Snacks", "Beverages")
        festival_discount_percent: Festival discount % from database
        flash_sale_discount_percent: Flash sale discount % from database
        check_date: Date to check (defaults to today)
    
    Returns:
        float: Discount percentage (0 if no discount applies)
    """
    if check_date is None:
        check_date = datetime.now().date()
    elif isinstance(check_date, str):
        check_date = datetime.strptime(check_date, '%Y-%m-%d').date()
    elif isinstance(check_date, datetime):
        check_date = check_date.date()
    
    discount = 0.0
    
    # FESTIVAL PREP DISCOUNTS (1-2 days before Diwali, Christmas, Navratri)
    festival_calendar = get_festival_calendar(check_date.year)
    eligible_festivals = {"Diwali", "Christmas", "Navratri"}
    
    for fest_name, fest_date_str in festival_calendar.items():
        if fest_name not in eligible_festivals:
            continue
        
        try:
            fest_date = datetime.strptime(fest_date_str, '%Y-%m-%d').date()
            days_before = (fest_date - check_date).days
            
            # Apply discount 1-2 days before the festival
            if 1 <= days_before <= 2:
                if festival_discount_percent > 0:
                    # Use the discount from database if available
                    discount = max(discount, festival_discount_percent)
                else:
                    # Use default discount percentages
                    if product_category in ["Snacks", "Beverages"]:
                        discount = max(discount, 15.0)
                    else:
                        discount = max(discount, 10.0)
        except Exception as e:
            print(f"Error processing festival {fest_name}: {e}")
            continue
    
    # EVERY 3rd WEDNESDAY FLASH SALE (category rotates by month)
    if check_date.weekday() == 2:  # Wednesday = 2
        week_of_month = (check_date.day - 1) // 7 + 1
        
        if week_of_month == 3:  # 3rd week
            # Category rotation by month
            month_category_map = {
                1: "Beverages", 2: "Snacks", 3: "Personal Care", 4: "Dairy",
                5: "Beverages", 6: "Snacks", 7: "Personal Care", 8: "Dairy",
                9: "Beverages", 10: "Snacks", 11: "Personal Care", 12: "Dairy"
            }
            
            if product_category == month_category_map.get(check_date.month):
                if flash_sale_discount_percent > 0:
                    # Use the discount from database if available
                    discount = max(discount, flash_sale_discount_percent)
                else:
                    # Use default flash sale discount
                    discount = max(discount, 12.0)
                    
    
    day_of_week = check_date.weekday()
    daily_category_map = {
        0: "Dairy", 1: "Beverages", 2: "Snacks", 3: "Personal Care",
        4: "Staples", 5: "Snacks", 6: "Beverages"
    }
    if product_category == daily_category_map.get(day_of_week):
        discount = max(discount, np.random.choice([2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5]))
    
    return discount


def apply_discount_to_products(products):
    """
    Apply dynamic discounts to a list of products based on current date
    
    Args:
        products: List of product dictionaries
    
    Returns:
        List of products with active_discount field added
    """
    for product in products:
        category = product.get('category', '')
        festival_discount = product.get('festival_discount_percent', 0) or 0
        flash_sale_discount = product.get('flash_sale_discount_percent', 0) or 0
        
        # Calculate active discount
        active_discount = get_discount_for_product(
            category, 
            festival_discount, 
            flash_sale_discount
        )
        
        product['active_discount'] = active_discount
    
    return products


def calculate_discounted_price(selling_price, product_category, festival_discount_percent=0, flash_sale_discount_percent=0):
    """
    Calculate the final price after applying applicable discount
    
    Args:
        selling_price: Original selling price
        product_category: Category of the product
        festival_discount_percent: Festival discount % from database
        flash_sale_discount_percent: Flash sale discount % from database
    
    Returns:
        tuple: (final_price, discount_applied)
    """
    discount = get_discount_for_product(
        product_category,
        festival_discount_percent,
        flash_sale_discount_percent
    )
    
    if discount > 0:
        final_price = selling_price * (1 - discount / 100)
        return round(final_price, 2), discount
    
    return selling_price, 0
