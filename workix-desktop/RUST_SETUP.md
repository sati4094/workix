# Rust/Tauri Setup for Windows

## Status
✅ Rust installed successfully (v1.91.1)
✅ Cargo installed and configured
✅ npm dependencies installed (196 packages)
✅ Next.js frontend dev server running on http://localhost:3001
❌ **Missing: Visual Studio C++ Build Tools** (Required for Tauri native compilation)

## Frontend Status
The Next.js frontend is running successfully! You can see it at:
- **http://localhost:3001**

## Issue: Link.exe Not Found
The Rust compiler needs the MSVC linker (`link.exe`) to compile native code for Tauri.

Error:
```
error: linker `link.exe` not found
note: the msvc targets depend on the msvc linker but `link.exe` was not found
note: please ensure that Visual Studio 2017 or later, or Build Tools for Visual Studio were installed with the Visual C++ option.
```

## Solution: Install Visual Studio Build Tools

### Option 1: Download Visual Studio Build Tools (Recommended - ~5GB)
1. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Run the installer
3. Select "Desktop development with C++"
4. Install
5. Restart your computer

### Option 2: Install Visual Studio Community Edition (Full - ~10GB)
1. Download from: https://visualstudio.microsoft.com/vs/community/
2. Run installer
3. Select "Desktop development with C++"
4. Install
5. Restart your computer

### Option 3: Quick Install via Command Line (If you have admin)
```powershell
# Using Chocolatey (if installed)
choco install visualstudio2022-workload-nativedesktop

# Or using winget
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.NativeDesktop"
```

## After Installation

Once Visual Studio Build Tools are installed with C++ support:

1. **Restart PowerShell/Terminal**

2. **Run Tauri dev again**:
```powershell
cd "d:\OneDrive\Documents\GitHub\workix\workix-desktop"
npm run dev
```

3. **Expected output**:
   - Next.js dev server starts (port 3000 or 3001)
   - Rust compilation begins
   - Tauri window opens with your app
   - Hot-reload enabled for both frontend and backend

## Development Environment

### Running the App
```powershell
# Full dev mode (desktop app with hot reload)
npm run dev

# Just Next.js frontend
npm run next:dev

# Just build for production
npm run build

# Production build with Tauri
npm run tauri build
```

### Port Info
- **Next.js**: http://localhost:3000 (or 3001 if 3000 is in use)
- **Tauri app**: Native window (connects to Next.js)

## Installed Components

✅ **Rust Toolchain**
- Version: 1.91.1
- MSVC target: x86_64-pc-windows-msvc
- Location: `~/.cargo/bin`

✅ **Node.js/npm**
- Next.js 14.2.33
- Tauri CLI (global)
- All project dependencies

✅ **Tauri**
- Version: 2.9.3
- tauri-plugin-shell: 2.3.3

## Build Chain
```
npm run dev
  ↓
npm run next:dev (starts Next.js on :3000)
  ↓
cargo run (compiles Rust, starts Tauri window)
  ↓
Tauri loads http://localhost:3000 in webview
```

## Troubleshooting

### "cargo not found"
Add Rust to PATH:
```powershell
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
```

### "tauri not found"
Install Tauri CLI:
```powershell
npm install -g @tauri-apps/cli
```

### Compilation stuck/slow
This is normal on first build. Rust compilation takes 3-5 minutes for full build.

### Port already in use
- Kill Next.js process: `npx kill-port 3000`
- Kill Tauri process: Close the window

## Next Steps

1. ✅ **Install Visual Studio Build Tools** (C++ workload)
2. ✅ **Restart Terminal/Computer**
3. ✅ **Run `npm run dev`**
4. ✅ **App window will open with your Workix frontend**
5. ✅ **Edit code and see hot reload**

Your Workix Desktop app is ready for development once you have the C++ build tools!
