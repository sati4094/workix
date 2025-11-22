# 🎨 Frontend Implementation Guide

## Quick Start - New Enterprise Features

All TypeScript interfaces are ready in `workix-desktop/src/types/enterprise.ts`

---

## 📋 Priority 1: Location Hierarchy

### Building Management Page
**Path**: `workix-desktop/src/app/dashboard/buildings/page.tsx`

```typescript
import { Building } from '@/types/enterprise';

// Features needed:
- DataTable with columns: Building Name, Site, Code, Floors, Area, Status
- Create/Edit Building Form
- Building Details Page with floors list
- Delete confirmation
```

### Floor Management
**Path**: `workix-desktop/src/app/dashboard/buildings/[id]/floors/page.tsx`

```typescript
import { Floor } from '@/types/enterprise';

// Features needed:
- Nested table within building page
- Quick add floor form
- Floor details with spaces list
```

### Space Management
**Path**: `workix-desktop/src/app/dashboard/buildings/[id]/floors/[floorId]/spaces/page.tsx`

```typescript
import { Space } from '@/types/enterprise';

// Features needed:
- Grid or list view of spaces
- Filter by space type (office, conference, storage, etc.)
- Booking button if space is bookable
```

---

## 🏢 Priority 2: Enhanced Asset Form

### Update Asset Form
**Path**: `workix-desktop/src/app/dashboard/assets/page.tsx`

**Add these fields**:
```typescript
// Location Hierarchy
<Select name="building_id" label="Building" />
<Select name="floor_id" label="Floor" />
<Select name="space_id" label="Space" />

// Asset Classification
<Select name="category_id" label="Category" />
<Select name="asset_type_id" label="Asset Type" />

// Asset Hierarchy
<Select name="parent_asset_id" label="Parent Asset" />

// Additional Fields
<Select name="criticality" label="Criticality" 
  options={['Critical', 'High', 'Medium', 'Low']} />
<Select name="condition" label="Condition" 
  options={['Excellent', 'Good', 'Fair', 'Poor']} />
<DatePicker name="purchase_date" label="Purchase Date" />
<Input name="purchase_price" label="Purchase Price" type="number" />
<Input name="expected_life" label="Expected Life (months)" type="number" />
```

---

## 📝 Priority 3: Enhanced Work Order Form

### Add Work Order Tasks Tab
**Path**: `workix-desktop/src/app/dashboard/work-orders/[id]/page.tsx`

```typescript
import { WorkOrderTask } from '@/types/enterprise';

<Tabs>
  <TabList>
    <Tab>Details</Tab>
    <Tab>Tasks</Tab>
    <Tab>Parts</Tab>
    <Tab>Labor</Tab>
    <Tab>Comments</Tab>
  </TabList>
  
  <TabPanel>
    {/* Existing work order details */}
  </TabPanel>
  
  <TabPanel>
    <TaskList workOrderId={id}>
      <TaskItem 
        sequence={1} 
        name="Inspect equipment"
        isCompleted={true}
        completedBy="John Doe"
      />
    </TaskList>
    <AddTaskButton />
  </TabPanel>
  
  <TabPanel>
    <PartsUsedTable>
      <PartsRow 
        partNumber="P-001" 
        partName="Filter"
        quantity={2}
        unitCost={45.00}
        totalCost={90.00}
      />
    </PartsUsedTable>
    <AddPartButton />
  </TabPanel>
  
  <TabPanel>
    <LaborLog>
      <LaborEntry 
        technician="John Doe"
        startTime="2024-11-22 08:00"
        endTime="2024-11-22 12:00"
        hours={4}
        rate={75.00}
        totalCost={300.00}
      />
    </LaborLog>
    <LogLaborButton />
  </TabPanel>
  
  <TabPanel>
    <CommentThread>
      <Comment 
        author="Jane Smith"
        text="Equipment is running smoothly now"
        timestamp="2024-11-22 14:30"
        isInternal={false}
      />
    </CommentThread>
    <AddCommentButton />
  </TabPanel>
</Tabs>
```

---

## 📦 Priority 4: Parts Inventory

### Parts List Page
**Path**: `workix-desktop/src/app/dashboard/inventory/parts/page.tsx`

```typescript
import { Part, PartStock } from '@/types/enterprise';

// Features:
- DataTable with: Part Number, Name, Category, Unit Cost, Total Stock
- Stock level indicators (Low Stock badge in red)
- Quick actions: Add Stock, Transfer, Adjust
- Filter by: Category, Storeroom, Low Stock
- Search by part number or name
```

### Storeroom Management
**Path**: `workix-desktop/src/app/dashboard/inventory/storerooms/page.tsx`

```typescript
import { Storeroom } from '@/types/enterprise';

// Features:
- List of storerooms with part count
- Create new storeroom
- View parts in storeroom
- Stock transfer wizard
```

### Part Transaction History
**Path**: `workix-desktop/src/app/dashboard/inventory/transactions/page.tsx`

```typescript
import { PartTransaction } from '@/types/enterprise';

// Features:
- Transaction log table
- Filter by: Type (IN/OUT/TRANSFER), Date Range, Part, Work Order
- Export to CSV
- Charts: Stock levels over time
```

---

## 🤝 Priority 5: Vendor Management

### Vendor List Page
**Path**: `workix-desktop/src/app/dashboard/vendors/page.tsx`

```typescript
import { Vendor } from '@/types/enterprise';

// Features:
- DataTable: Name, Type, Contact, Rating, Active Contracts
- Filter by vendor type
- Rating display (stars)
- Quick actions: View Details, New Contract, Edit, Deactivate
```

### Vendor Details Page
**Path**: `workix-desktop/src/app/dashboard/vendors/[id]/page.tsx`

```typescript
import { Vendor, VendorContact, VendorContract } from '@/types/enterprise';

// Sections:
1. Vendor Info Card
2. Contacts List (with primary indicator)
3. Active Contracts Table
4. Contract History
5. Performance Metrics (optional)
```

---

## 🔧 Priority 6: PM Templates

### PM Template Builder
**Path**: `workix-desktop/src/app/dashboard/pm-templates/page.tsx`

```typescript
import { PMTemplate, PMTemplateTask } from '@/types/enterprise';

// Features:
- Template list with asset type filter
- Create Template Form:
  * Name, Description
  * Asset Type
  * Estimated Duration
  * Task Checklist (drag-to-reorder)
    - Task Name
    - Description
    - Mandatory checkbox
- Clone template button
- Apply to assets button
```

### PM Schedule Calendar
**Path**: `workix-desktop/src/app/dashboard/pm-schedules/page.tsx`

```typescript
import { PMSchedule } from '@/types/enterprise';

// Views:
- Calendar view (monthly)
- List view with next due date
- Create schedule form:
  * Asset selection
  * Template selection (optional)
  * Frequency (Daily/Weekly/Monthly/Yearly/Meter)
  * Frequency value (e.g., every 2 weeks)
  * Start date
  * Assigned technician
- Bulk generate work orders button
```

---

## 👥 Priority 7: Team Management

### Teams Page
**Path**: `workix-desktop/src/app/dashboard/teams/page.tsx`

```typescript
import { Team, TeamMember } from '@/types/enterprise';

// Features:
- Team cards grid
- Each card shows:
  * Team name
  * Team lead
  * Member count
  * Active work orders assigned to team
- Create team button
- Team details modal with member list
- Add/Remove members
- Assign team lead
```

---

## 📅 Priority 8: Booking System

### Booking Calendar
**Path**: `workix-desktop/src/app/dashboard/bookings/page.tsx`

```typescript
import { Booking } from '@/types/enterprise';

// Features:
- Calendar view (day/week/month)
- Space/Asset selector
- Create booking modal:
  * Space or Asset selection
  * Date and time range picker
  * Title
  * Description
  * Number of attendees
  * Conflict detection
- Color-coded by status
- Quick actions: Cancel, Reschedule
```

---

## 💡 Priority 9: Utility Tracking

### Utility Meters
**Path**: `workix-desktop/src/app/dashboard/utilities/meters/page.tsx`

```typescript
import { UtilityMeter } from '@/types/enterprise';

// Features:
- Meter list grouped by type (Electricity, Water, Gas, Steam)
- Last reading display
- Add reading button
- Consumption chart (monthly)
```

### Meter Readings
**Path**: `workix-desktop/src/app/dashboard/utilities/readings/page.tsx`

```typescript
import { UtilityReading } from '@/types/enterprise';

// Features:
- Reading entry form
- Reading history table
- Automatic consumption calculation
- Cost tracking
- Export reports
- Charts: Consumption trends, Cost analysis
```

---

## 📊 Priority 10: Reporting & Analytics

### Report Builder
**Path**: `workix-desktop/src/app/dashboard/reports/builder/page.tsx`

```typescript
import { Report } from '@/types/enterprise';

// Wizard steps:
1. Select Module (Work Orders, Assets, etc.)
2. Choose Report Type (Table, Chart, Dashboard)
3. Select Columns
4. Add Filters
5. Configure Grouping
6. Set Sorting
7. Chart Config (if chart type)
8. Save & Share

// Features:
- Drag-and-drop column selection
- Filter builder with operators (equals, contains, greater than, etc.)
- Preview results
- Save as template
- Share with team
```

---

## 🎯 Quick Win Components

### Create these reusable components first:

#### 1. LocationSelector Component
```typescript
// components/LocationSelector.tsx
interface Props {
  siteId?: string;
  buildingId?: number;
  floorId?: number;
  spaceId?: number;
  onChange: (location: LocationData) => void;
}

// Cascading dropdowns: Site → Building → Floor → Space
```

#### 2. AssetCategorySelector Component
```typescript
// components/AssetCategorySelector.tsx
interface Props {
  categoryId?: number;
  assetTypeId?: number;
  onChange: (selection: { categoryId?: number, assetTypeId?: number }) => void;
}

// Two-level dropdown: Category → Type
```

#### 3. TaskChecklist Component
```typescript
// components/TaskChecklist.tsx
interface Props {
  tasks: WorkOrderTask[];
  onToggle: (taskId: number, completed: boolean) => void;
  onAdd: (taskName: string) => void;
  onDelete: (taskId: number) => void;
  editable?: boolean;
}
```

#### 4. PartSelector Component
```typescript
// components/PartSelector.tsx
interface Props {
  selectedParts: WorkOrderPart[];
  onAdd: (part: Part, quantity: number) => void;
  onRemove: (partId: number) => void;
}

// Search parts, add quantity, show total cost
```

#### 5. LaborLogForm Component
```typescript
// components/LaborLogForm.tsx
interface Props {
  workOrderId: string;
  onSubmit: (labor: CreateLaborLog) => void;
}

// Technician, Start/End time, automatic hours calculation
```

---

## 🔌 API Service Layer

### Create API service methods:

```typescript
// services/api/enterprise.ts

export const enterpriseApi = {
  // Buildings
  getBuildings: (params: PaginationParams) => 
    api.get<PaginatedResponse<Building>>('/buildings', { params }),
  createBuilding: (data: CreateBuildingForm) => 
    api.post<Building>('/buildings', data),
  updateBuilding: (id: number, data: Partial<Building>) => 
    api.put<Building>(`/buildings/${id}`, data),
  deleteBuilding: (id: number) => 
    api.delete(`/buildings/${id}`),
    
  // Floors
  getFloors: (buildingId: number) => 
    api.get<Floor[]>(`/buildings/${buildingId}/floors`),
  createFloor: (data: CreateFloorForm) => 
    api.post<Floor>('/floors', data),
    
  // Spaces
  getSpaces: (floorId: number) => 
    api.get<Space[]>(`/floors/${floorId}/spaces`),
  createSpace: (data: CreateSpaceForm) => 
    api.post<Space>('/spaces', data),
    
  // Asset Categories
  getAssetCategories: () => 
    api.get<AssetCategory[]>('/asset-categories'),
  getAssetTypes: (categoryId: number) => 
    api.get<AssetType[]>(`/asset-categories/${categoryId}/types`),
    
  // Work Order Tasks
  getWorkOrderTasks: (workOrderId: string) => 
    api.get<WorkOrderTask[]>(`/work-orders/${workOrderId}/tasks`),
  createWorkOrderTask: (workOrderId: string, data: CreateTaskForm) => 
    api.post<WorkOrderTask>(`/work-orders/${workOrderId}/tasks`, data),
  toggleTaskComplete: (taskId: number, completed: boolean) => 
    api.patch<WorkOrderTask>(`/work-order-tasks/${taskId}`, { is_completed: completed }),
    
  // Parts
  getParts: (params: PaginationParams & PartFilters) => 
    api.get<PaginatedResponse<Part>>('/parts', { params }),
  createPart: (data: CreatePartForm) => 
    api.post<Part>('/parts', data),
  getPartStock: (partId: number) => 
    api.get<PartStock[]>(`/parts/${partId}/stock`),
  createPartTransaction: (data: CreatePartTransactionForm) => 
    api.post<PartTransaction>('/part-transactions', data),
    
  // Vendors
  getVendors: (params: PaginationParams & VendorFilters) => 
    api.get<PaginatedResponse<Vendor>>('/vendors', { params }),
  createVendor: (data: CreateVendorForm) => 
    api.post<Vendor>('/vendors', data),
  getVendorContracts: (vendorId: number) => 
    api.get<VendorContract[]>(`/vendors/${vendorId}/contracts`),
    
  // PM Templates
  getPMTemplates: (params?: PaginationParams) => 
    api.get<PaginatedResponse<PMTemplate>>('/pm-templates', { params }),
  createPMTemplate: (data: CreatePMTemplateForm) => 
    api.post<PMTemplate>('/pm-templates', data),
    
  // PM Schedules
  getPMSchedules: (params?: PaginationParams) => 
    api.get<PaginatedResponse<PMSchedule>>('/pm-schedules', { params }),
  createPMSchedule: (data: CreatePMScheduleForm) => 
    api.post<PMSchedule>('/pm-schedules', data),
  generateWorkOrders: (scheduleIds: number[]) => 
    api.post('/pm-schedules/generate-work-orders', { scheduleIds }),
    
  // Teams
  getTeams: () => 
    api.get<Team[]>('/teams'),
  createTeam: (data: CreateTeamForm) => 
    api.post<Team>('/teams', data),
  addTeamMember: (teamId: number, accountId: string) => 
    api.post<TeamMember>(`/teams/${teamId}/members`, { accountId }),
    
  // Bookings
  getBookings: (params?: { start?: string, end?: string, spaceId?: number }) => 
    api.get<Booking[]>('/bookings', { params }),
  createBooking: (data: CreateBookingForm) => 
    api.post<Booking>('/bookings', data),
    
  // Utility Meters
  getUtilityMeters: (params?: { siteId?: string, utilityType?: string }) => 
    api.get<UtilityMeter[]>('/utility-meters', { params }),
  createUtilityReading: (data: CreateUtilityReadingForm) => 
    api.post<UtilityReading>('/utility-readings', data),
};
```

---

## 🎨 UI/UX Best Practices

### Use Shadcn/UI components:
- `DataTable` - For all list views
- `Form` + `FormField` - For all forms
- `Dialog` - For modals
- `Select` - For dropdowns
- `Calendar` - For date pickers
- `Tabs` - For multi-section pages
- `Card` - For information display
- `Badge` - For status indicators
- `Button` - Consistent styling

### Status Badges Color Coding:
```typescript
const statusColors = {
  // Work Orders
  pending: 'yellow',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'gray',
  
  // Assets
  operational: 'green',
  maintenance: 'orange',
  down: 'red',
  retired: 'gray',
  
  // Bookings
  confirmed: 'green',
  cancelled: 'red',
  
  // Vendors
  active: 'green',
  expired: 'red',
  draft: 'gray',
};
```

---

## 📱 Mobile Responsiveness

All new pages should be mobile-responsive:
- Use responsive grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Tables should be scrollable on mobile
- Forms should stack vertically on mobile
- Use bottom sheets for mobile modals

---

## ✅ Testing Checklist

For each new feature:
- [ ] API endpoint returns expected data
- [ ] Form validation works
- [ ] Create operation succeeds
- [ ] Update operation succeeds
- [ ] Delete operation with confirmation works
- [ ] Pagination works (if applicable)
- [ ] Filters work correctly
- [ ] Search works
- [ ] Mobile responsive
- [ ] Loading states display
- [ ] Error messages display
- [ ] Success messages display

---

## 🚀 Deployment Checklist

Before deploying:
1. [ ] Run database migration
2. [ ] Verify all tables created
3. [ ] Test all new API endpoints
4. [ ] Build frontend without errors
5. [ ] Test all new pages
6. [ ] Update user documentation
7. [ ] Train users on new features
8. [ ] Monitor for errors after deployment

---

## 📚 Next Steps

1. **Week 1**: Buildings, Floors, Spaces + Enhanced Asset Form
2. **Week 2**: Work Order Tasks, Parts, Labor + Parts Inventory
3. **Week 3**: Vendor Management + PM Templates
4. **Week 4**: Teams + Bookings + Utility Tracking
5. **Week 5**: Reporting + Analytics + Polish

---

**Questions?** Refer to:
- `backend/src/types/index.ts` - Backend types
- `workix-desktop/src/types/enterprise.ts` - Frontend types
- `ENTERPRISE_MIGRATION_COMPLETE.md` - Database documentation
