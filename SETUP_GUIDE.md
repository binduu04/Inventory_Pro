# Role-Based Access Control Setup Guide

This guide will walk you through setting up role-based authentication with Supabase, Flask, and React.

## 🎯 System Overview

- **Frontend**: React + Vite
- **Backend**: Flask (Python)
- **Database & Auth**: Supabase
- **Roles**: Customer, Biller, Manager

---

## 📋 Step-by-Step Setup Instructions

### **Step 1: Supabase Database Setup**

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query and paste this SQL:

```sql
-- Create a profiles table to store user roles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('customer', 'biller', 'manager')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Click **Run** to execute the SQL
5. Verify the `profiles` table was created in the **Table Editor**

---

### **Step 2: Get Supabase Credentials**

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

### **Step 3: Configure Email Authentication**

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation email if needed
4. For development, you can disable email confirmation:
   - Go to **Authentication** → **Providers** → **Email**
   - Toggle **Confirm email** to OFF (for testing only)

---

### **Step 4: Backend Setup (Flask)**

1. **Create environment file:**

   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```

2. **Edit `.env` file** and add your Supabase credentials:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key-here
   ```

3. **Create virtual environment:**

   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

4. **Install dependencies:**

   ```powershell
   pip install -r requirements.txt
   ```

5. **Run the Flask server:**

   ```powershell
   python app.py
   ```

   The backend should now be running on `http://localhost:5000`

---

### **Step 5: Frontend Setup (React)**

1. **Create environment file:**

   ```powershell
   cd ..\frontend
   Copy-Item .env.example .env
   ```

2. **Edit `.env` file** and add your credentials:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Install dependencies:**

   ```powershell
   npm install
   npm install @supabase/supabase-js react-router-dom
   ```

4. **Run the development server:**

   ```powershell
   npm run dev
   ```

   The frontend should now be running on `http://localhost:5173`

---

## 🧪 Testing the Application

### **Test User Registration:**

1. Open `http://localhost:5173` in your browser
2. Navigate to `/register`
3. Create test accounts for each role:
   - **Customer**: `customer@test.com` / `password123`
   - **Biller**: `biller@test.com` / `password123`
   - **Manager**: `manager@test.com` / `password123`

### **Test Login:**

1. Log in with each account
2. Verify you're redirected to the correct dashboard:
   - Customer → `/dashboard/customer`
   - Biller → `/dashboard/biller`
   - Manager → `/dashboard/manager`

### **Test Role Protection:**

1. Try accessing a different role's dashboard URL
2. You should be redirected to your own role's dashboard

---

## 📁 Project Structure

```
inventory_and_forecast/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables (create this)
│   └── .env.example       # Example environment file
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ProtectedRoute.jsx    # Route protection
    │   ├── config/
    │   │   └── supabase.js          # Supabase client
    │   ├── context/
    │   │   └── AuthContext.jsx      # Authentication state
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── CustomerDashboard.jsx
    │   │   ├── BillerDashboard.jsx
    │   │   ├── ManagerDashboard.jsx
    │   │   ├── Auth.css
    │   │   └── Dashboard.css
    │   ├── App.jsx                  # Main app with routes
    │   └── main.jsx                 # Entry point
    ├── .env                         # Environment variables (create this)
    └── .env.example                 # Example environment file
```

---

## 🔐 Available API Endpoints

### Backend (Flask) - `http://localhost:5000/api`

- **POST** `/auth/register` - Register new user
- **POST** `/auth/login` - Login user
- **POST** `/auth/logout` - Logout user
- **GET** `/auth/profile` - Get user profile
- **POST** `/auth/verify-role` - Verify user role

---

## 🎨 Features

### ✅ Implemented:

- User registration with role selection
- Email/password authentication
- Role-based dashboards (Customer, Biller, Manager)
- Protected routes based on user role
- Automatic profile creation on signup
- Session management
- Logout functionality

### 🔜 Next Steps (Optional):

- Forgot password functionality
- Email verification enforcement
- Profile editing
- Role-based feature implementation
- API integration for business logic
- Database queries for each role's specific data

---

## 🚨 Troubleshooting

### Issue: "Invalid token" error

**Solution:** Make sure your Supabase credentials are correct in both `.env` files

### Issue: Email confirmation required

**Solution:** Disable email confirmation in Supabase (Auth → Providers → Email) for testing

### Issue: CORS errors

**Solution:** Ensure Flask-CORS is installed and the backend is running

### Issue: Can't login after registration

**Solution:** Check if email confirmation is disabled OR check your email for verification link

### Issue: Redirected to wrong dashboard

**Solution:** Check the profiles table - ensure user has correct role assigned

---

## 📝 Database Schema

### `profiles` table:

| Column     | Type      | Description                         |
| ---------- | --------- | ----------------------------------- |
| id         | UUID      | User ID (references auth.users)     |
| email      | TEXT      | User email                          |
| role       | TEXT      | User role (customer/biller/manager) |
| full_name  | TEXT      | User's full name                    |
| created_at | TIMESTAMP | Account creation timestamp          |

---

## 🔒 Security Notes

- Passwords are hashed by Supabase Auth
- Row Level Security (RLS) is enabled on profiles table
- JWT tokens are used for authentication
- Protected routes prevent unauthorized access
- Email verification can be enabled for production

---

## 📞 Support

If you encounter any issues, check:

1. Supabase dashboard for errors
2. Browser console for frontend errors
3. Flask terminal for backend errors
4. Network tab to see API requests/responses

---

Happy coding! 🚀
