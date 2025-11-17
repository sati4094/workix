# 🚀 Mobile App Setup - Updated to SDK 54

## ✅ Changes Made:
1. ✅ Updated to Expo SDK 54
2. ✅ Updated React Native to 0.76.5
3. ✅ Updated all dependencies to compatible versions
4. ✅ Fixed API configuration for mobile devices
5. ✅ Added IP finder script

---

## 📦 Step-by-Step Setup

### Step 1: Clean and Install Dependencies

```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile

# Remove old dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Install new dependencies (this will take 2-3 minutes)
npm install

# Clear Expo cache
npx expo start -c
```

### Step 2: Fix API Connection (IMPORTANT!)

**If using Android Emulator:**
- ✅ Already configured! Uses `http://10.0.2.2:5000/api/v1`
- No changes needed

**If using Real Phone or iOS Simulator:**

**Option A: Use the IP Finder Script**
```powershell
# Run this in PowerShell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
.\find-ip.ps1
```
This will show your IP address and tell you exactly what to change.

**Option B: Manual Method**
1. Find your IP:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. Edit `src/config/api.js` line 6:
   ```javascript
   // Change from:
   ? 'http://10.0.2.2:5000/api/v1'
   
   // To (use your actual IP):
   ? 'http://192.168.1.100:5000/api/v1'
   ```

### Step 3: Make Sure Backend is Running

```powershell
# In a separate terminal
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run dev
```

You should see:
```
🚀 Workix Backend Server running on port 5000
```

### Step 4: Test Backend Connection

**From your computer's browser:**
```
http://localhost:5000/health
```

**From your phone's browser (if using real device):**
```
http://YOUR_IP_ADDRESS:5000/health
```
Example: `http://192.168.1.100:5000/health`

Both should show:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": ...,
  "environment": "development"
}
```

### Step 5: Start the Mobile App

```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npx expo start
```

**For Android Emulator:**
- Press `a` in the terminal

**For Real Phone:**
- Install "Expo Go" from Play Store (Android) or App Store (iOS)
- Scan the QR code shown in terminal
- Make sure phone is on same WiFi as computer

**For iOS Simulator (Mac only):**
- Press `i` in the terminal

---

## 🔐 Login Credentials

**Technician Account:**
- Email: `john.tech@workix.com`
- Password: `Tech@123`

**Admin Account:**
- Email: `admin@workix.com`
- Password: `Admin@123`

---

## 🐛 Troubleshooting

### Problem: "Login Failed" Error

**Cause:** Mobile app can't connect to backend server

**Solutions:**
1. ✅ Make sure backend is running (`npm run dev` in backend folder)
2. ✅ Check you're using correct IP in `src/config/api.js`
3. ✅ For real phone: Ensure phone and computer on same WiFi
4. ✅ Test backend URL in phone's browser first
5. ✅ Check Windows Firewall isn't blocking Node.js

### Problem: Module Resolution Errors

**Solution:**
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npx expo start -c
```

### Problem: "Network Request Failed"

**Check:**
1. Backend is running: `http://localhost:5000/health` should work
2. Firewall: Allow Node.js through Windows Firewall
3. IP Address: Use correct IP for your setup
4. Network: Phone and computer on same network

### Problem: Dependencies Installation Failed

**Solution:**
```powershell
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or force
npm install --force
```

---

## 🎯 What to Expect After Login

1. **Loading screen** appears
2. **Home screen** shows with:
   - Service request inbox
   - Pending work orders
   - Bottom navigation tabs

3. **You can:**
   - View work orders
   - Tap on a work order to see details
   - Use AI to enhance text
   - Take photos
   - Update work order status
   - View PPM schedule

---

## 📊 SDK 54 New Features

- ✅ Better performance
- ✅ Updated React Native 0.76.5
- ✅ Improved stability
- ✅ Better TypeScript support
- ✅ Updated security patches

---

## 🔥 Quick Commands Reference

```powershell
# Start mobile app
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npx expo start

# Start with clean cache
npx expo start -c

# Start on Android emulator
npx expo start --android

# Start on iOS simulator (Mac only)
npx expo start --ios

# Find your IP address
.\find-ip.ps1

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Can access `http://localhost:5000/health`
- [ ] Correct IP configured in `src/config/api.js`
- [ ] Mobile dependencies installed (`npm install`)
- [ ] Expo started (`npx expo start`)
- [ ] Can login with demo credentials
- [ ] See work orders on home screen

---

## 🎉 Success!

When everything works:
1. ✅ Login screen loads quickly
2. ✅ Can enter credentials
3. ✅ Loading indicator appears
4. ✅ Redirects to Home with work orders
5. ✅ Can navigate between tabs
6. ✅ Can view work order details
7. ✅ AI enhancement works

**You're ready to use the mobile app!** 🚀

---

## 📞 Need More Help?

Check these files:
- `API_SETUP.md` - Detailed API configuration guide
- `find-ip.ps1` - Script to find your IP address
- Main `README.md` - Overall project documentation


