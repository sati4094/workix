# Frontend-Backend Parameter Conflicts Analysis

## Date: December 2, 2025

## Critical Issues Summary

### 1. Work Order Field Naming Conflicts

#### Database Column vs Frontend/Backend Expectations

| **Field Purpose** | **Database Column** | **Frontend Expects** | **Backend Returns** | **Status** |
|-------------------|---------------------|---------------------|---------------------|------------|
| Who reported WO | `reported_by` | `reported_by` | ❌ `created_by_name` | **CONFLICT** |
| Work order creator name | N/A | `reported_by_name` | `created_by_name` | **MISMATCH** |
| Completion timestamp | `completed_at` | `completed_at` | ❌ `actual_end` | **FIXED** |
| Start timestamp | `started_at` | `started_at` | ✅ `started_at` | OK |
| Acknowledgement time | `acknowledged_at` | `acknowledged_at` | ✅ `acknowledged_at` | OK |

---

## Detailed Conflict Analysis

### A. WORK ORDERS TABLE

#### Database Schema (Actual)
```sql
CREATE TABLE work_orders (
    id UUID PRIMARY KEY,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source work_order_source NOT NULL,
    priority work_order_priority NOT NULL,
    status work_order_status NOT NULL,
    site_id UUID NOT NULL,
    reported_by UUID,                    -- ✅ EXISTS
    assigned_to UUID,
    performance_deviation_details JSONB,
    customer_complaint_details JSONB,
    reference_pictures JSONB,
    created_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,              -- ✅ EXISTS (NOT actual_end)
    due_date TIMESTAMP,
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    customer_signature TEXT,
    customer_signed_at TIMESTAMP,
    updated_at TIMESTAMP,
    enterprise_id UUID,                  -- ✅ Added by migration
    building_id INTEGER,                 -- ✅ Added by migration
    org_id INTEGER,                      -- ⚠️ Still exists (should be removed)
    assigned_team INTEGER                -- ✅ Added by migration
);
```

#### Frontend TypeScript Interface
```typescript
export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  work_order_number?: string;
  source: WorkOrderSource;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  
  // Relationships
  site_id: string;
  site_name?: string;
  building_id?: string;
  building_name?: string;
  enterprise_id?: string;
  enterprise_name?: string;
  
  // Assignment
  assigned_to?: string;
  assigned_technician_name?: string;
  assigned_technician_phone?: string;
  reported_by?: string;                  // ✅ Matches DB
  reported_by_name?: string;             // ❌ Backend returns created_by_name
  
  // Scheduling
  due_date?: string;
  scheduled_start?: string;              // ❌ DB has started_at
  scheduled_end?: string;                // ❌ DB doesn't have this
  estimated_hours?: number;
  actual_hours?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  started_at?: string;
  completed_at?: string;                 // ✅ Matches DB now
  closed_at?: string;                    // ❌ DB doesn't have this
}
```

#### Backend Controller Query (Current - Line 77-103)
```javascript
SELECT 
  wo.*,
  s.name as site_name,
  s.address as site_address,
  s.facility_code as site_code,
  b.name as building_name,
  b.building_code,
  e.name as enterprise_name,
  e.id as enterprise_id,
  assigned_user.name as assigned_technician_name,
  assigned_user.phone as assigned_technician_phone,
  reported_user.name as reported_by_name,           // ✅ FIXED
  (SELECT COUNT(*) FROM work_order_activities WHERE work_order_id = wo.id) as activity_count,
  (SELECT json_agg(...) FROM assets a WHERE a.id = wo.asset_id) as assets
FROM work_orders wo
LEFT JOIN sites s ON wo.site_id = s.id
LEFT JOIN buildings b ON wo.building_id = b.id
LEFT JOIN enterprises e ON wo.enterprise_id = e.id
LEFT JOIN users assigned_user ON wo.assigned_to = assigned_user.id
LEFT JOIN users reported_user ON wo.reported_by = reported_user.id  // ✅ FIXED
```

#### Backend Controller getWorkOrderById (Line 142-173)
```javascript
// ❌ STILL WRONG - Line 142
reported_user.name as created_by_name,    // Should be: reported_by_name

// ❌ STILL WRONG - Line 173  
LEFT JOIN users reported_user ON wo.created_by = reported_user.id
// Should be: ON wo.reported_by = reported_user.id
```

---

### B. WORK ORDER STATUS ENUM

#### Database Enum
```sql
CREATE TYPE work_order_status AS ENUM (
  'pending',
  'acknowledged', 
  'in_progress',
  'parts_pending',
  'completed',
  'cancelled'
);
```

#### Frontend TypeScript
```typescript
export type WorkOrderStatus = 
  | 'pending'          // ✅ Matches
  | 'acknowledged'     // ✅ Matches
  | 'in_progress'      // ✅ Matches
  | 'on_hold'          // ❌ DB doesn't have this
  | 'completed'        // ✅ Matches
  | 'cancelled'        // ✅ Matches
  | 'closed';          // ❌ DB doesn't have this
```

**Missing in Frontend:**
- `parts_pending` - Database has this status but frontend doesn't

**Extra in Frontend:**
- `on_hold` - Frontend has this but database doesn't
- `closed` - Frontend has this but database doesn't

---

### C. WORK ORDER SOURCE ENUM

#### Database Enum
```sql
CREATE TYPE work_order_source AS ENUM (
  'performance_deviation',
  'customer_complaint',
  'preventive_maintenance',
  'manual'
);
```

#### Frontend TypeScript
```typescript
export type WorkOrderSource = 
  | 'manual'                    // ✅ Matches
  | 'ppm'                       // ❌ Should be 'preventive_maintenance'
  | 'performance_deviation'     // ✅ Matches
  | 'customer_complaint'        // ✅ Matches
  | 'inspection';               // ❌ DB doesn't have this
```

**Conflicts:**
- Frontend uses `'ppm'` but database expects `'preventive_maintenance'`
- Frontend has `'inspection'` which doesn't exist in database

---

### D. ENTERPRISE/CLIENT/ORGANIZATION CONFUSION

#### Current Database State
```sql
-- These tables exist:
enterprises      -- ✅ UUID primary key
clients          -- ⚠️ Still exists (legacy, should reference enterprises)
organizations    -- ❌ DROPPED (was referenced by org_id in work_orders)

-- work_orders has:
enterprise_id UUID     -- ✅ References enterprises
org_id INTEGER         -- ⚠️ Orphaned (organizations table dropped)
```

#### Frontend Expects
```typescript
interface WorkOrder {
  enterprise_id?: string;
  enterprise_name?: string;
  // No org_id or organization fields
  // No client_id or client fields (cleaned up)
}
```

#### Issues
1. `work_orders.org_id` column still exists but references dropped `organizations` table
2. Need to clean up `org_id` column from work_orders
3. Legacy `clients` table still exists - data was migrated to enterprises

---

### E. BUILDINGS/FLOORS/SPACES

#### Database Schema
```sql
buildings (id SERIAL PRIMARY KEY)     -- ✅ INTEGER type
floors (id SERIAL PRIMARY KEY)        -- ✅ INTEGER type  
spaces (id SERIAL PRIMARY KEY)        -- ✅ INTEGER type

work_orders.building_id INTEGER       -- ✅ Matches
```

#### Frontend TypeScript
```typescript
interface WorkOrder {
  building_id?: string;    // ❌ Should be number (database uses INTEGER)
  building_name?: string;
  building_code?: string;
}
```

**Type Mismatch:**
- Frontend expects `building_id` as string
- Database has `building_id` as INTEGER
- JavaScript/TypeScript will convert this automatically, but type definitions are wrong

---

### F. MISSING FIELDS IN DATABASE

#### Frontend Expects (But DB Doesn't Have)

| **Frontend Field** | **Database Column** | **Action Needed** |
|--------------------|---------------------|-------------------|
| `scheduled_start` | ❌ Missing | Add column or map to `started_at` |
| `scheduled_end` | ❌ Missing | Add column or remove from frontend |
| `closed_at` | ❌ Missing | Add column or remove from frontend |
| `work_type` | ❌ Missing | Add column or remove from frontend |
| `location` | ❌ Missing | Add column or use building/space |
| `building` (string) | `building_id` | Map to building.name via JOIN |
| `asset_id` | ❌ Missing | Work orders use work_order_assets junction table |

---

### G. ANALYTICS DASHBOARD CONFLICTS

#### Backend Query (analytics.controller.js)
```javascript
// ✅ FIXED - Now uses completed_at instead of actual_end
AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL 
  THEN EXTRACT(EPOCH FROM (completed_at - created_at))/3600 END) as avg_completion_hours
```

#### Previous Error
```javascript
// ❌ OLD - Was using non-existent column
AVG(CASE WHEN status = 'completed' AND actual_end IS NOT NULL 
  THEN EXTRACT(EPOCH FROM (actual_end - created_at))/3600 END)
```

---

## Required Fixes

### HIGH PRIORITY (Blocking)

1. **Fix getWorkOrderById Query (Line 142 & 173)**
   ```javascript
   // Change Line 142:
   reported_user.name as reported_by_name,  // was: created_by_name
   
   // Change Line 173:
   LEFT JOIN users reported_user ON wo.reported_by = reported_user.id  // was: wo.created_by
   ```

2. **Remove org_id column from work_orders**
   ```sql
   ALTER TABLE work_orders DROP COLUMN IF EXISTS org_id;
   ```

3. **Align WorkOrderStatus enum**
   - Add `parts_pending` to frontend types
   - Remove or handle `on_hold` and `closed` states
   - Or add these to database enum if needed

4. **Fix WorkOrderSource enum**
   - Change frontend `'ppm'` to `'preventive_maintenance'`
   - Or update database to accept `'ppm'` as alias

### MEDIUM PRIORITY

5. **Add missing timestamp columns**
   ```sql
   ALTER TABLE work_orders ADD COLUMN scheduled_start TIMESTAMP;
   ALTER TABLE work_orders ADD COLUMN scheduled_end TIMESTAMP;
   ALTER TABLE work_orders ADD COLUMN closed_at TIMESTAMP;
   ```

6. **Add work_type column**
   ```sql
   CREATE TYPE work_type AS ENUM ('corrective', 'preventive', 'inspection', 'emergency');
   ALTER TABLE work_orders ADD COLUMN work_type work_type;
   ```

7. **Fix building_id type in frontend**
   ```typescript
   interface WorkOrder {
     building_id?: number;  // Change from string
   }
   ```

### LOW PRIORITY

8. **Add asset_id column to work_orders**
   - Currently uses junction table `work_order_assets`
   - Add direct reference for primary asset:
   ```sql
   ALTER TABLE work_orders ADD COLUMN asset_id UUID REFERENCES assets(id);
   ```

9. **Add location field**
   ```sql
   ALTER TABLE work_orders ADD COLUMN location TEXT;
   ```

10. **Drop legacy clients table** (after confirming all migrations complete)
    ```sql
    DROP TABLE IF EXISTS clients CASCADE;
    ```

---

## Testing Checklist

- [ ] Dashboard statistics load without errors
- [ ] Work orders list displays correctly
- [ ] Work order detail page shows reporter name
- [ ] Creating new work order with ppm source works
- [ ] Status transitions work (pending → parts_pending → completed)
- [ ] Building selection and display works
- [ ] Enterprise filter works correctly
- [ ] Completion time calculations are accurate

---

## Summary

**Total Conflicts Found: 15**

**Critical (Blocking):** 3
- getWorkOrderById uses wrong column names (2 places)
- org_id references dropped table

**Important:** 4  
- Status enum mismatch (3 values)
- Source enum mismatch (ppm vs preventive_maintenance)

**Minor:** 8
- Missing timestamp fields
- Type mismatches (building_id)
- Missing work_type field
- Missing asset_id direct reference
- Legacy clients table cleanup

**Already Fixed:** 3
- ✅ actual_end → completed_at in analytics
- ✅ work order list query uses reported_by
- ✅ enterprises table structure
