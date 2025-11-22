# 🛠️ Implementation Technical Reference

## Quick Start for Developers

### How to Add a New Entity

All CRUD pages follow the same pattern. Here's how to add a new entity:

#### 1. Create Page File
Create `src/app/dashboard/[entity]/page.tsx`

#### 2. Copy Template
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { DesktopLayout } from '@/components/desktop-layout';
import { Modal } from '@/components/modal';

export default function EntityPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Define your fields here
  });
  const { token } = useAuthStore();

  useEffect(() => {
    fetchEntities();
  }, [token]);

  const fetchEntities = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/entities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setEntities(data.data || []);
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `http://localhost:5000/api/v1/entities/${editingId}`
        : 'http://localhost:5000/api/v1/entities';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      fetchEntities();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this item?')) {
      try {
        await fetch(`http://localhost:5000/api/v1/entities/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchEntities();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ /* reset form */ });
    setIsModalOpen(true);
  };

  const handleEdit = (entity: any) => {
    setEditingId(entity.id);
    setFormData(entity);
    setIsModalOpen(true);
  };

  return (
    <DesktopLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Entities</h1>
            <p className="text-gray-600 mt-2">Manage your entities</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + New Entity
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Column 1</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Column 2</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity: any) => (
                  <tr key={entity.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{entity.field1}</td>
                    <td className="px-6 py-4">{entity.field2}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => handleEdit(entity)} className="text-blue-600">Edit</button>
                      <button onClick={() => handleDelete(entity.id)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        title={editingId ? 'Edit Entity' : 'New Entity'}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          {/* Add form inputs here */}
        </div>
      </Modal>
    </DesktopLayout>
  );
}
```

---

## 🔌 API Integration Details

### Authentication Flow
```
1. User enters credentials
2. POST /auth/login or /auth/register
3. Backend returns JWT token
4. Store token in Zustand: setToken(token)
5. All future requests include: Authorization: Bearer {token}
```

### CRUD Flow
```
Create:
  1. User clicks "+ New Entity"
  2. Modal opens with empty form
  3. User fills form
  4. User clicks Submit
  5. POST /api/v1/entity with formData
  6. Backend creates record
  7. Page refreshes with new data

Read:
  1. Page loads
  2. GET /api/v1/entity with Bearer token
  3. Backend returns all records
  4. Display in table

Update:
  1. User clicks Edit
  2. Modal opens with existing data
  3. User modifies fields
  4. User clicks Submit
  5. PUT /api/v1/entity/{id} with updated formData
  6. Backend updates record
  7. Page refreshes

Delete:
  1. User clicks Delete
  2. Confirm dialog appears
  3. If confirmed:
     DELETE /api/v1/entity/{id}
     Backend deletes record
     Page refreshes
```

---

## 📋 Component API Reference

### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;           // Show/hide modal
  title: string;             // Modal title
  onClose: () => void;       // Close handler
  onSubmit: () => void;      // Submit handler
  submitText?: string;       // Submit button text (default: "Submit")
  submitDisabled?: boolean;  // Disable submit button
  children?: React.ReactNode; // Form content
}
```

### Zustand Auth Store
```typescript
interface AuthStore {
  token: string | null;
  user: any;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  clearAuth: () => void;
}
```

---

## 🎨 Tailwind CSS Classes Used

### Colors
- **Primary:** `bg-blue-600`, `text-blue-600`
- **Success:** `bg-green-100`, `text-green-800`
- **Warning:** `bg-yellow-100`, `text-yellow-800`
- **Danger:** `bg-red-100`, `text-red-800`
- **Info:** `bg-purple-100`, `text-purple-800`

### Common Patterns
```typescript
// Button
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Action
</button>

// Badge
<span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
  Active
</span>

// Input
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />

// Table Header
<thead className="bg-gray-50 border-b">

// Table Row Hover
<tr className="border-b hover:bg-gray-50">
```

---

## 🔄 State Management Patterns

### Local Component State
```typescript
const [data, setData] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [formData, setFormData] = useState({...});
```

### Global Auth State (Zustand)
```typescript
const { token, user, setToken, setUser } = useAuthStore();
```

### Form Data Handling
```typescript
// Initialize
const [formData, setFormData] = useState({
  field1: '',
  field2: '',
  field3: 'default'
});

// Update
setFormData({ ...formData, field1: value });

// Reset
setFormData({ field1: '', field2: '', field3: 'default' });
```

---

## 🚀 Performance Optimizations

### API Calls
```typescript
// Good: Load data once on mount
useEffect(() => {
  fetchData();
}, [token]);

// Good: Refresh after operation
const handleDelete = async (id) => {
  await deleteAPI(id);
  fetchData(); // Refresh list
};

// Avoid: Fetching on every render
```

### Search/Filter
```typescript
// Good: Filter in state
useEffect(() => {
  filterData();
}, [data, searchTerm, filters]);

// Avoid: Filtering in render loop
```

---

## 🐛 Debugging Tips

### Check API Connection
```typescript
// Test API endpoint
fetch('http://localhost:5000/api/v1/work-orders', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log(data))
```

### Verify Token
```typescript
// Check stored token
const { token } = useAuthStore();
console.log('Token:', token);
```

### Debug Form Data
```typescript
// Log form on submit
const handleSubmit = () => {
  console.log('Submitting:', formData);
  // Submit...
};
```

---

## 📚 File Structure Reference

```
workix-desktop/
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── work-orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── assets/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       ├── clients/
│   │       ├── projects/
│   │       ├── sites/
│   │       ├── users/
│   │       └── ppm/
│   ├── components/
│   │   ├── modal.tsx
│   │   ├── desktop-layout.tsx
│   │   └── ...
│   ├── store/
│   │   ├── authStore.ts
│   │   └── ...
│   └── config/
│       └── api.ts
├── package.json
└── tsconfig.json
```

---

## 🔐 Security Best Practices

### ✅ Do
- Store token in Zustand (not localStorage)
- Include Bearer token in all API calls
- Check for token before making requests
- Show confirmation dialogs for delete operations
- Validate form inputs

### ❌ Don't
- Store sensitive data in state that persists across refreshes
- Make API calls without authentication
- Skip confirmation dialogs
- Trust frontend-only validation

---

## 📖 Common Task Examples

### Add a New Field to a Form
```typescript
// 1. Add to state
const [formData, setFormData] = useState({
  ...existing,
  newField: '' // Add here
});

// 2. Add input to form
<input
  value={formData.newField}
  onChange={(e) => setFormData({ ...formData, newField: e.target.value })}
  placeholder="New Field"
/>

// 3. Include in submission
const handleSubmit = async () => {
  await fetch(url, {
    body: JSON.stringify(formData) // Includes newField
  });
};
```

### Add a New Filter
```typescript
// 1. Add state
const [filterValue, setFilterValue] = useState('');

// 2. Add to filter function
const filterData = () => {
  let filtered = data;
  if (filterValue) {
    filtered = filtered.filter(item => 
      item.field === filterValue
    );
  }
  setFiltered(filtered);
};

// 3. Add UI control
<select 
  value={filterValue} 
  onChange={(e) => setFilterValue(e.target.value)}
>
  <option value="">All</option>
  <option value="value1">Value 1</option>
</select>
```

### Add a New Column to Table
```typescript
// 1. Add table header
<th className="px-6 py-3 text-left text-sm font-semibold">New Column</th>

// 2. Add table cell
<td className="px-6 py-4">{item.newField}</td>
```

---

## 🎓 Learning Resources

### Key Concepts Used
1. **React Hooks** - useState, useEffect
2. **TypeScript** - Type safety and interfaces
3. **Tailwind CSS** - Utility-first styling
4. **Zustand** - State management
5. **REST API** - HTTP methods (GET, POST, PUT, DELETE)
6. **JWT** - Token-based authentication

### Recommended Reading
- React Documentation: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Tailwind CSS: https://tailwindcss.com/docs
- Zustand: https://github.com/pmndrs/zustand

---

## ✅ Deployment Checklist

Before going to production:
- [ ] All TypeScript errors resolved
- [ ] All API endpoints tested
- [ ] Error handling verified
- [ ] Loading states working
- [ ] Modal forms functioning
- [ ] Search/filters working
- [ ] Delete confirmations working
- [ ] Token authentication secured
- [ ] No console errors
- [ ] Responsive design verified

---

## 🆘 Troubleshooting

### Issue: API calls failing
**Solution:** Check backend is running on port 5000

### Issue: Token not persisting
**Solution:** Verify Zustand store is initialized correctly

### Issue: Forms not submitting
**Solution:** Check formData state includes all required fields

### Issue: Table not updating
**Solution:** Ensure fetchData() is called after operations

### Issue: Modal not closing
**Solution:** Check onClose callback is firing

---

*Reference Documentation for Implementation*  
*Last Updated: Current Session*
