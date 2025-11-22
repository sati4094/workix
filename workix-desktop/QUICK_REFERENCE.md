# ⚡ Workix Desktop - Quick Reference

## 📍 Project Location
```
d:\OneDrive\Documents\GitHub\workix\workix-desktop\
```

---

## 🚀 Quick Start (Copy & Paste)

### Terminal 1: Start Backend
```bash
cd d:\OneDrive\Documents\GitHub\workix\backend
npm run dev
```

### Terminal 2: Start Desktop App
```bash
cd d:\OneDrive\Documents\GitHub\workix\workix-desktop
npm install
npm run dev
```

**🎉 App should open! Navigate with sidebar menu**

---

## 📁 File Structure at a Glance

```
workix-desktop/
├── src/                      # Next.js React app
│   ├── app/
│   │   ├── page.tsx         # Home (welcome)
│   │   ├── dashboard/       # Admin dashboard
│   │   ├── work-orders/     # Work orders list
│   │   ├── assets/          # Asset management
│   │   ├── users/           # User management
│   │   ├── analytics/       # Analytics dashboard
│   │   └── settings/        # Settings
│   ├── components/          # Reusable UI
│   ├── lib/                 # Utilities (API client)
│   └── store/               # State (Zustand)
├── src-tauri/               # Rust backend
│   └── src/lib.rs           # Tauri commands
├── SETUP.md                 # Setup guide
├── DEVELOPMENT.md           # Dev guide
└── CONVERSION_COMPLETE.md   # What's included
```

---

## 🔨 Common Commands

```bash
# Development
npm run dev              # Start with hot reload

# Building
npm run build:web        # Build Next.js only
npm run build            # Build full desktop app

# Code quality
npm run lint             # Check errors

# Direct Tauri CLI
npm run tauri dev        # Alternative to npm run dev
npm run tauri build      # Alternative build
```

---

## 🔗 Important URLs

| Service | URL | Port |
|---------|-----|------|
| **Next.js Dev** | http://localhost:3000 | 3000 |
| **Backend API** | http://localhost:5000 | 5000 |
| **Tauri App** | Native window | N/A |

---

## 📝 Making Changes

### Add New Page
```bash
# 1. Create directory
mkdir -p src/app/my-page

# 2. Create page
# src/app/my-page/page.tsx
export default function MyPage() {
  return <div>Hello</div>;
}

# 3. Add to sidebar (optional)
# src/components/sidebar.tsx
{ label: 'My Page', href: '/my-page', icon: '📄' }
```

### Add API Call
```typescript
// src/lib/api-client.ts
async getMyData() {
  return this.get<any>('my-endpoint');
}

// In component
import { apiClient } from '@/lib/api-client';

const data = await apiClient.getMyData();
```

### Use State
```typescript
import { useAuthStore } from '@/store';

const { user, setUser, logout } = useAuthStore();
```

---

## 🎨 Styling

**Tailwind CSS is pre-configured**

```jsx
<div className="p-8 bg-white rounded-lg shadow">
  <h1 className="text-3xl font-bold text-gray-900">Title</h1>
  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Click me
  </button>
</div>
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| App won't start | Backend running? `curl http://localhost:5000/health` |
| Port in use | Kill: `netstat -ano \| findstr :3000` then `taskkill /PID <PID> /F` |
| Blank screen | Check DevTools (F12) for errors |
| Build fails | `cd src-tauri && cargo clean && cd ..` |

---

## 📚 Documentation

- **Getting Started** → `SETUP.md`
- **Development** → `DEVELOPMENT.md`
- **What's Included** → `CONVERSION_COMPLETE.md`
- **Overview** → `README.md`

---

## 💾 Build Output

After `npm run build`:

```
Windows:  setup.exe + .msi + portable
macOS:    .dmg + .app
Linux:    .AppImage
```

---

## ✨ What You Have

| Component | Status |
|-----------|--------|
| Next.js 14 | ✅ Configured |
| Tauri 2 | ✅ Configured |
| TypeScript | ✅ Enabled |
| Tailwind CSS | ✅ Ready |
| Zustand State | ✅ Ready |
| API Client | ✅ Ready |
| Navbar + Sidebar | ✅ Ready |
| 7 Pages | ✅ Created |
| Documentation | ✅ Complete |

---

## 🎯 Next Steps

1. ✅ Run `npm run dev`
2. ✅ Test navigation
3. 🔲 Add data to pages
4. 🔲 Build & test installer
5. 🔲 Share with team

---

## 🆘 Need Help?

1. Check relevant `.md` file in project root
2. Look at existing code for patterns
3. DevTools: Press F12
4. Rust errors: Check `cargo build` output

---

**Start:**
```bash
cd workix-desktop && npm run dev
```

**That's it! 🚀**

---

*Last updated: Nov 18, 2025*
