# 🔧 Fix "Runtime Not Ready" Error

## 🎯 Quick Solutions (Try in Order)

### Solution 1: Clear Cache and Restart (Most Common Fix)
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile

# Clear all caches
npx expo start -c

# Or use the fix script
.\fix-runtime-error.ps1
```

---

### Solution 2: Reset Metro Bundler
```powershell
# Stop any running Expo process (Ctrl+C)

# Clear watchman (if installed)
watchman watch-del-all

# Start fresh
npx expo start -c --reset-cache
```

---

### Solution 3: Reinstall Dependencies
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile

# Remove node_modules
Remove-Item -Recurse -Force node_modules

# Clear package-lock
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Reinstall
npm install --legacy-peer-deps

# Start with clean cache
npx expo start -c
```

---

### Solution 4: Check Package.json Main Entry
Make sure `package.json` has the correct entry point:

```json
{
  "main": "node_modules/expo/AppEntry.js"
}
```

✅ This is already correct in your package.json!

---

### Solution 5: Update Expo CLI
```powershell
# Update Expo CLI globally
npm install -g expo-cli@latest

# Or use npx (no global install needed)
npx expo@latest start -c
```

---

## 🐛 Common Causes

### 1. **Cache Corruption**
- **Symptom:** "Runtime not ready" or "Runtime is not ready after 60000ms"
- **Fix:** Clear all caches (Solution 1)

### 2. **Metro Bundler Issues**
- **Symptom:** Bundle fails to load or timeout
- **Fix:** Reset Metro (Solution 2)

### 3. **Dependency Conflicts**
- **Symptom:** Module resolution errors
- **Fix:** Reinstall dependencies (Solution 3)

### 4. **Wrong Entry Point**
- **Symptom:** App doesn't load at all
- **Fix:** Check main field in package.json (Solution 4)

### 5. **Outdated Expo**
- **Symptom:** Compatibility issues
- **Fix:** Update Expo CLI (Solution 5)

---

## ✅ Step-by-Step Fix Process

### Step 1: Stop Everything
```powershell
# Press Ctrl+C in all terminal windows
# Close Android emulator if running
```

### Step 2: Clear Caches
```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile

# Option A: Use the fix script
.\fix-runtime-error.ps1

# Option B: Manual clearing
Remove-Item -Recurse -Force .expo, node_modules\.cache -ErrorAction SilentlyContinue
```

### Step 3: Start Fresh
```powershell
# Start Expo with clean cache
npx expo start -c
```

### Step 4: Launch App
```powershell
# Press 'a' for Android emulator
# Or scan QR code with Expo Go app
```

### Step 5: If Still Failing
```powershell
# Nuclear option - reinstall everything
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
npx expo start -c
```

---

## 🎯 Quick Diagnostic

Run these to check your setup:

```powershell
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Check Expo version
npx expo --version

# Check if port 19000 is available
netstat -ano | findstr :19000

# Check if port 8081 is available (Metro bundler)
netstat -ano | findstr :8081
```

---

## 🔍 What "Runtime Not Ready" Means

The error occurs when:
1. **Metro bundler** can't compile the JavaScript bundle
2. **React Native runtime** hasn't initialized in the app
3. **Expo client** can't connect to the development server
4. **Cache corruption** preventing proper initialization

---

## ⚡ Ultra Quick Fix

If you're in a hurry, try this one-liner:

```powershell
cd D:\OneDrive\Apps\AIApps\workix\workix\mobile; Remove-Item -Recurse -Force .expo, node_modules\.cache -ErrorAction SilentlyContinue; npx expo start -c
```

---

## 🆘 If Nothing Works

### Last Resort Steps:

1. **Check your package.json is correct:**
   ```json
   {
     "main": "node_modules/expo/AppEntry.js",
     "expo": "~54.0.0"
   }
   ```

2. **Verify App.js exists and is valid:**
   ```powershell
   Test-Path .\App.js
   ```

3. **Check for JavaScript errors:**
   - Look at the Metro bundler output
   - Check for red error messages
   - Fix any import/syntax errors

4. **Try on a different device/emulator:**
   - Different Android emulator
   - Real device with Expo Go
   - iOS simulator (if on Mac)

5. **Create minimal test:**
   ```javascript
   // Temporarily simplify App.js to test
   import { Text, View } from 'react-native';
   export default function App() {
     return <View><Text>Test</Text></View>;
   }
   ```

---

## 📊 Success Indicators

When fixed, you should see:

```
✓ Metro waiting on exp://192.168.1.100:8081
✓ Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

And in the Android emulator/device:
- ✅ Expo Go loads
- ✅ "Loading..." appears
- ✅ App shows login screen
- ✅ No red error screens

---

## 🎯 Most Likely Solution

**95% of "Runtime not ready" errors are fixed by:**

```powershell
npx expo start -c
```

**The `-c` flag clears cache and usually solves the problem!**

---

## 📞 Still Stuck?

Check these:
1. ✅ Backend is running (not related to runtime error, but needed later)
2. ✅ Node.js version is 18 or higher
3. ✅ No firewall blocking ports 8081 or 19000
4. ✅ Android emulator is running and functional
5. ✅ No antivirus interfering with development server

---

**Try Solution 1 first (clear cache), it works 95% of the time!** 🚀

