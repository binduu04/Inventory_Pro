# 🔧 Troubleshooting Guide

## Common Issues and Solutions

---

## 1. Supabase Connection Issues

### ❌ Error: "Invalid API key"

**Symptoms:**

- Can't login or register
- Console shows "Invalid API key" or "401 Unauthorized"

**Solutions:**

1. Verify your `.env` files have the correct Supabase credentials
2. Make sure you're using the **anon/public** key, not the service role key
3. Check for extra spaces or quotes in the `.env` file
4. Restart both frontend and backend servers after changing `.env`

**How to verify:**

```powershell
# In frontend folder
Get-Content .env

# In backend folder
Get-Content .env
```

---

### ❌ Error: "Table 'profiles' does not exist"

**Symptoms:**

- Registration fails
- Error in Supabase logs about missing table

**Solutions:**

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL script from `SETUP_GUIDE.md` Step 1
3. Verify table exists in Table Editor
4. Check if trigger was created: Database → Functions

**Verify table exists:**

```sql
SELECT * FROM profiles LIMIT 1;
```

---

## 2. Authentication Issues

### ❌ Error: "Email not confirmed"

**Symptoms:**

- Can register but can't login
- Message about email confirmation

**Solutions:**

**Option 1 - For Development (Recommended):**

1. Go to Supabase Dashboard
2. Authentication → Providers → Email
3. Toggle OFF "Confirm email"
4. Save changes

**Option 2 - For Production:**

1. Check your email inbox
2. Click the confirmation link
3. Then try logging in again

---

### ❌ Error: "Invalid login credentials"

**Symptoms:**

- Registration works but login fails
- Correct email/password but still denied

**Solutions:**

1. Check if email confirmation is required (see above)
2. Verify the email in Supabase Dashboard → Authentication → Users
3. Try resetting password through Supabase
4. Check browser console for detailed error

**Check user in database:**

```sql
SELECT email, confirmed_at FROM auth.users WHERE email = 'your@email.com';
```

---

### ❌ User redirected to wrong dashboard

**Symptoms:**

- Login successful but wrong dashboard shown
- Customer sees Biller dashboard, etc.

**Solutions:**

1. Check the user's role in profiles table
2. Verify ProtectedRoute is checking roles correctly
3. Clear browser cache and cookies

**Check user role:**

```sql
SELECT email, role FROM profiles WHERE email = 'your@email.com';
```

**Update role if needed:**

```sql
UPDATE profiles SET role = 'manager' WHERE email = 'your@email.com';
```

---

## 3. Frontend Issues

### ❌ Error: "Module not found: @supabase/supabase-js"

**Symptoms:**

- App won't start
- Import errors in console

**Solutions:**

```powershell
cd frontend
npm install @supabase/supabase-js react-router-dom
```

---

### ❌ Error: "useAuth must be used within AuthProvider"

**Symptoms:**

- Error when using useAuth hook
- App crashes on load

**Solutions:**

1. Verify `App.jsx` wraps routes with `<AuthProvider>`
2. Check import statements are correct
3. Make sure AuthContext.jsx exists in `src/context/`

**Correct App.jsx structure:**

```jsx
<AuthProvider>
  <Router>
    <Routes>{/* routes */}</Routes>
  </Router>
</AuthProvider>
```

---

### ❌ Error: "Unexpected token 'export'"

**Symptoms:**

- Frontend won't start
- Syntax errors in imported modules

**Solutions:**

```powershell
# Delete node_modules and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

---

### ❌ Blank page after login

**Symptoms:**

- Login succeeds but page is blank
- No errors in console

**Solutions:**

1. Check browser console for errors
2. Verify dashboard components exist
3. Check network tab for failed requests
4. Ensure routes are configured correctly

**Debug:**

```jsx
// Add to Login.jsx after successful login
console.log("User data:", data);
console.log("Profile data:", profileData);
console.log("Redirecting to:", role);
```

---

## 4. Backend Issues

### ❌ Error: "No module named 'flask'"

**Symptoms:**

- Backend won't start
- Python import errors

**Solutions:**

```powershell
cd backend

# Make sure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

---

### ❌ Error: "CORS policy blocked"

**Symptoms:**

- Frontend can't connect to backend
- CORS errors in browser console

**Solutions:**

1. Verify Flask-CORS is installed:

```powershell
pip install flask-cors
```

2. Check `app.py` has:

```python
from flask_cors import CORS
CORS(app)
```

3. Restart Flask server

---

### ❌ Backend not starting on port 5000

**Symptoms:**

- "Address already in use" error
- Port 5000 is occupied

**Solutions:**

**Option 1 - Kill the process:**

```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Option 2 - Use different port:**

```python
# In app.py, change:
app.run(debug=True, port=5001)
```

Then update frontend `.env`:

```
VITE_API_URL=http://localhost:5001/api
```

---

## 5. Database Issues

### ❌ Row Level Security blocks queries

**Symptoms:**

- Can't read/update profile
- Empty results from database

**Solutions:**

1. Verify RLS policies are created
2. Check if user is authenticated
3. Ensure JWT token is being sent

**Check policies:**

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

### ❌ Trigger not creating profile

**Symptoms:**

- User created but no profile
- Missing role data

**Solutions:**

1. **Check if trigger exists:**

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. **Recreate trigger:**

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. **Test manually:**

```sql
-- Create a test profile
INSERT INTO profiles (id, email, role, full_name)
SELECT id, email, 'customer', 'Test User'
FROM auth.users
WHERE email = 'test@example.com';
```

---

## 6. Environment Variables

### ❌ "Cannot read properties of undefined"

**Symptoms:**

- Frontend can't access env variables
- `import.meta.env.VITE_SUPABASE_URL` is undefined

**Solutions:**

1. **Verify .env file exists in frontend folder**
2. **Ensure variables start with `VITE_`**
3. **Restart dev server after changing .env**

```powershell
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

**Correct .env format:**

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_URL=http://localhost:5000/api
```

❌ Wrong:

```
SUPABASE_URL=...  # Missing VITE_ prefix
```

---

## 7. Session Issues

### ❌ User gets logged out randomly

**Symptoms:**

- Session expires quickly
- Must login repeatedly

**Solutions:**

1. Check token expiration in Supabase settings
2. Implement token refresh logic
3. Check browser is storing cookies

**Add refresh logic to AuthContext:**

```jsx
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "TOKEN_REFRESHED") {
      console.log("Token refreshed");
    }
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);
```

---

## 8. Development Tools

### Useful debugging commands:

**Check if backend is running:**

```powershell
curl http://localhost:5000/api/auth/profile
```

**Check if frontend is running:**

```powershell
curl http://localhost:5173
```

**View Supabase logs:**

- Go to Dashboard → Logs → Explorer

**Check network requests:**

- Browser DevTools → Network tab
- Filter by "Fetch/XHR"

**Check authentication state:**

```javascript
// In browser console
localStorage.getItem("sb-xxxxx-auth-token");
```

---

## 9. Quick Fixes Checklist

When something goes wrong, try these in order:

- [ ] **Restart backend server**

  ```powershell
  # Ctrl+C to stop, then:
  python app.py
  ```

- [ ] **Restart frontend server**

  ```powershell
  # Ctrl+C to stop, then:
  npm run dev
  ```

- [ ] **Clear browser cache**

  - Chrome: Ctrl+Shift+Delete
  - Clear cookies and cached files

- [ ] **Check .env files**

  - Verify all required variables are set
  - No extra spaces or quotes
  - Correct Supabase credentials

- [ ] **Reinstall dependencies**

  ```powershell
  # Frontend
  cd frontend
  rm -r node_modules
  npm install

  # Backend
  cd backend
  pip install -r requirements.txt
  ```

- [ ] **Check Supabase dashboard**
  - Is the project active?
  - Are there any error logs?
  - Is the database healthy?

---

## 10. Getting More Help

### Where to look for errors:

1. **Browser Console** (F12)

   - Shows frontend JavaScript errors
   - Network requests and responses

2. **Terminal/PowerShell**

   - Backend Flask errors
   - Frontend build errors

3. **Supabase Dashboard → Logs**

   - Database errors
   - Authentication errors
   - Function logs

4. **Network Tab** (F12 → Network)
   - API request/response details
   - Status codes
   - Headers

### Logs to check:

**Frontend errors:**

```
Check: Browser Console (F12)
Look for: Red error messages
```

**Backend errors:**

```
Check: Terminal running Flask
Look for: Python stack traces
```

**Database errors:**

```
Check: Supabase Dashboard → Logs
Look for: SQL errors, RLS violations
```

---

## Need More Help?

If you're still stuck:

1. **Check the error message carefully**

   - Copy the exact error text
   - Search for it online

2. **Verify all setup steps completed**

   - Review `QUICK_START.md`
   - Ensure nothing was skipped

3. **Check Supabase documentation**

   - https://supabase.com/docs

4. **Test with minimal example**
   - Try logging in with a fresh test account
   - Use browser incognito mode

---

**Remember:** Most issues are due to:

- Missing or incorrect environment variables
- Supabase credentials not matching
- Email confirmation enabled (for testing)
- Servers not running
- Dependencies not installed

Always check these first! 🎯
