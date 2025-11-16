"""
WhatsApp notification service using Twilio API
Sends order confirmation messages to customers
"""
import os
from twilio.rest import Client
from datetime import datetime


class WhatsAppService:
    def __init__(self):
        """Initialize Twilio client with credentials from environment"""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_from = os.getenv('TWILIO_WHATSAPP_FROM')  # Format: whatsapp:+14155238886
        
        if not all([self.account_sid, self.auth_token, self.whatsapp_from]):
            print("[WARNING] Twilio credentials not configured. WhatsApp notifications disabled.")
            self.client = None
        else:
            self.client = Client(self.account_sid, self.auth_token)
    
    def send_order_confirmation(self, customer_phone, customer_name, sale_id, total_amount, items_count):
        """
        Send order confirmation WhatsApp message
        
        Args:
            customer_phone (str): Customer phone number (format: +91XXXXXXXXXX)
            customer_name (str): Customer's name
            sale_id (int): Order/Sale ID
            total_amount (float): Total order amount
            items_count (int): Number of items in order
        
        Returns:
            dict: Result with success status and message
        """
        if not self.client:
            return {
                'success': False,
                'message': 'WhatsApp service not configured'
            }
        
        try:
            # Format phone number for WhatsApp (must include country code)
            # If phone doesn't start with +, assume India (+91)
            if not customer_phone.startswith('+'):
                if customer_phone.startswith('91'):
                    customer_phone = '+' + customer_phone
                else:
                    customer_phone = '+91' + customer_phone.lstrip('0')
            
            whatsapp_to = f'whatsapp:{customer_phone}'
            
            # Create order confirmation message
            message_body = self._create_order_message(
                customer_name, sale_id, total_amount, items_count
            )
            
            # Send WhatsApp message via Twilio
            message = self.client.messages.create(
                from_=self.whatsapp_from,
                body=message_body,
                to=whatsapp_to
            )
            
            print(f"[SUCCESS] WhatsApp sent to {customer_phone} | SID: {message.sid}")
            
            return {
                'success': True,
                'message': 'WhatsApp notification sent successfully',
                'message_sid': message.sid
            }
            
        except Exception as e:
            print(f"[ERROR] WhatsApp send failed: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to send WhatsApp: {str(e)}'
            }
    
    def _create_order_message(self, customer_name, sale_id, total_amount, items_count):
        """Create formatted order confirmation message"""
        message = f"""🎉 *Order Confirmed!*

Hello {customer_name}! 👋

Your order has been successfully placed.

📦 *Order Details:*
• Order ID: #{sale_id}
• Items: {items_count}
• Total: ₹{total_amount:.2f}
• Payment: Online (Paid)

📍 Your order is being processed and will be ready soon!

Thank you for shopping with us! 🛒✨

_For any queries, please contact our support._
"""
        return message
    
    def send_custom_message(self, customer_phone, message_text):
        """
        Send a custom WhatsApp message
        
        Args:
            customer_phone (str): Customer phone number
            message_text (str): Custom message to send
        
        Returns:
            dict: Result with success status
        """
        if not self.client:
            return {
                'success': False,
                'message': 'WhatsApp service not configured'
            }
        
        try:
            if not customer_phone.startswith('+'):
                if customer_phone.startswith('91'):
                    customer_phone = '+' + customer_phone
                else:
                    customer_phone = '+91' + customer_phone.lstrip('0')
            
            whatsapp_to = f'whatsapp:{customer_phone}'
            
            message = self.client.messages.create(
                from_=self.whatsapp_from,
                body=message_text,
                to=whatsapp_to
            )
            
            print(f"[SUCCESS] Custom WhatsApp sent | SID: {message.sid}")
            
            return {
                'success': True,
                'message': 'Message sent successfully',
                'message_sid': message.sid
            }
            
        except Exception as e:
            print(f"[ERROR] WhatsApp send failed: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to send: {str(e)}'
            }


# Singleton instance
_whatsapp_service = None

def get_whatsapp_service():
    """Get or create WhatsApp service singleton"""
    global _whatsapp_service
    if _whatsapp_service is None:
        _whatsapp_service = WhatsAppService()
    return _whatsapp_service
