# 📱 Android Setup for Workix Mobile App

## Issue: Android SDK Not Found

You have 3 options to run the mobile app:

---

## ✅ **OPTION 1: Use Your Real Phone (EASIEST!)**

This is the fastest and easiest way to test the app!

### **Step 1: Install Expo Go**
- **Android:** Download "Expo Go" from Google Play Store
- **iPhone:** Download "Expo Go" from App Store

### **Step 2: Connect to Same WiFi**
Make sure your phone and computer are on the same WiFi network

### **Step 3: Start Expo**
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npx expo start
```

### **Step 4: Scan QR Code**
- **Android:** Open Expo Go → Tap "Scan QR Code"
- **iPhone:** Open Camera app → Point at QR code

### **Step 5: App Loads!**
The app will download and open on your phone!

**✅ This is the RECOMMENDED method for beginners!**

---

## ✅ **OPTION 2: Install Android Studio (For Emulator)**

If you want to use Android Emulator on your computer:

### **Step 1: Download Android Studio**
1. Go to: https://developer.android.com/studio
2. Download Android Studio
3. Install with default settings (takes 15-30 minutes)

### **Step 2: Set Up Emulator**
1. Open Android Studio
2. Click "More Actions" → "Virtual Device Manager"
3. Click "Create Device"
4. Select "Pixel 5" or any phone
5. Select "System Image" (download if needed)
6. Click "Finish"

### **Step 3: Set Environment Variable**
**Windows:**
1. Search "Environment Variables" in Windows
2. Click "Environment Variables"
3. Under "User variables", click "New"
4. Variable name: `ANDROID_HOME`
5. Variable value: `C:\Users\psath\AppData\Local\Android\Sdk`
6. Click OK
7. **IMPORTANT:** Close and reopen all terminal windows!

### **Step 4: Start Emulator**
1. Open Android Studio
2. Device Manager → Click Play ▶️ on your emulator
3. Wait for it to fully boot

### **Step 5: Run Expo**
```powershell
# Open NEW terminal (after setting ANDROID_HOME)
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npx expo start
# Press 'a' for Android
```

---

## ✅ **OPTION 3: Use Web Version (Temporary)**

While not ideal, you can test basic functionality in browser:

### **Step 1: Install Web Dependencies**
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile
npx expo install react-dom react-native-web
```

### **Step 2: Start in Web Mode**
```powershell
npx expo start --web
```

### **Step 3: Opens in Browser**
The app will open in your browser at `http://localhost:19006`

**Note:** Some features won't work perfectly in web (camera, etc.)

---

## 🎯 **RECOMMENDED: Use Real Phone!**

### **Why Option 1 is Best:**
- ✅ **Fastest** - No installation needed
- ✅ **Easiest** - Just scan QR code
- ✅ **Real Experience** - Actual mobile device
- ✅ **All Features Work** - Camera, offline, etc.
- ✅ **No Setup** - Works immediately
- ✅ **Free** - Expo Go is free

### **Steps Summary:**
1. Install Expo Go app on phone
2. Make sure phone on same WiFi as computer
3. Run `npx expo start`
4. Scan QR code
5. ✅ Done!

---

## 📝 **Current Situation:**

You're trying to run on Android emulator but:
- ❌ Android SDK not installed
- ❌ Environment variable not set
- ❌ ADB not in PATH

**Solutions:**
- 🥇 **Best:** Use real phone (5 minutes)
- 🥈 **Good:** Install Android Studio (30 minutes)
- 🥉 **Okay:** Use web version (quick but limited)

---

## 🚀 **Quick Start with Real Phone:**

### **Right Now:**

1. **Install Expo Go** on your phone (2 minutes)
   - Android: Play Store → "Expo Go"
   - iPhone: App Store → "Expo Go"

2. **Make sure you're on same WiFi** (check both devices)

3. **Your Expo should still be running** (check terminal)
   - You should see a QR code

4. **Scan the QR code:**
   - Android: Open Expo Go → Scan
   - iPhone: Open Camera → Point at code

5. **Wait for app to download** (1-2 minutes first time)

6. **App opens!** ✅

7. **Login:**
   - Email: `john.tech@workix.com`
   - Password: `Tech@123`

8. **You're in!** 🎉

---

## ⚠️ **Important for Real Phone:**

You need to update the API URL to use your computer's IP address:

### **Step 1: Find Your IP**
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

### **Step 2: Update API Config**
Edit: `workix/mobile/src/config/api.js`

Change line 6 from:
```javascript
? 'http://10.0.2.2:5000/api/v1'
```

To (use YOUR IP):
```javascript
? 'http://192.168.1.100:5000/api/v1'
```

### **Step 3: Restart Expo**
```powershell
# Stop (Ctrl+C)
npx expo start
# Scan QR code again
```

---

## 🎯 **Quick Decision Guide:**

**Want to test RIGHT NOW?**
→ Use real phone (Option 1) ✅

**Want proper development environment?**
→ Install Android Studio (Option 2)

**Just want to see it quickly?**
→ Use web version (Option 3)

---

## 💡 **Recommendation:**

**Use your real phone!** It's the fastest way to see the app working.

1. Install Expo Go (2 min)
2. Update API URL with your IP (1 min)
3. Scan QR code
4. ✅ Done!

**Total time: 5 minutes vs 30 minutes for Android Studio!**

---

## 📞 **Need Help?**

If using real phone:
1. Make sure phone and computer on same WiFi
2. Update API URL with your computer's IP
3. Backend must be running on port 5000
4. Scan QR code in Expo Go app

**The easiest path: Use your phone!** 📱

---

**What would you like to do? Install Android Studio or use your real phone?**

