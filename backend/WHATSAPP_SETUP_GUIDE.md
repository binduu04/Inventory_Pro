# WhatsApp Notifications Setup Guide

This guide will help you set up WhatsApp order notifications using Twilio.

## 📱 What You'll Get

When a customer completes payment, they'll automatically receive a WhatsApp message like:

```
🎉 Order Confirmed!

Hello [Customer Name]! 👋

Your order has been successfully placed.

📦 Order Details:
• Order ID: #123
• Items: 3
• Total: ₹1,250.00
• Payment: Online (Paid)

📍 Your order is being processed and will be ready soon!

Thank you for shopping with us! 🛒✨
```

## 🚀 Setup Instructions

### Step 1: Sign Up for Twilio (FREE for Testing)

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. You'll get **$15.50 in free credits** (enough for ~1000 WhatsApp messages)

### Step 2: Get Your Credentials

After signing up:

1. Go to **Console Dashboard**: [https://console.twilio.com/](https://console.twilio.com/)
2. Find these values:
   - **Account SID**: Looks like `AC...` (32 characters)
   - **Auth Token**: Click "View" to reveal it

### Step 3: Set Up WhatsApp Sandbox

Twilio provides a free sandbox for testing WhatsApp:

1. In Twilio Console, go to: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see instructions like:
   ```
   Send "join <your-sandbox-code>" to +1 415 523 8886 on WhatsApp
   ```
3. Open WhatsApp on your phone and send that message
4. Your Twilio WhatsApp number will be: `whatsapp:+14155238886` (or similar)

### Step 4: Configure Your Backend

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in your credentials:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Step 5: Install Dependencies

```bash
cd backend
pip install twilio==9.0.0
```

Or install all requirements:

```bash
pip install -r requirements.txt
```

### Step 6: Test It!

1. Start your backend server
2. Make a test order through your app
3. Check the terminal logs for:
   ```
   ✅ WhatsApp sent to +91XXXXXXXXXX | SID: SM...
   ```

## 🔧 Phone Number Format

The system automatically handles Indian phone numbers:

- Input: `9876543210` → Converts to: `+919876543210`
- Input: `919876543210` → Converts to: `+919876543210`
- Input: `+919876543210` → Uses as-is

For other countries, ensure phone numbers start with `+` and country code.

## 📝 Important Notes

### Sandbox Limitations

- **Only verified numbers** can receive messages in sandbox mode
- To verify a number: That person must send "join <your-code>" to the Twilio number
- You can verify up to **5 phone numbers** in the sandbox

### Going Production (After Testing)

To send to ANY number without verification:

1. Apply for WhatsApp Business API access in Twilio Console
2. Complete business verification (requires business documents)
3. Get your own WhatsApp Business number

Cost: ~$0.005 per message (after free credits)

## 🐛 Troubleshooting

### "WhatsApp service not configured"

- Check your `.env` file has all three Twilio variables
- Restart your backend server after adding credentials

### "Unable to create record: Permission denied"

- Your phone number isn't verified in the sandbox
- Send the "join" message from WhatsApp first

### "The number +XXXX is unverified"

- Same as above - verify the number in the sandbox

### No message received

- Check the Twilio Console logs: [https://console.twilio.com/monitor/logs/sms](https://console.twilio.com/monitor/logs/sms)
- Verify your Auth Token is correct
- Check your Twilio account has credits

## 🎨 Customizing Messages

Edit `backend/utils/whatsapp_service.py`, function `_create_order_message()` to change the message template.

## 💡 Additional Features

The service also includes:

- `send_custom_message()` - Send any custom message
- Automatic phone number formatting
- Error handling and logging

## 📚 Resources

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Twilio Python SDK](https://www.twilio.com/docs/libraries/python)
- [WhatsApp Sandbox Tutorial](https://www.twilio.com/docs/whatsapp/sandbox)

---

**Happy Coding! 🚀** If you have questions, check Twilio's excellent documentation or their support.
