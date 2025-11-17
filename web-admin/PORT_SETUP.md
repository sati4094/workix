# 🌐 Web Admin Port Configuration

## ✅ Port Changed to 3025

The web admin now runs on **port 3025** instead of the default 3000.

---

## 🔧 Configuration Updates

### 1. Web Admin Scripts Updated
The following scripts now use port 3025:
- `npm run dev` → Starts on port 3025
- `npm run start` → Production starts on port 3025

### 2. Backend CORS Configuration

You need to update the backend `.env` file to allow requests from port 3025.

**Edit:** `workix/backend/.env`

**Find this line:**
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
```

**Change to:**
```env
CORS_ORIGIN=http://localhost:3025,http://localhost:19006
```

---

## 🚀 How to Run

### Start Backend (Terminal 1):
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run dev
```
Backend runs on: `http://localhost:5000`

### Start Web Admin (Terminal 2):
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\web-admin
npm run dev
```
Web admin runs on: `http://localhost:3025`

---

## 🔐 Access the Web Admin

**URL:** `http://localhost:3025`

**Login Credentials:**
- **Admin:**
  - Email: `admin@workix.com`
  - Password: `Admin@123`

- **Analyst:**
  - Email: `analyst@workix.com`
  - Password: `Tech@123`

---

## ✅ Environment Files Checklist

### Backend `.env`:
```env
PORT=5000
CORS_ORIGIN=http://localhost:3025,http://localhost:19006
```

### Web Admin `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 🐛 Troubleshooting

### Issue: "CORS Error" in Browser Console

**Solution:** Update backend CORS_ORIGIN to include port 3025
```env
CORS_ORIGIN=http://localhost:3025,http://localhost:19006
```
Then restart backend:
```powershell
# Stop backend (Ctrl+C)
npm run dev
```

### Issue: Port 3025 Already in Use

**Check what's using the port:**
```powershell
netstat -ano | findstr :3025
```

**Kill the process:**
```powershell
# Replace PID with the number from netstat output
taskkill /PID <PID> /F
```

### Issue: Can't Access Web Admin

**Checklist:**
- [ ] Backend is running (`http://localhost:5000/health` works)
- [ ] Web admin terminal shows "Ready on http://localhost:3025"
- [ ] Browser is pointing to correct URL: `http://localhost:3025`
- [ ] `.env.local` file exists in web-admin folder

---

## 🔥 Quick Commands

```powershell
# Start web admin on port 3025
cd D:\OneDrive\Apps\AIApps\workix\workix\web-admin
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Access web admin
start http://localhost:3025
```

---

## 📊 Complete System Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | `http://localhost:5000` |
| Web Admin | 3025 | `http://localhost:3025` |
| Mobile (Expo) | 19000 | `http://localhost:19000` |
| Mobile Dev Server | 19006 | `http://localhost:19006` |

---

## ✅ Verification

After starting the web admin, you should see:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3025
- Environments: .env.local

✓ Ready in 2.5s
```

Then open your browser to `http://localhost:3025` and you'll see the login page!

---

## 🎯 Next Steps

1. **Update backend CORS** (see above)
2. **Start backend** on port 5000
3. **Start web admin** on port 3025
4. **Login** with demo credentials
5. **Start building** your dashboard and management pages!

**All set to run on port 3025!** 🚀


