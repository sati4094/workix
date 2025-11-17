# 📱 How to Start the Mobile App (Correctly)

## ⚠️ Important: Don't Install Web Dependencies!

The mobile app is designed for **iOS and Android** only, NOT for web browsers.

**Don't run:**
- ❌ `npx expo install react-dom react-native-web`
- ❌ `npm run web`

These packages are for web platform and will cause conflicts.

---

## ✅ **Correct Way to Start the Mobile App:**

### **For Android Emulator (Most Common):**

```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npx expo start -c --android
```

Or:
```powershell
npx expo start -c
# Then press 'a' when prompted
```

### **For Real Phone:**

```powershell
npx expo start -c
# Scan QR code with Expo Go app
```

### **For iOS Simulator (Mac Only):**

```powershell
npx expo start -c --ios
```

---

## 🎯 **What Each Command Does:**

| Command | Purpose |
|---------|---------|
| `npx expo start` | Start Metro bundler |
| `-c` | Clear cache (recommended) |
| `--android` | Auto-launch Android emulator |
| `--ios` | Auto-launch iOS simulator |
| Press `a` | Launch Android after starting |
| Press `i` | Launch iOS after starting |
| Press `r` | Reload app |
| Press `m` | Toggle dev menu |

---

## 📋 **Step-by-Step for Beginners:**

### **Step 1: Make Sure Backend is Running**
```powershell
# In Terminal 1:
cd D:\OneDrive\Apps\AIApps\workix\workix\backend
npm run dev
```

Wait for: `🚀 Workix Backend Server running on port 5000`

### **Step 2: Start Android Emulator (If Using Emulator)**
- Open Android Studio
- Click "Device Manager"
- Start your emulator
- Wait for it to fully boot

### **Step 3: Start Mobile App**
```powershell
# In Terminal 2 (NEW):
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npx expo start -c
```

### **Step 4: Launch on Device**

**For Android Emulator:**
- Press `a` in the Expo terminal
- OR it may auto-launch if you used `--android`

**For Real Phone:**
- Install "Expo Go" app
- Scan the QR code
- Make sure phone is on same WiFi as computer

### **Step 5: Wait for App to Load**
First launch takes 1-2 minutes. You'll see:
- "Building..." progress bar
- "Opening on Android..."
- App appears on emulator/device

### **Step 6: Login**
- Email: `john.tech@workix.com`
- Password: `Tech@123`

---

## ✅ **What You Should See:**

```
Expo Terminal:
› Metro waiting on exp://192.168.1.100:8081
› Using native app from workix-mobile (1.0.0)
› Press a │ open Android
› Press r │ reload app
› Press m │ toggle menu
› shift+m │ more tools
```

Then on your device/emulator:
1. ✅ Expo splash screen
2. ✅ Blue Workix splash
3. ✅ Login screen
4. ✅ Login works!
5. ✅ Home screen with work orders

---

## 🐛 **Common Mistakes:**

### **❌ Don't Do This:**
```powershell
# These are WRONG for native mobile app:
npx expo install react-dom react-native-web
npm run web
expo start --web
```

### **✅ Do This Instead:**
```powershell
# For native mobile app:
npx expo start -c --android  # Android
npx expo start -c --ios      # iOS (Mac only)
npx expo start -c            # Choose platform
```

---

## 🔧 **If Expo Won't Start:**

### **Clear All Caches:**
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile

# Clear Expo cache
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Clear Metro cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Start fresh
npx expo start -c
```

### **Port Conflicts:**
```powershell
# Check what's using port 8081 (Metro bundler)
netstat -ano | findstr :8081

# Kill it if needed
taskkill /PID <PID> /F

# Try again
npx expo start -c
```

---

## 📱 **Supported Platforms:**

| Platform | Supported | How to Run |
|----------|-----------|------------|
| Android | ✅ Yes | `npx expo start --android` |
| iOS | ✅ Yes (Mac only) | `npx expo start --ios` |
| Web | ❌ No | Not configured (not needed) |

---

## 🎯 **Quick Reference:**

### **Current Setup:**
```
Workix Mobile App:
├── Platform: Android/iOS (native)
├── Framework: React Native + Expo
├── SDK: 54.0.0
├── Backend API: http://10.0.2.2:5000/api/v1 (emulator)
└── Features: Offline-first, AI enhancement, Photos

How to Run:
├── Backend: npm run dev (port 5000)
└── Mobile: npx expo start -c (then press 'a')
```

---

## ✅ **Success Indicators:**

When running correctly:
1. ✅ Metro bundler shows QR code
2. ✅ No "runtime not ready" errors
3. ✅ Press 'a' launches Android emulator
4. ✅ App installs and opens
5. ✅ Login screen appears
6. ✅ Can login successfully
7. ✅ See work orders list

---

## 🎉 **You're All Set!**

The mobile app is ready for Android/iOS development. **Don't install web dependencies!**

**Just run:**
```powershell
npx expo start -c
```

Then press `a` for Android! 🚀

---

## 📞 **Still Having Issues?**

The app should be starting in the background now. Wait 30-60 seconds for Metro to be ready, then check the Expo terminal for the QR code and press `a` for Android!

If you see any error messages, let me know what they say!

