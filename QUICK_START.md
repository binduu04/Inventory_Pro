# 🚀 Quick Start Checklist

Follow these steps in order to get your role-based authentication system up and running:

## ☑️ Step 1: Supabase Setup (5 minutes)

1. **Run the SQL script:**

   - Open Supabase Dashboard → SQL Editor
   - Copy the SQL from `SETUP_GUIDE.md` (Step 1)
   - Click "Run" to create the profiles table

2. **Get your credentials:**

   - Settings → API
   - Copy **Project URL** and **anon public key**

3. **Configure email auth:**
   - Authentication → Providers
   - Enable Email
   - For testing: Disable "Confirm email" option

---

## ☑️ Step 2: Backend Setup (5 minutes)

```powershell
# Navigate to backend folder
cd backend

# Create .env file from example
Copy-Item .env.example .env

# Edit .env and add your Supabase credentials
# SUPABASE_URL=your_url_here
# SUPABASE_KEY=your_key_here

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run Flask server
python app.py
```

Server should run on: **http://localhost:5000**

---

## ☑️ Step 3: Frontend Setup (5 minutes)

```powershell
# Navigate to frontend folder
cd ..\frontend

# Create .env file from example
Copy-Item .env.example .env

# Edit .env and add your Supabase credentials
# VITE_SUPABASE_URL=your_url_here
# VITE_SUPABASE_ANON_KEY=your_key_here
# VITE_API_URL=http://localhost:5000/api

# Install dependencies
npm install

# Install additional packages
npm install @supabase/supabase-js react-router-dom

# Run development server
npm run dev
```

Frontend should run on: **http://localhost:5173**

---

## ☑️ Step 4: Test the System (5 minutes)

### Create Test Users:

1. Open **http://localhost:5173/register**
2. Create three test accounts:

   **Customer:**

   - Email: `customer@test.com`
   - Password: `password123`
   - Role: Customer

   **Biller:**

   - Email: `biller@test.com`
   - Password: `password123`
   - Role: Biller

   **Manager:**

   - Email: `manager@test.com`
   - Password: `password123`
   - Role: Manager

### Test Login:

1. Go to **http://localhost:5173/login**
2. Login with each account
3. Verify you see the correct dashboard for each role

---

## 🎯 What You Should See

### Customer Dashboard:

- My Orders
- Browse Products
- My Profile
- Order History

### Biller Dashboard:

- Create Invoice
- Pending Invoices
- Completed Invoices
- Payment Records
- Customer List
- Billing Reports

### Manager Dashboard:

- Analytics
- Inventory Management
- User Management
- Financial Reports
- Sales Overview
- System Settings
- Order Management
- Notifications

---

## 🔍 Verification Checklist

- [ ] Supabase profiles table created
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Can register new users
- [ ] Can login with created users
- [ ] Redirected to correct dashboard based on role
- [ ] Cannot access other roles' dashboards
- [ ] Logout functionality works

---

## 🚨 Common Issues & Quick Fixes

| Issue                          | Solution                                    |
| ------------------------------ | ------------------------------------------- |
| "Module not found"             | Run `npm install` again                     |
| "Invalid credentials"          | Check .env files have correct Supabase keys |
| "CORS error"                   | Make sure Flask backend is running          |
| "Table does not exist"         | Run the SQL script in Supabase              |
| Can't login after registration | Disable email confirmation in Supabase      |

---

## 📝 Your .env Files Should Look Like:

### `backend/.env`

```
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `frontend/.env`

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000/api
```

---

## ✅ Success!

Once all steps are complete, you'll have:

- ✅ Full authentication system
- ✅ Role-based access control
- ✅ Three different user dashboards
- ✅ Protected routes
- ✅ Login/Register pages

**Next Steps:** Start building features specific to each role!

---

Need help? Check the full `SETUP_GUIDE.md` for detailed explanations.
