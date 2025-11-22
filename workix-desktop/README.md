# Workix Desktop App - Tauri + Next.js

This is the desktop version of Workix built with Tauri and Next.js.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Rust 1.70+ (for Tauri development)
- Windows 10+, macOS 10.13+, or Linux with GTK 3.6+

### Installation

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
workix-desktop/
├── src/                      # Next.js frontend
│   ├── app/                 # App Router pages
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── dashboard/       # Dashboard page
│   │   ├── work-orders/     # Work orders management
│   │   ├── assets/          # Assets management
│   │   ├── users/           # User management
│   │   ├── analytics/       # Analytics dashboard
│   │   └── settings/        # Settings page
│   ├── components/          # React components
│   │   ├── navbar.tsx       # Top navigation bar
│   │   ├── sidebar.tsx      # Side navigation menu
│   │   └── desktop-layout.tsx # Main layout wrapper
│   ├── lib/                 # Utilities
│   │   └── api-client.ts    # API client for Tauri
│   └── store/               # Zustand stores
│       └── index.ts         # State management
├── src-tauri/               # Tauri Rust backend
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   └── lib.rs           # Tauri commands
│   ├── tauri.conf.json      # Tauri configuration
│   └── Cargo.toml           # Rust dependencies
├── public/                  # Static assets
├── package.json             # npm dependencies
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS config
└── tsconfig.json            # TypeScript configuration
```

## 🔌 Features Implemented

### Frontend (Next.js)
- ✅ Modern UI with Tailwind CSS
- ✅ TypeScript support
- ✅ Client-side routing with Next.js App Router
- ✅ State management with Zustand
- ✅ Responsive design
- ✅ Sidebar navigation
- ✅ Dashboard with stats cards
- ✅ Window controls (minimize, maximize, close)

### Backend (Tauri/Rust)
- ✅ API proxy to backend (localhost:5000)
- ✅ System information retrieval
- ✅ Logging utilities
- ✅ HTTP client for API calls
- ✅ Cross-platform support

### Pages
1. **Home** - Welcome screen with app info
2. **Dashboard** - Analytics and system status
3. **Work Orders** - Stub page ready for implementation
4. **Assets** - Stub page ready for implementation
5. **Users** - Stub page ready for implementation
6. **Analytics** - Stub page ready for implementation
7. **Settings** - Stub page ready for implementation

## 🛠️ Development

### Run in Development Mode
```bash
npm run dev
```
This will:
1. Start the Next.js dev server on http://localhost:3000
2. Launch the Tauri app which loads the Next.js app
3. Hot reload on file changes

### Available Commands

```bash
# Build Next.js app
npm run build:web

# Start Next.js production server
npm start

# Lint code
npm lint

# Tauri commands
npm run tauri dev       # Dev mode
npm run tauri build     # Production build
npm run tauri info      # System info
```

## 🔗 API Integration

The desktop app communicates with the backend API through Tauri commands.

### API Client Usage
```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const orders = await apiClient.getWorkOrders();

// POST request
const result = await apiClient.post('work-orders', { /* data */ });

// Custom API call
const response = await apiClient.get<any>('custom-endpoint');
```

### Tauri Commands
```typescript
import { invoke } from '@tauri-apps/api/core';

// Call Rust backend
const version = await invoke<string>('get_app_version');

// Call backend API from Rust
const result = await invoke('call_backend_api', {
  endpoint: 'work-orders',
  method: 'GET',
});
```

## 📦 Building for Production

### Windows
```bash
npm run build
```
Generates: `workix-desktop_0.1.0_x64-setup.msi` and portable `.exe`

### macOS
```bash
npm run build
```
Generates: `Workix.dmg` (Intel) and `Workix.app.tar.gz` (Apple Silicon)

### Linux
```bash
npm run build
```
Generates: `workix-desktop_0.1.0_amd64.AppImage`

## 🔧 Configuration

### Tauri Config (`src-tauri/tauri.conf.json`)
- Window dimensions: 1400x900px
- Min size: 900x600px
- Title: "Workix - EPC Service Management"
- Security CSP enabled

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_VERSION=0.1.0
```

## 🎯 Next Steps

1. **Complete Page Implementations**
   - Add data tables for Work Orders
   - Implement search and filtering
   - Add create/edit forms

2. **Backend Integration**
   - Verify backend API is running
   - Test all API endpoints
   - Implement offline caching

3. **Advanced Features**
   - Add real-time notifications
   - Implement file upload/download
   - Add export to PDF functionality
   - System tray integration

4. **Performance Optimization**
   - Code splitting
   - Image optimization
   - Caching strategies

5. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests with Playwright

6. **Deployment**
   - Code signing for macOS/Windows
   - Auto-update mechanism
   - Distribution channels

## 📚 Resources

- [Tauri Documentation](https://tauri.app)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 🐛 Troubleshooting

### App won't start
- Make sure Node.js and Rust are installed
- Run `npm install` to install dependencies
- Check that backend API is running on port 5000

### Tauri compilation errors
- Clear Rust build cache: `cargo clean`
- Update Rust: `rustup update`
- Check prerequisites for your OS

### Next.js build errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check TypeScript errors: `npm run lint`

## 📝 License

Proprietary - Workix

## 👥 Contributors

- Workix Development Team

---

**Built with ❤️ using Tauri + Next.js**
