# ⚠️ IMPORTANT: Update CORS for Web Admin Port 3025

## 🔧 Quick Fix Needed

The web admin now runs on **port 3025** instead of 3000.

### Update Your `.env` File:

**File:** `workix/backend/.env`

**Find this line:**
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
```

**Change to:**
```env
CORS_ORIGIN=http://localhost:3025,http://localhost:19006
```

### Then Restart Backend:
```powershell
# In backend terminal:
# Press Ctrl+C to stop
# Then run:
npm run dev
```

---

## ✅ Complete .env Example

Your backend `.env` should include:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workix
DB_USER=postgres
DB_PASSWORD=your_password_here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=workix-dev-secret-key-change-in-production-12345
JWT_EXPIRES_IN=7d

# Google Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# CORS Configuration (UPDATED FOR PORT 3025!)
CORS_ORIGIN=http://localhost:3025,http://localhost:19006

# Logging
LOG_LEVEL=info
```

---

## 🎯 Why This Matters

Without updating CORS:
- ❌ Web admin can't make API calls
- ❌ Login will fail with CORS error
- ❌ Browser console shows "Access-Control-Allow-Origin" error

After updating CORS:
- ✅ Web admin connects to backend
- ✅ Login works
- ✅ All API calls succeed

---

**Don't forget to update this before starting the web admin!** 🚀


