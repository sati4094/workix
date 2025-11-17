# 🔍 Test Backend Connection for Web Admin

## Issue: Login Failed Error

Even with correct credentials, login fails. Let's diagnose the issue.

---

## ✅ Step 1: Verify Backend is Running

### Test in Browser:
Open: `http://localhost:5000/health`

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-17T...",
  "uptime": 123.45,
  "environment": "development"
}
```

**If you see this:** ✅ Backend is running!

**If you get error:** ❌ Backend not running - start it:
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run dev
```

---

## ✅ Step 2: Test Login API Directly

### Using PowerShell:
```powershell
# Test login endpoint
$body = @{
    email = "admin@workix.com"
    password = "Admin@123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response.Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "token": "eyJ..."
  }
}
```

**If you see this:** ✅ Backend login API works!

**If you get CORS error:** ❌ Continue to Step 3

---

## ✅ Step 3: Check CORS Configuration

### Backend .env file:
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
Get-Content .env | Select-String "CORS"
```

**Should show:**
```
CORS_ORIGIN=http://localhost:3025,http://localhost:19006
```

**If it shows port 3000:** Update it to 3025 and restart backend

---

## ✅ Step 4: Check Web Admin .env.local

```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\web-admin
Get-Content .env.local
```

**Should show:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

**If file doesn't exist:** I already created it for you!

---

## ✅ Step 5: Restart Both Servers

**IMPORTANT:** After changing .env files, you MUST restart!

### Restart Backend:
```powershell
# In backend terminal:
# Press Ctrl+C to stop
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run dev
```

### Restart Web Admin:
```powershell
# In web-admin terminal:
# Press Ctrl+C to stop
cd D:\OneDrive\Apps\AIApps\workix\workix\web-admin
npm run dev
```

---

## ✅ Step 6: Check Browser Console

1. Open web admin: `http://localhost:3025/login`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to login
5. Look for error messages

### Common Error Messages:

**"CORS policy: No 'Access-Control-Allow-Origin'"**
- ❌ CORS not configured correctly
- ✅ Fix: Update backend CORS and restart

**"Network Error" or "ERR_CONNECTION_REFUSED"**
- ❌ Backend not running
- ✅ Fix: Start backend

**"401 Unauthorized"**
- ❌ Wrong credentials
- ✅ Fix: Use correct demo credentials

**"Failed to fetch"**
- ❌ API URL wrong
- ✅ Fix: Check .env.local

---

## 🔍 Debug: Check Network Tab

1. Open **F12** Developer Tools
2. Go to **Network** tab
3. Try to login
4. Look for the POST request to `/auth/login`
5. Click on it to see:
   - Request URL (should be `http://localhost:5000/api/v1/auth/login`)
   - Status code (should be 200)
   - Response body

---

## 🎯 Most Likely Issues:

### Issue 1: Backend Not Restarted
**You changed CORS but didn't restart the backend!**
```powershell
# Stop backend (Ctrl+C)
# Restart:
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run dev
```

### Issue 2: Web Admin Cached Old Config
**Clear browser cache:**
- Press **Ctrl+Shift+Delete**
- Clear cache
- Or try **Incognito mode** (Ctrl+Shift+N)

### Issue 3: CORS Still Wrong
**Double-check backend .env:**
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
Get-Content .env | Select-String "CORS"
```
Should show: `CORS_ORIGIN=http://localhost:3025,http://localhost:19006`

---

## ✅ Complete Restart Process:

```powershell
# Terminal 1 - Backend
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
# Press Ctrl+C if running
npm run dev

# Terminal 2 - Web Admin  
cd D:\OneDrive\Apps\AIApps\workix\workix\web-admin
# Press Ctrl+C if running
npm run dev
```

Then:
1. Open browser: `http://localhost:3025/login`
2. Press **Ctrl+F5** (hard refresh)
3. Login with: `admin@workix.com` / `Admin@123`

---

## 🎉 Success Indicators:

When it works:
1. ✅ No CORS errors in console
2. ✅ Network tab shows 200 status for login request
3. ✅ Redirects to `/dashboard`
4. ✅ User is logged in

---

## 📝 Configuration Summary:

```
Backend:
├── Port: 5000
├── CORS: http://localhost:3025,http://localhost:19006
└── Running: npm run dev

Web Admin:
├── Port: 3025
├── API URL: http://localhost:5000/api/v1
└── Running: npm run dev

Test:
├── Health: http://localhost:5000/health
├── Login: http://localhost:3025/login
└── Credentials: admin@workix.com / Admin@123
```

---

**Try restarting both servers and check the browser console (F12) for the actual error message!**

What error do you see in the browser console?

