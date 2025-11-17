# 🔧 Mobile App API Configuration

## Issue: Login Failed Error

If you're getting "Login failed" errors, it's because the mobile app can't reach the backend server.

### Why This Happens:
- `localhost` on a mobile device refers to the device itself, NOT your computer
- You need to use your computer's IP address instead

---

## 🎯 Quick Fix (Choose Based on Your Setup)

### Option 1: Using Android Emulator ✅ (Already Configured)
The app is already set to use `http://10.0.2.2:5000/api/v1`
- `10.0.2.2` is a special IP that Android Emulator uses to reach your computer's localhost
- **No changes needed if using Android Emulator!**

### Option 2: Using Real Phone or iOS Simulator 📱

**Step 1: Find Your Computer's IP Address**

**On Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (WiFi or Ethernet)
Example: `192.168.1.100`

**On Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Step 2: Update API Configuration**

Open: `workix/mobile/src/config/api.js`

Change line 6 from:
```javascript
? 'http://10.0.2.2:5000/api/v1'
```

To (replace with YOUR IP):
```javascript
? 'http://192.168.1.100:5000/api/v1'
```

**Step 3: Make Sure Phone and Computer Are on Same WiFi**
- Both devices must be on the same network
- Turn off VPN if you have one running
- Some corporate networks block this - use a home network

---

## ✅ Testing the Connection

### Before Running the App:

**1. Make sure backend is running:**
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run dev
```

**2. Test from your phone's browser:**
Open browser on your phone and go to:
```
http://YOUR_IP_ADDRESS:5000/health
```
Example: `http://192.168.1.100:5000/health`

If you see JSON response with `"status": "healthy"`, the connection works!

**3. Now start the mobile app:**
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npm install  # Run this after updating to SDK 54
npx expo start
```

---

## 🔐 Login Credentials

After connecting successfully, use these credentials:

**Technician:**
- Email: `john.tech@workix.com`
- Password: `Tech@123`

**Admin:**
- Email: `admin@workix.com`
- Password: `Admin@123`

---

## 🐛 Still Not Working?

### Check 1: Backend is Running
Terminal should show:
```
🚀 Workix Backend Server running on port 5000
```

### Check 2: Firewall
Windows Firewall might be blocking the connection:
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Node.js and make sure both Private and Public are checked

### Check 3: Network Configuration
```powershell
# Test if port 5000 is accessible
netstat -an | findstr :5000
```
You should see `LISTENING` on port 5000

### Check 4: Clear Expo Cache
```powershell
npx expo start -c
```

---

## 📝 Quick Reference

### Current Configuration:
- **Backend**: `http://localhost:5000`
- **Mobile (Emulator)**: `http://10.0.2.2:5000/api/v1`
- **Mobile (Real Device)**: `http://YOUR_COMPUTER_IP:5000/api/v1`

### Files to Edit:
- `workix/mobile/src/config/api.js` - Line 6 (API URL)

---

## 🎉 Success Indicators

When login works, you'll see:
1. Loading indicator on login button
2. Brief success moment
3. Redirect to Home screen with work orders

If you see "Login failed" or network errors, it's an API connection issue - follow the steps above!


