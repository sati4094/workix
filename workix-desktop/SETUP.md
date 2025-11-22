# 🚀 Workix Tauri Desktop - Setup & Build Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd workix-desktop
npm install
```

### 2. Verify Requirements
Before running, make sure you have:
- ✅ Node.js 16+ (check: `node -v`)
- ✅ npm 7+ (check: `npm -v`)
- ✅ Rust 1.70+ (check: `rustc -V`) [Get it: https://www.rust-lang.org/tools/install]

### 3. Start Development
```bash
npm run dev
```

This will:
1. Launch Next.js dev server on http://localhost:3000
2. Start Tauri app that loads the Next.js frontend
3. Enable hot reload on file changes

## Build for Production

### Windows
```bash
npm run build
```
**Output:**
- `Workix-0.1.0-setup.exe` (Installer)
- `Workix_0.1.0_x64-setup.msi` (MSI Installer)
- Portable executable

### macOS
```bash
npm run build
```
**Output:**
- `Workix.app` (macOS Application Bundle)
- `Workix.dmg` (Disk Image for distribution)

### Linux
```bash
npm run build
```
**Output:**
- `workix-desktop_0.1.0_amd64.AppImage` (Universal Linux app)

## Project Architecture

```
Workix Desktop App
├── Next.js Frontend (React + TypeScript)
│   ├── Home page
│   ├── Dashboard
│   ├── Work Orders
│   ├── Assets
│   ├── Users
│   ├── Analytics
│   └── Settings
│
├── Tauri Backend (Rust)
│   ├── System info retrieval
│   ├── File operations
│   ├── API proxy to backend
│   └── Window management
│
└── Backend API (Express)
    └── Running on localhost:5000
```

## Backend API Connection

The desktop app expects your backend API running on:
```
http://localhost:5000
```

### Start Backend (from main workix folder)
```bash
cd backend
npm install
npm run dev
```

Check it's running:
```bash
curl http://localhost:5000/health
```

## Environment Setup

### For Windows Developers
1. Install [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)
2. Install [Rust](https://www.rust-lang.org/tools/install)
3. Restart terminal after installation

### For macOS Developers
1. Ensure Xcode Command Line Tools: `xcode-select --install`
2. Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

### For Linux Developers (Ubuntu/Debian)
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Available Commands

```bash
# Development
npm run dev              # Start Tauri dev app with hot reload

# Building
npm run build:web        # Build Next.js app only
npm run build            # Build final desktop app

# Production
npm start                # Start Next.js production server (for testing)

# Code quality
npm run lint             # Check TypeScript/ESLint errors

# Tauri CLI (direct)
npm run tauri dev        # Direct Tauri dev
npm run tauri build      # Direct Tauri build
npm run tauri info       # System info for debugging
```

## File Structure

```
src/
├── app/
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard
│   ├── work-orders/
│   │   └── page.tsx          # Work orders list
│   ├── assets/
│   ├── users/
│   ├── analytics/
│   └── settings/
│
├── components/
│   ├── navbar.tsx            # Top navigation
│   ├── sidebar.tsx           # Side menu
│   └── desktop-layout.tsx    # Main layout wrapper
│
├── lib/
│   └── api-client.ts         # Tauri API client
│
└── store/
    └── index.ts              # Zustand state management

src-tauri/
├── src/
│   ├── main.rs               # Entry point
│   └── lib.rs                # Tauri commands
├── tauri.conf.json           # Window config
└── Cargo.toml               # Rust dependencies
```

## Features Included

### ✅ Completed
- Window management (minimize, maximize, close)
- Responsive design with Tailwind CSS
- State management with Zustand
- API client for backend communication
- Dashboard with stats cards
- Sidebar navigation
- System information display
- TypeScript support

### 🚧 In Progress
- Work Orders page UI
- Assets management
- User management
- Analytics dashboard

### 📝 Todo
- Real-time notifications
- Offline data sync
- PDF export
- System tray integration
- Auto-update mechanism
- Database (SQLite) for offline storage

## Debugging

### Enable Rust Logging
```bash
# Windows (PowerShell)
$env:RUST_LOG = "debug"
npm run dev

# macOS/Linux
RUST_LOG=debug npm run dev
```

### View Console Output
- **Desktop App:** Opens developer console with F12
- **Browser DevTools:** Press F12 in Tauri window

### Common Issues

**Issue:** `npm run dev` fails with Rust errors
```bash
# Solution: Clean build cache
cd src-tauri
cargo clean
cd ..
npm run dev
```

**Issue:** Next.js port 3000 already in use
```bash
# Solution: Kill process or use different port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :3000
kill -9 <PID>
```

**Issue:** Tauri app won't connect to backend
- Verify backend is running: `curl http://localhost:5000/health`
- Check firewall settings
- Verify API URL in code matches backend URL

## Performance Tips

1. **Development:**
   - Keep backend running separately
   - Use npm run dev (with hot reload)
   - Monitor network tab in DevTools

2. **Production Build:**
   - Run: `npm run build`
   - Takes 3-5 minutes first time
   - Subsequent builds are faster

3. **Code Optimization:**
   - Use lazy loading for pages
   - Optimize images with Next.js Image
   - Enable gzip compression

## Deployment

### Distribution Options

1. **GitHub Releases**
   - Manually upload .exe, .dmg, .AppImage files
   - Create release notes
   - Users download directly

2. **Auto-Update**
   - Implement Tauri updater
   - Host release files on CDN
   - Automatic version checking

3. **App Stores**
   - Microsoft Store (Windows)
   - Apple App Store (macOS)
   - Snapcraft (Linux)

### Code Signing (macOS)
```bash
npm run tauri build -- --sign
```

Requires:
- Apple Developer Account
- Code signing certificate
- Provisioning profile

## Resources

- [Tauri Docs](https://tauri.app/en/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review [Tauri GitHub Issues](https://github.com/tauri-apps/tauri/issues)
3. Check [Next.js Discussions](https://github.com/vercel/next.js/discussions)

---

**Last Updated:** November 18, 2025
**Workix Version:** 0.1.0-desktop
