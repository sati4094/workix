# 📘 Workix Desktop - Integration & Development Guide

## Overview

This guide explains how the Workix Desktop app (Tauri + Next.js) integrates with the existing Workix backend and will help you develop new features.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Workix Desktop Application                    │
│  (Tauri Window + Next.js UI + Zustand State)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (React + TypeScript)           │  │
│  │  - Pages (Dashboard, Work Orders, etc.)          │  │
│  │  - Components (Navbar, Sidebar)                  │  │
│  │  - Tailwind CSS styling                          │  │
│  │  - Zustand state management                      │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │ invoke() calls                         │
│  ┌──────────────▼───────────────────────────────────┐  │
│  │  Tauri Rust Backend                             │  │
│  │  - System APIs                                   │  │
│  │  - HTTP client (reqwest)                         │  │
│  │  - File operations                               │  │
│  │  - Logging utilities                             │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │ HTTP requests                         │
└────────────────┼─────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │   Backend API      │
        │ (Express.js)       │
        │ :5000              │
        └────────────────────┘
                 │
        ┌────────┴─────────────┬─────────────┐
        ▼                      ▼             ▼
    PostgreSQL            Redis Cache    Google AI
```

## Communication Flow

### 1. Frontend → Rust Backend (Tauri)
```typescript
// In Next.js component
import { invoke } from '@tauri-apps/api/core';

const version = await invoke<string>('get_app_version');
```

### 2. Rust Backend → Express API
```rust
// In src-tauri/src/lib.rs
let response = reqwest::get("http://localhost:5000/api/work-orders")
    .await?
    .json::<ApiResponse<WorkOrder>>()
    .await?;
```

### 3. Frontend API Client Pattern
```typescript
// In src/lib/api-client.ts
export class DesktopApiClient {
  async getWorkOrders() {
    return this.callApi('work-orders', 'GET');
  }
  
  private async callApi(endpoint: string, method: string) {
    const response = await invoke('call_backend_api', {
      endpoint,
      method,
    });
    return response.data;
  }
}
```

## Development Workflow

### 1. Starting Development

**Terminal 1: Backend API**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2: Workix Desktop**
```bash
cd workix-desktop
npm run dev
# Starts Next.js on :3000
# Launches Tauri app
```

### 2. Making a Change

Example: Add a new "Work Orders" feature

**Step 1: Add API endpoint (if not exists)**
```javascript
// backend/src/routes/workOrder.routes.js
router.get('/list', workOrderController.getAll);
```

**Step 2: Add API client method**
```typescript
// workix-desktop/src/lib/api-client.ts
async getWorkOrders() {
  return this.get<WorkOrder[]>('work-orders/list');
}
```

**Step 3: Create page component**
```typescript
// workix-desktop/src/app/work-orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { DesktopLayout } from '@/components/desktop-layout';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([]);
  
  useEffect(() => {
    apiClient.getWorkOrders()
      .then(setWorkOrders)
      .catch(console.error);
  }, []);
  
  return (
    <DesktopLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Work Orders</h1>
        <table className="w-full">
          {/* Render workOrders */}
        </table>
      </div>
    </DesktopLayout>
  );
}
```

**Step 4: Hot reload reflects changes**
- Save file
- Next.js dev server reloads
- Tauri app reflects changes instantly

## Adding New Pages

1. **Create page directory**
```bash
mkdir -p src/app/new-feature
```

2. **Create page component**
```typescript
// src/app/new-feature/page.tsx
'use client';
import { DesktopLayout } from '@/components/desktop-layout';

export default function NewFeaturePage() {
  return (
    <DesktopLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold">New Feature</h1>
        {/* Content here */}
      </div>
    </DesktopLayout>
  );
}
```

3. **Add to sidebar menu** (optional)
```typescript
// src/components/sidebar.tsx
const menuItems = [
  // ... existing items
  { label: 'New Feature', href: '/new-feature', icon: '⭐' },
];
```

## State Management (Zustand)

### Using Auth Store
```typescript
import { useAuthStore } from '@/store';

export function MyComponent() {
  const { user, setUser, logout } = useAuthStore();
  
  return (
    <div>
      <p>Hello, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Using Data Store
```typescript
import { useDataStore } from '@/store';

export function DataComponent() {
  const { workOrders, setWorkOrders, loading, setLoading } = useDataStore();
  
  useEffect(() => {
    setLoading(true);
    apiClient.getWorkOrders()
      .then(setWorkOrders)
      .finally(() => setLoading(false));
  }, []);
  
  return loading ? <Spinner /> : <WorkOrderList orders={workOrders} />;
}
```

## API Integration Examples

### GET Request
```typescript
// Get all work orders
const workOrders = await apiClient.get<WorkOrder[]>('work-orders');

// Or use convenience method
const workOrders = await apiClient.getWorkOrders();
```

### POST Request
```typescript
// Create new work order
const newOrder = await apiClient.post<WorkOrder>(
  'work-orders',
  {
    title: 'New Work Order',
    priority: 'high',
    assetId: 'asset-123'
  }
);
```

### PUT Request
```typescript
// Update work order
const updated = await apiClient.put<WorkOrder>(
  'work-orders/123',
  { status: 'completed' }
);
```

### DELETE Request
```typescript
// Delete work order
await apiClient.delete<void>('work-orders/123');
```

## Tauri Commands

### Calling from Frontend
```typescript
import { invoke } from '@tauri-apps/api/core';

// Get app version
const version = await invoke<string>('get_app_version');

// Get system info
const info = await invoke('get_system_info');

// Log message
await invoke('log_message', { 
  level: 'info', 
  message: 'Something happened' 
});
```

### Adding New Commands (Rust)

1. **Add to `src-tauri/src/lib.rs`**
```rust
#[tauri::command]
fn my_new_command(param: String) -> String {
  format!("Hello, {}", param)
}
```

2. **Register in handler**
```rust
.invoke_handler(tauri::generate_handler![
  get_app_version,
  get_app_info,
  call_backend_api,
  log_message,
  get_system_info,
  my_new_command,  // Add here
])
```

3. **Use from TypeScript**
```typescript
const result = await invoke<string>('my_new_command', { param: 'test' });
```

## Styling with Tailwind CSS

All components use Tailwind CSS for styling. 

### Common Utilities
```html
<!-- Spacing -->
<div className="p-8 mb-4">
  <!-- padding: 2rem, margin-bottom: 1rem -->
</div>

<!-- Colors -->
<button className="bg-blue-600 text-white hover:bg-blue-700">
  Click me
</button>

<!-- Responsive -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  <!-- 1 col on mobile, 2 on tablet, 4 on desktop -->
</div>

<!-- Flexbox -->
<div className="flex items-center justify-between gap-4">
  {/* Centered vertically, space between horizontally */}
</div>
```

## Building for Distribution

### Development Build
```bash
npm run dev
# Creates dev app without optimizations
# Useful for debugging
```

### Production Build
```bash
npm run build
# Optimizes code
# Creates installer files
# Ready for distribution
```

### Platform-Specific Builds

**Windows only:**
```bash
cd src-tauri
cargo build --release --target x86_64-pc-windows-msvc
```

**macOS only:**
```bash
cd src-tauri
cargo build --release --target x86_64-apple-darwin
# And/or for Apple Silicon:
cargo build --release --target aarch64-apple-darwin
```

## Debugging Tips

### 1. Check Backend Connection
```bash
# Verify backend is running
curl http://localhost:5000/health

# Should return: {"status": "ok"}
```

### 2. Enable Debug Logging
```bash
# Terminal
RUST_LOG=debug npm run dev

# In code
await invoke('log_message', { 
  level: 'debug', 
  message: 'Debug info' 
});
```

### 3. Browser DevTools
```javascript
// In Tauri window
F12  // Open DevTools
```

### 4. Inspect State
```typescript
// In component
import { useAuthStore } from '@/store';

export function Debug() {
  const state = useAuthStore();
  console.log('Auth state:', state);
  return null;
}
```

## Common Tasks

### Task 1: Add New Work Order Status
```typescript
// backend/src/database/schema.sql
-- Update enum
CREATE TYPE work_order_status AS ENUM ('pending', 'acknowledged', 'in_progress', 'parts_pending', 'completed', 'cancelled', 'new_status');

// workix-desktop/src/app/work-orders/page.tsx
-- Update UI to show new status
const statuses = ['pending', 'acknowledged', 'in_progress', 'parts_pending', 'completed', 'cancelled', 'new_status'];
```

### Task 2: Add User Filter
```typescript
// workix-desktop/src/app/work-orders/page.tsx
const [selectedUser, setSelectedUser] = useState('');

const filtered = workOrders.filter(wo => 
  !selectedUser || wo.assignedTo === selectedUser
);

// In render:
<select onChange={(e) => setSelectedUser(e.target.value)}>
  <option value="">All Users</option>
  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
</select>
```

### Task 3: Add Real-time Updates
```typescript
// Using polling
useEffect(() => {
  const interval = setInterval(() => {
    apiClient.getWorkOrders().then(setWorkOrders);
  }, 5000); // Every 5 seconds
  
  return () => clearInterval(interval);
}, []);
```

## Testing

### Manual Testing Checklist
- [ ] App starts without errors
- [ ] All pages load
- [ ] Navigation works
- [ ] API calls succeed (backend running)
- [ ] Data displays correctly
- [ ] Window controls work (min/max/close)
- [ ] Responsive design on resize

### Automated Testing (Future)
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## Performance Optimization

1. **Code Splitting**
   - Next.js auto-splits pages
   - Dynamic imports: `const Component = dynamic(() => import('./...'))`

2. **Image Optimization**
   - Use Next.js Image component
   - Automatically optimizes and caches

3. **Bundle Analysis**
   - Install: `npm install --save-dev @next/bundle-analyzer`
   - Check bundle size

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't connect | Verify backend running on :5000, check firewall |
| Blank white screen | Check DevTools for errors (F12) |
| Hot reload not working | Restart dev server, clear .next folder |
| Build fails | Run `cargo clean` in src-tauri, reinstall deps |
| Port 3000 in use | Kill process or change port in dev config |

## Resources

- [Tauri Guide](https://tauri.app/en/v1/guides/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind Cheatsheet](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Need Help?

1. Check documentation links above
2. Review existing code for patterns
3. Check Tauri/Next.js GitHub issues
4. Post in project discussions

---

**Happy coding! 🚀**
