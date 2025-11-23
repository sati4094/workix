# Mobile App - Quick Fix for White Screen Issue

## Problem
After login, the app shows a white screen and then goes back to the login page.

## Root Causes Fixed

### 1. API Connection Issue
**Problem**: The mobile app couldn't connect to the backend API.

**Solution**: Update the IP address in `src/config/api.js`

```javascript
BASE_URL: 'http://YOUR_COMPUTER_IP:5000/api/v1'
```

**How to find your IP**:
- Run: `.\find-ip.ps1` in the mobile folder
- Or run: `ipconfig` and look for "IPv4 Address" under your WiFi adapter
- Update the IP in `src/config/api.js`

**Current IP**: `192.168.1.13` (already updated)

### 2. Error Handling
**Problem**: When the API call failed, the HomeScreen crashed with no error message.

**Solution**: Added error handling and retry functionality in HomeScreen.

### 3. Loading State
**Problem**: AppNavigator returned `null` during loading, causing a white screen.

**Solution**: Now shows a proper loading indicator.

## How to Test

### 1. Make sure Backend is Running
```powershell
cd D:\OneDrive\Documents\GitHub\workix\backend
npm start
```

### 2. Verify IP Address
```powershell
cd mobile
.\find-ip.ps1
```

### 3. Update API Config if Needed
Edit `mobile/src/config/api.js` and change the IP address:
```javascript
BASE_URL: 'http://YOUR_IP_HERE:5000/api/v1'
```

### 4. Start Mobile App
```powershell
cd mobile
npm start
```

### 5. Test Login
- Default credentials:
  - Email: `admin@workix.com`
  - Password: `Admin@123`

## Troubleshooting

### Still Getting White Screen?

1. **Check the Expo console logs** - Look for error messages
2. **Check the Metro bundler** - Look for "ERROR" or "WARN" messages
3. **Shake your device** - Open the debug menu and check for errors
4. **Check network connectivity**:
   ```powershell
   # Test from your phone's browser:
   http://YOUR_IP:5000/api/v1/auth/login
   ```

### Connection Refused Error?

1. **Firewall**: Make sure Windows Firewall allows Node.js on port 5000
2. **Same Network**: Phone and computer must be on the same WiFi
3. **Backend Running**: Check that backend is actually running on port 5000

### App Goes Back to Login?

This means authentication is failing. Check:
1. API base URL is correct in `src/config/api.js`
2. Backend is running and accessible
3. Check Expo console for error messages

## Changes Made

### Files Modified:
1. **src/screens/home/HomeScreen.js**
   - Added error handling with try/catch
   - Added error state display
   - Added retry button
   - Added loading error state

2. **src/navigation/AppNavigator.js**
   - Added proper loading indicator
   - Added console logging for debugging
   - Fixed white screen during auth initialization

3. **src/config/api.js**
   - Updated IP from `10.0.2.2` (emulator) to `192.168.1.13` (real device)
   - Added helpful comments

4. **package.json**
   - Updated to Expo SDK 54 compatible packages

5. **.npmrc** (NEW)
   - Added `legacy-peer-deps=true` for React 19 compatibility

## Network Configuration

### For Android Emulator:
```javascript
BASE_URL: 'http://10.0.2.2:5000/api/v1'
```

### For Real Device (Android or iOS):
```javascript
BASE_URL: 'http://192.168.1.13:5000/api/v1'  // Your computer's IP
```

### For iOS Simulator:
```javascript
BASE_URL: 'http://localhost:5000/api/v1'
```

## Testing Checklist

- [ ] Backend running on port 5000
- [ ] Computer and phone on same WiFi
- [ ] IP address updated in api.js
- [ ] Expo dev server running
- [ ] Can see login screen
- [ ] Login works (no white screen)
- [ ] Dashboard loads with cards
- [ ] Can navigate to different screens

## If All Else Fails

Clear cache and restart:
```powershell
cd mobile
Remove-Item -Recurse -Force .expo, node_modules\.cache
npx expo start -c
```

Then press `r` in the terminal to reload the app on your device.
