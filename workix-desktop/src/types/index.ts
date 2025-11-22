// ============================================================================
// Core Entity Types - Production Ready
// ============================================================================

export type WorkOrderStatus = 
  | 'pending' 
  | 'acknowledged' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled' 
  | 'closed';

export type WorkOrderPriority = 
  | 'critical' 
  | 'high' 
  | 'medium' 
  | 'low';

export type WorkOrderSource = 
  | 'manual' 
  | 'ppm' 
  | 'performance_deviation' 
  | 'customer_complaint' 
  | 'inspection';

export type ActivityType = 
  | 'observation' 
  | 'action_taken' 
  | 'recommendation' 
  | 'status_change' 
  | 'comment' 
  | 'parts_used';

export type AssetStatus = 
  | 'operational' 
  | 'down' 
  | 'maintenance' 
  | 'retired' 
  | 'disposed';

export type UserRole = 
  | 'admin' 
  | 'manager' 
  | 'analyst' 
  | 'technician' 
  | 'client';

export type UserStatus = 
  | 'active' 
  | 'inactive' 
  | 'suspended';

export type PPMScheduleType = 
  | 'calendar' 
  | 'meter' 
  | 'hybrid';

export type PPMFrequency = 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'quarterly' 
  | 'semi_annual' 
  | 'annual';

// ============================================================================
// Work Order Types
// ============================================================================

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  source: WorkOrderSource;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  
  // Relationships
  site_id: string;
  site_name?: string;
  site_address?: string;
  project_id?: string;
  project_name?: string;
  client_id?: string;
  client_name?: string;
  
  // Location details
  building?: string;
  location?: string;
  
  // Assignment
  assigned_to?: string;
  assigned_technician_name?: string;
  assigned_technician_phone?: string;
  reported_by?: string;
  reported_by_name?: string;
  
  // Scheduling
  due_date?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_hours?: number;
  actual_hours?: number;
  
  // Details
  performance_deviation_details?: Record<string, any>;
  customer_complaint_details?: Record<string, any>;
  reference_pictures?: string[];
  
  // Assets
  assets?: Asset[];
  asset_ids?: string[];
  
  // Activities
  activities?: WorkOrderActivity[];
  activity_count?: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  started_at?: string;
  completed_at?: string;
  closed_at?: string;
}

export interface WorkOrderActivity {
  id: string;
  work_order_id: string;
  activity_type: ActivityType;
  description: string;
  ai_enhanced?: boolean;
  original_text?: string;
  pictures?: string[];
  parts_used?: PartUsed[];
  created_by: string;
  created_by_name?: string;
  created_at: string;
}

export interface PartUsed {
  part_name: string;
  part_number?: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
}

// ============================================================================
// Asset Types
// ============================================================================

export interface Asset {
  id: string;
  name: string;
  asset_tag: string;
  type: string;
  category?: string;
  
  // Location
  site_id: string;
  site_name?: string;
  location?: string;
  
  // Parent-child hierarchy
  parent_asset_id?: string;
  parent_asset_name?: string;
  children?: Asset[];
  
  // Details
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  description?: string;
  specifications?: Record<string, any>;
  
  // Status
  status: AssetStatus;
  condition?: string;
  criticality?: 'critical' | 'high' | 'medium' | 'low';
  
  // Financial
  purchase_date?: string;
  purchase_cost?: number;
  current_value?: number;
  warranty_expiry?: string;
  
  // Maintenance
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_history?: MaintenanceHistory[];
  
  // Meters
  meter_type?: 'hours' | 'cycles' | 'distance' | 'production';
  meter_reading?: number;
  meter_unit?: string;
  last_meter_reading_date?: string;
  
  // Documents
  documents?: string[];
  pictures?: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface MaintenanceHistory {
  work_order_id: string;
  work_order_title: string;
  completed_date: string;
  technician: string;
  cost: number;
  description: string;
}

// ============================================================================
// Client, Project, Site Types
// ============================================================================

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  industry?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  client_name?: string;
  manager_id?: string;
  manager_name?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  sites?: Site[];
  site_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  name: string;
  project_id: string;
  project_name?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  assets?: Asset[];
  asset_count?: number;
  work_orders?: WorkOrder[];
  work_order_count?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  job_title?: string;
  employee_id?: string;
  certifications?: string[];
  skills?: string[];
  assigned_work_orders?: number;
  completed_work_orders?: number;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

// ============================================================================
// PPM Types
// ============================================================================

export interface PPMSchedule {
  id: string;
  name: string;
  description?: string;
  
  // Asset association
  asset_id: string;
  asset_name?: string;
  asset_tag?: string;
  
  // Schedule type
  schedule_type: PPMScheduleType;
  
  // Calendar-based
  frequency?: PPMFrequency;
  frequency_value?: number; // e.g., every 2 weeks
  next_due_date?: string;
  last_completed_date?: string;
  
  // Meter-based
  meter_threshold?: number;
  current_meter_reading?: number;
  
  // Work order template
  work_order_template?: {
    title: string;
    description: string;
    priority: WorkOrderPriority;
    estimated_hours?: number;
    checklist?: string[];
    required_parts?: string[];
  };
  
  // Assignment
  assigned_to?: string;
  assigned_technician_name?: string;
  
  // Status
  is_active: boolean;
  compliance_rate?: number; // % of PM completed on time
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Inventory Types (New - Like Maximo)
// ============================================================================

export interface InventoryItem {
  id: string;
  part_number: string;
  part_name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  supplier?: string;
  
  // Stock management
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_point: number;
  reorder_quantity: number;
  unit_of_measure: string;
  
  // Cost
  unit_cost: number;
  total_value: number;
  last_purchase_price?: number;
  
  // Location
  storeroom?: string;
  bin_location?: string;
  
  // Status
  status: 'active' | 'obsolete' | 'discontinued';
  is_critical: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: 'draft' | 'submitted' | 'approved' | 'received' | 'cancelled';
  total_amount: number;
  line_items: PurchaseOrderLine[];
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderLine {
  id: string;
  inventory_item_id: string;
  part_number: string;
  part_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// ============================================================================
// Filter and Search Types
// ============================================================================

export interface WorkOrderFilters {
  status?: WorkOrderStatus | WorkOrderStatus[];
  priority?: WorkOrderPriority | WorkOrderPriority[];
  assigned_to?: string;
  site_id?: string;
  source?: WorkOrderSource;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AssetFilters {
  type?: string;
  category?: string;
  status?: AssetStatus;
  site_id?: string;
  criticality?: string;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

// ============================================================================
// Dashboard and Analytics Types
// ============================================================================

export interface DashboardStats {
  work_orders: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
  assets: {
    total: number;
    operational: number;
    down: number;
    maintenance: number;
  };
  technicians: {
    total: number;
    active: number;
    average_workload: number;
  };
  ppm: {
    total_schedules: number;
    due_this_week: number;
    due_this_month: number;
    compliance_rate: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

// ============================================================================
// Form Types
// ============================================================================

export interface WorkOrderFormData {
  title: string;
  description: string;
  source: WorkOrderSource;
  priority: WorkOrderPriority;
  status?: WorkOrderStatus;
  site_id: string;
  asset_ids?: string[];
  assigned_to?: string;
  due_date?: string;
  estimated_hours?: number;
  performance_deviation_details?: Record<string, any>;
  customer_complaint_details?: Record<string, any>;
  reference_pictures?: string[];
}

export interface AssetFormData {
  name: string;
  asset_tag: string;
  type: string;
  category?: string;
  site_id: string;
  parent_asset_id?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  description?: string;
  status: AssetStatus;
  criticality?: 'critical' | 'high' | 'medium' | 'low';
  purchase_date?: string;
  purchase_cost?: number;
  warranty_expiry?: string;
}

export interface PPMFormData {
  name: string;
  description?: string;
  asset_id: string;
  schedule_type: PPMScheduleType;
  frequency?: PPMFrequency;
  frequency_value?: number;
  meter_threshold?: number;
  work_order_template: {
    title: string;
    description: string;
    priority: WorkOrderPriority;
    estimated_hours?: number;
    checklist?: string[];
  };
  assigned_to?: string;
  is_active: boolean;
}

// ============================================================================
// DTO Types (for Create/Update operations)
// ============================================================================

export type CreateWorkOrderDTO = Omit<WorkOrder, 'id' | 'wo_number' | 'created_by' | 'created_at' | 'updated_at' | 'completed_at' | 'closed_at'>;
export type UpdateWorkOrderDTO = Partial<CreateWorkOrderDTO>;

export type CreateAssetDTO = Omit<Asset, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAssetDTO = Partial<CreateAssetDTO>;

export type CreateClientDTO = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClientDTO = Partial<CreateClientDTO>;

export type CreateProjectDTO = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'completed_at'>;
export type UpdateProjectDTO = Partial<CreateProjectDTO>;

export type CreateSiteDTO = Omit<Site, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSiteDTO = Partial<CreateSiteDTO>;

export type CreateUserDTO = Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login'>;
export type UpdateUserDTO = Partial<Omit<CreateUserDTO, 'password'>>;

export type CreatePPMScheduleDTO = Omit<PPMSchedule, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'last_generated'>;
export type UpdatePPMScheduleDTO = Partial<CreatePPMScheduleDTO>;

// ============================================================================
// Advanced Features - Templates, SLA, Inventory
// ============================================================================

export interface WorkOrderTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  priority: WorkOrderPriority;
  estimated_hours?: number;
  default_checklist?: string[];
  required_parts?: { part_id: string; quantity: number; }[];
  instructions?: string;
  safety_notes?: string;
  attachments?: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SLAPolicy {
  id: string;
  name: string;
  description?: string;
  priority: WorkOrderPriority;
  response_time_hours: number;
  resolution_time_hours: number;
  escalation_enabled: boolean;
  escalation_1_hours?: number;
  escalation_1_notify?: string[];
  escalation_2_hours?: number;
  escalation_2_notify?: string[];
  escalation_3_hours?: number;
  escalation_3_notify?: string[];
  business_hours_only: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SLAViolation {
  id: string;
  work_order_id: string;
  work_order_number?: string;
  sla_policy_id: string;
  sla_policy_name?: string;
  violation_type: 'response' | 'resolution';
  expected_time: string;
  actual_time?: string;
  delay_hours?: number;
  escalation_level: number;
  notified_users?: string[];
  resolution_notes?: string;
  created_at: string;
}

export interface AssetRelationship {
  id: string;
  parent_asset_id: string;
  parent_asset_name?: string;
  child_asset_id: string;
  child_asset_name?: string;
  relationship_type: 'contains' | 'powers' | 'feeds';
  created_at: string;
}

export interface InventoryItem {
  id: string;
  part_number: string;
  name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  unit_of_measure: string;
  unit_cost: number;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity: number;
  location?: string;
  barcode?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartsUsage {
  id: string;
  work_order_id: string;
  inventory_item_id: string;
  part_number?: string;
  part_name?: string;
  quantity_used: number;
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
  used_by?: string;
  used_by_name?: string;
  used_at: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'return';
  quantity: number;
  unit_cost?: number;
  reference_type?: 'work_order' | 'purchase_order' | 'adjustment';
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface WorkOrderAttachment {
  id: string;
  work_order_id: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_url: string;
  description?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  uploaded_at: string;
}

export interface AssetDocument {
  id: string;
  asset_id: string;
  document_type: 'manual' | 'warranty' | 'drawing' | 'certificate' | 'photo';
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_url: string;
  description?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  uploaded_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: 'work_order' | 'sla_violation' | 'escalation' | 'assignment' | 'inventory';
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  is_read: boolean;
  read_at?: string;
  sent_via?: { email?: boolean; push?: boolean; sms?: boolean; };
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];
  user_id?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// DTO Types for Advanced Features
export type CreateTemplateDTO = Omit<WorkOrderTemplate, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTemplateDTO = Partial<CreateTemplateDTO>;

export type CreateSLAPolicyDTO = Omit<SLAPolicy, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSLAPolicyDTO = Partial<CreateSLAPolicyDTO>;

export type CreateInventoryItemDTO = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateInventoryItemDTO = Partial<CreateInventoryItemDTO>;

export type CreateAttachmentDTO = Omit<WorkOrderAttachment, 'id' | 'uploaded_at'>;
export type CreateDocumentDTO = Omit<AssetDocument, 'id' | 'uploaded_at'>;
